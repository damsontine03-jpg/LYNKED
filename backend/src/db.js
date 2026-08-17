import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseDir = path.resolve(__dirname, '../../database')

export let usingNeon = false

let pool = null
let sqlite = null

function toPg(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

export async function query(sql, params = []) {
  if (pool) {
    const result = await pool.query(toPg(sql), params)
    return result.rows
  }
  const stmt = sqlite.prepare(sql)
  return params.length ? stmt.all(...params) : stmt.all()
}

export async function queryOne(sql, params = []) {
  if (pool) {
    const result = await pool.query(toPg(sql), params)
    return result.rows[0]
  }
  const stmt = sqlite.prepare(sql)
  return (params.length ? stmt.get(...params) : stmt.get()) ?? undefined
}

export async function execute(sql, params = []) {
  if (pool) {
    await pool.query(toPg(sql), params)
    return
  }
  sqlite.prepare(sql).run(...params)
}

export async function withTransaction(fn) {
  if (pool) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const tx = {
        execute: (sql, params = []) => client.query(toPg(sql), params),
      }
      const result = await fn(tx)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  sqlite.exec('BEGIN')
  try {
    const result = await fn({
      execute: async (sql, params = []) => {
        sqlite.prepare(sql).run(...params)
      },
    })
    sqlite.exec('COMMIT')
    return result
  } catch (error) {
    sqlite.exec('ROLLBACK')
    throw error
  }
}

export async function initDb() {
  const DATABASE_URL = process.env.DATABASE_URL?.trim()
  if (process.env.NODE_ENV === 'production' && !DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production. Add your Neon Postgres connection string.')
  }
  usingNeon = Boolean(DATABASE_URL)
  if (usingNeon) {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
      max: 8,
    })
    const schema = fs.readFileSync(path.join(databaseDir, 'schema.pg.sql'), 'utf8')
    await pool.query(schema)
    console.log('Connected to Neon Postgres')
    await ensureExtraColumns()
    return
  }

  const dbPath = path.join(databaseDir, 'homework-tracker.db')
  sqlite = new DatabaseSync(dbPath)
  sqlite.exec('PRAGMA foreign_keys = ON')
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec(fs.readFileSync(path.join(databaseDir, 'schema.sql'), 'utf8'))
  const userCount = sqlite.prepare('SELECT COUNT(*) AS n FROM users').get()
  if (Number(userCount.n) === 0) {
    sqlite.exec(fs.readFileSync(path.join(databaseDir, 'seed.sql'), 'utf8'))
  }
  console.log('Using local SQLite (set DATABASE_URL to use Neon)')
  await ensureExtraColumns()
}

async function ensureExtraColumns() {
  const columns = [
    ['users', 'class_names'],
    ['users', 'subjects'],
    ['users', 'child_id'],
    ['users', 'child_email'],
    ['users', 'public_id'],
    ['otp_codes', 'class_names'],
    ['otp_codes', 'subjects'],
    ['otp_codes', 'child_id'],
    ['otp_codes', 'child_email'],
    ['exams', 'kind'],
  ]
  for (const [table, column] of columns) {
    if (pool) {
      await pool.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} TEXT`,
      )
      continue
    }
    const info = sqlite.prepare(`PRAGMA table_info(${table})`).all()
    if (!info.some((col) => col.name === column)) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`)
    }
  }
  if (pool) {
    await pool.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT con.conname, rel.relname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
          WHERE nsp.nspname = 'public'
            AND con.contype = 'c'
            AND (
              (rel.relname = 'users' AND pg_get_constraintdef(con.oid) ILIKE '%role%')
              OR (rel.relname = 'messages' AND pg_get_constraintdef(con.oid) ILIKE '%sender_role%')
            )
        LOOP
          EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.relname, r.conname);
        END LOOP;
      END $$;
    `)
    try {
      await pool.query(
        `ALTER TABLE users ADD CONSTRAINT users_role_check
         CHECK (role IN ('student', 'teacher', 'admin', 'parent'))`,
      )
    } catch (error) {
      if (!String(error.message || error).includes('already exists')) throw error
    }
    try {
      await pool.query(
        `ALTER TABLE messages ADD CONSTRAINT messages_sender_role_check
         CHECK (sender_role IN ('student', 'teacher', 'admin', 'parent'))`,
      )
    } catch (error) {
      if (!String(error.message || error).includes('already exists')) throw error
    }
  }
  await ensurePublicIds()
}

const PUBLIC_ID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function rolePublicPrefix(role) {
  if (role === 'teacher') return 'TCH'
  if (role === 'parent') return 'PAR'
  if (role === 'admin') return 'ADM'
  return 'STU'
}

function randomPublicCode(length = 6) {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += PUBLIC_ID_ALPHABET[bytes[i] % PUBLIC_ID_ALPHABET.length]
  }
  return out
}

export function normalizePublicId(value) {
  const compact = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  for (const prefix of ['STU', 'TCH', 'PAR', 'ADM']) {
    if (compact.startsWith(prefix) && compact.length > prefix.length) {
      return `${prefix}-${compact.slice(prefix.length)}`
    }
  }
  return compact
}

export async function nextPublicId(role) {
  for (let i = 0; i < 16; i++) {
    const publicId = `${rolePublicPrefix(role)}-${randomPublicCode()}`
    const existing = await queryOne('SELECT id FROM users WHERE public_id = ?', [publicId])
    if (!existing) return publicId
  }
  throw new Error('Could not assign a unique ID.')
}

export async function findStudentByPublicId(value) {
  const publicId = normalizePublicId(value)
  const raw = String(value ?? '').trim()
  if (!publicId && !raw) return null
  if (publicId) {
    const byPublic = await queryOne(
      "SELECT * FROM users WHERE role = 'student' AND public_id = ?",
      [publicId],
    )
    if (byPublic) return byPublic
  }
  if (!raw) return null
  return queryOne("SELECT * FROM users WHERE role = 'student' AND id = ?", [raw])
}

async function ensurePublicIds() {
  const missing = await query(
    "SELECT id, role FROM users WHERE public_id IS NULL OR public_id = ''",
  )
  for (const row of missing) {
    await execute('UPDATE users SET public_id = ? WHERE id = ?', [
      await nextPublicId(row.role),
      row.id,
    ])
  }
  try {
    await execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id ON users(public_id)')
  } catch (error) {
    if (!String(error.message || error).includes('already exists')) throw error
  }
}

export function parseStringList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
  }
  if (value == null || value === '') return []
  const text = String(value).trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parseStringList(parsed)
  } catch {
    // comma separated fallback
  }
  return [...new Set(text.split(',').map((item) => item.trim()).filter(Boolean))]
}

export function encodeStringList(values) {
  return JSON.stringify(parseStringList(values))
}

export function subjectCode(name) {
  const known = {
    Biology: 'BIO',
    Chemistry: 'CHE',
    Physics: 'PHY',
    Mathematics: 'MTH',
    English: 'ENG',
    Science: 'SCI',
    History: 'HIS',
    Geography: 'GEO',
    'Computer Science': 'CSC',
    Other: 'OTH',
  }
  if (known[name]) return known[name]
  const letters = String(name).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
  return letters || 'SUB'
}

export function mapUser(row) {
  if (!row) return null
  const classNames = parseStringList(row.class_names)
  const subjects = parseStringList(row.subjects)
  const className = classNames[0] || row.class_name || ''
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    className,
    classNames: classNames.length ? classNames : className ? [className] : [],
    subject: subjects[0] || undefined,
    subjects,
    phone: row.phone || undefined,
    publicId: row.public_id || undefined,
    childId: row.child_id || undefined,
    childEmail: row.child_email || undefined,
    childName: row.child_name || undefined,
  }
}

export function mapHomework(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    subject: row.subject,
    due_date: row.due_date,
    status: row.status,
    assigned_by: row.assigned_by,
    teacher_id: row.teacher_id,
    student_id: row.student_id,
    priority: row.priority ?? undefined,
    created_at: row.created_at,
  }
}

export function mapNotification(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    read: Boolean(Number(row.read)),
  }
}

export function mapMessage(row) {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_role: row.sender_role,
    body: row.body,
    created_at: row.created_at,
  }
}

export async function getReportCard(id) {
  const card = await queryOne('SELECT * FROM report_cards WHERE id = ?', [id])
  if (!card) return null
  const results = await query(
    'SELECT subject, score, grade, remark FROM report_card_results WHERE report_card_id = ? ORDER BY subject',
    [id],
  )
  return {
    id: card.id,
    student_id: card.student_id,
    student_name: card.student_name,
    className: card.class_name,
    term: card.term,
    results,
    average: card.average,
    overall_grade: card.overall_grade,
    position: card.position,
    teacher_remark: card.teacher_remark,
    published: Boolean(Number(card.published)),
    updated_at: card.updated_at,
  }
}

export function mapClass(row) {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    teacher_id: row.teacher_id,
    teacher_name: row.teacher_name,
    student_count: Number(row.student_count),
  }
}

export function mapSubject(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    teacher_id: row.teacher_id,
    teacher_name: row.teacher_name,
    className: row.class_name,
  }
}

export function mapAssignment(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    className: row.class_name,
    topic: row.topic,
    instructions: row.instructions ?? '',
    attachment: row.attachment_name
      ? { name: row.attachment_name, sizeLabel: row.attachment_size || 'None' }
      : undefined,
    posted_at: row.posted_at,
    due_date: row.due_date,
    max_marks: Number(row.max_marks),
    teacher_id: row.teacher_id,
    teacher_name: row.teacher_name,
    status: row.status,
  }
}

export function mapSubmission(row) {
  return {
    id: row.id,
    assignment_id: row.assignment_id,
    student_id: row.student_id,
    student_name: row.student_name,
    file: row.file_name
      ? { name: row.file_name, sizeLabel: row.file_size || 'None' }
      : undefined,
    comment: row.comment ?? undefined,
    submitted_at: row.submitted_at ?? undefined,
    status: row.status,
    score: row.score == null ? undefined : Number(row.score),
    feedback: row.feedback ?? undefined,
    graded_at: row.graded_at ?? undefined,
  }
}

export function mapEvent(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    location: row.location,
    description: row.description ?? '',
    organizer: row.organizer,
    published: Boolean(Number(row.published)),
  }
}

export function mapExam(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    duration: row.duration,
    room: row.room,
    className: row.class_name,
    published: Boolean(Number(row.published)),
    kind: row.kind === 'exam' ? 'exam' : 'class',
  }
}

export function mapAnnouncement(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: row.date,
    priority: row.priority,
    author: row.author,
    published: Boolean(Number(row.published)),
  }
}

export function mapGameScore(row) {
  return {
    game_id: row.game_id,
    high_score: Number(row.high_score),
    last_played: row.last_played ?? undefined,
    favorite: Boolean(Number(row.favorite)),
  }
}

export function normalizeClassName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export const DEFAULT_CLASS = 'Class 1'

export function classLevel(name) {
  const text = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
  if (text.startsWith('JSS') || text.startsWith('JS ')) return 'Junior Secondary'
  if (text.startsWith('SSS') || text.startsWith('SS ')) return 'Senior Secondary'
  return 'Primary'
}

function compactClassName(value) {
  return normalizeClassName(value).replace(/\s+/g, '').replace(/^sss/, 'ss')
}

function sssParts(value) {
  const compact = compactClassName(value)
  const match = compact.match(/^ss([123])(art|arts|commercial|commerce|science|sci)?$/)
  if (!match) return null
  const stream = {
    art: 'art',
    arts: 'art',
    commercial: 'commercial',
    commerce: 'commercial',
    science: 'science',
    sci: 'science',
  }[match[2]] || ''
  return { year: match[1], stream }
}

export function classMatches(studentClass, assignmentClass) {
  const student = normalizeClassName(studentClass)
  const assigned = normalizeClassName(assignmentClass)
  if (!assigned || assigned === 'whole school') return true
  if (!student) return true
  if (student === assigned) return true
  if (compactClassName(student) === compactClassName(assigned)) return true

  const studentSss = sssParts(student)
  const assignedSss = sssParts(assigned)
  if (studentSss || assignedSss) {
    if (!studentSss || !assignedSss) return false
    return studentSss.year === assignedSss.year && studentSss.stream === assignedSss.stream
  }

  return student.includes(assigned) || assigned.includes(student)
}

export function studentsForClass(students, className) {
  const matched = students.filter((student) =>
    classMatches(student.className, className),
  )
  return matched.length > 0 ? matched : students
}

export async function listStudents() {
  const rows = await query(
    "SELECT * FROM users WHERE role = 'student' ORDER BY name",
  )
  return rows.map(mapUser)
}

export async function listTeachers() {
  const rows = await query(
    "SELECT * FROM users WHERE role = 'teacher' ORDER BY name",
  )
  return rows.map(mapUser)
}

export async function listParents() {
  const rows = await query(
    "SELECT * FROM users WHERE role = 'parent' ORDER BY name",
  )
  return rows.map(mapUser)
}

export function userTeachesClass(user, className) {
  const names = user.classNames?.length
    ? user.classNames
    : user.className
      ? [user.className]
      : []
  return names.some((name) => classMatches(name, className))
}

export async function teachersForClassName(className) {
  const teachers = await listTeachers()
  const classRows = await query('SELECT * FROM classes')
  const subjectRows = await query('SELECT * FROM subjects')
  const ids = new Set()
  for (const teacher of teachers) {
    if (userTeachesClass(teacher, className)) ids.add(teacher.id)
  }
  for (const row of classRows) {
    if (classMatches(row.name, className)) ids.add(row.teacher_id)
  }
  for (const row of subjectRows) {
    if (classMatches(row.class_name, className)) ids.add(row.teacher_id)
  }
  return teachers.filter((teacher) => ids.has(teacher.id))
}

export async function getTeacher() {
  return queryOne("SELECT * FROM users WHERE role = 'teacher' LIMIT 1")
}

export async function conversationIdFor(studentId) {
  const teacher = await getTeacher()
  return `conv-${teacher.id}-${studentId}`
}

export async function ensureConversation(participantId, teacherRow = null) {
  const teacher = teacherRow || (await getTeacher())
  if (!teacher || !participantId) return null
  const teacherId = teacher.id
  const id = `conv-${teacherId}-${participantId}`
  await execute(
    `INSERT INTO conversations (id, teacher_id, student_id)
     VALUES (?, ?, ?)
     ON CONFLICT (teacher_id, student_id) DO NOTHING`,
    [id, teacherId, participantId],
  )
  return id
}

export async function bootstrap(user) {
  user = (await queryOne('SELECT * FROM users WHERE id = ?', [user.id])) || user
  const students = await listStudents()
  const teachers = await listTeachers()
  const parents = await listParents()
  const teacherRow = await getTeacher()
  const teacher = mapUser(teacherRow)
  const childRow = user.child_id
    ? await queryOne('SELECT * FROM users WHERE id = ?', [user.child_id])
    : null
  const child = mapUser(childRow)
  const viewerStudentId = user.role === 'parent' ? user.child_id : user.id
  const viewerClass =
    user.role === 'parent' ? childRow?.class_name || user.class_name : user.class_name
  const mappedUser = {
    ...mapUser(user),
    className: viewerClass || mapUser(user).className,
    childName: child?.name,
    childEmail: child?.email || user.child_email,
    childPublicId: child?.publicId,
  }
  const nameById = Object.fromEntries(
    [...students, ...teachers, ...parents, mappedUser, child]
      .filter(Boolean)
      .map((u) => [u.id, u.name]),
  )

  const homeworkRows =
    user.role === 'teacher'
      ? await query(
          'SELECT * FROM homework WHERE teacher_id = ? ORDER BY due_date ASC',
          [user.id],
        )
      : user.role === 'admin'
        ? await query('SELECT * FROM homework ORDER BY due_date ASC')
        : viewerStudentId
          ? await query(
              'SELECT * FROM homework WHERE student_id = ? ORDER BY due_date ASC',
              [viewerStudentId],
            )
          : []

  const assignmentRowsRaw =
    user.role === 'student' || user.role === 'parent'
      ? await query(
          "SELECT * FROM assignments WHERE status = 'published' ORDER BY due_date ASC",
        )
      : user.role === 'teacher'
        ? await query(
            'SELECT * FROM assignments WHERE teacher_id = ? ORDER BY due_date ASC',
            [user.id],
          )
        : await query('SELECT * FROM assignments ORDER BY due_date ASC')
  const assignmentRows =
    user.role === 'student' || user.role === 'parent'
      ? assignmentRowsRaw.filter((row) =>
          classMatches(viewerClass, row.class_name),
        )
      : assignmentRowsRaw

  const assignmentIds = assignmentRows.map((row) => row.id)
  const submissionRows = assignmentIds.length
    ? user.role === 'student' || user.role === 'parent'
      ? viewerStudentId
        ? await query(
            `SELECT * FROM submissions
             WHERE student_id = ? AND assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
            [viewerStudentId, ...assignmentIds],
          )
        : []
      : await query(
          `SELECT * FROM submissions WHERE assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
          assignmentIds,
        )
    : []

  const cardRows =
    user.role === 'teacher' || user.role === 'admin'
      ? await query('SELECT id FROM report_cards ORDER BY position ASC')
      : viewerStudentId
        ? await query(
            'SELECT id FROM report_cards WHERE student_id = ? AND published = 1 ORDER BY position ASC',
            [viewerStudentId],
          )
        : []

  const notifications = (
    await query(
      `SELECT * FROM notifications
       WHERE user_id = ? OR user_id = 'all'
       ORDER BY created_at DESC`,
      [user.id],
    )
  ).map(mapNotification)

  const classRows = await query('SELECT * FROM classes ORDER BY name')
  const subjectRows = await query('SELECT * FROM subjects ORDER BY name')
  const eventRows =
    user.role === 'admin'
      ? await query('SELECT * FROM events ORDER BY date ASC')
      : await query('SELECT * FROM events WHERE published = 1 ORDER BY date ASC')
  const examRows =
    user.role === 'student' || user.role === 'parent'
      ? await query(
          'SELECT * FROM exams WHERE published = 1 AND class_name = ? ORDER BY date ASC',
          [viewerClass],
        )
      : user.role === 'admin'
        ? await query('SELECT * FROM exams ORDER BY date ASC')
        : await query('SELECT * FROM exams WHERE published = 1 ORDER BY date ASC')
  const announcementRows =
    user.role === 'admin'
      ? await query('SELECT * FROM announcements ORDER BY date DESC')
      : await query(
          'SELECT * FROM announcements WHERE published = 1 ORDER BY date DESC',
        )
  const gameScoreRows = await query(
    'SELECT * FROM game_scores WHERE user_id = ?',
    [user.id],
  )

  let pairs = []
  if (user.role === 'teacher') {
    const myNames = parseStringList(user.class_names)
    if (user.class_name && !myNames.includes(user.class_name)) myNames.unshift(user.class_name)
    const myStudentIds = new Set(
      students
        .filter((s) => myNames.some((name) => classMatches(s.className, name)))
        .map((s) => s.id),
    )
    const relatedParents = parents.filter((p) => {
      if (!p.childId) return false
      return myStudentIds.size ? myStudentIds.has(p.childId) : true
    })
    pairs = await Promise.all([
      ...students.map(async (s) => ({
        id: await ensureConversation(s.id, user),
        participant: s,
      })),
      ...relatedParents.map(async (p) => ({
        id: await ensureConversation(p.id, user),
        participant: {
          ...p,
          childName: students.find((s) => s.id === p.childId)?.name,
        },
      })),
    ])
  } else if (user.role === 'parent') {
    const classTeachers = await teachersForClassName(viewerClass)
    const list = classTeachers.length ? classTeachers : teacher ? [teacher] : []
    pairs = await Promise.all(
      list.map(async (t) => ({
        id: await ensureConversation(user.id, t),
        participant: t,
      })),
    )
  } else if (user.role === 'student' && teacher) {
    pairs = [
      {
        id: await ensureConversation(user.id, teacherRow),
        participant: teacher,
      },
    ]
  }

  const rawMessages =
    user.role === 'teacher'
      ? await query(
          `SELECT m.* FROM messages m
           JOIN conversations c ON c.id = m.conversation_id
           WHERE c.teacher_id = ?
           ORDER BY m.created_at ASC`,
          [user.id],
        )
      : await query(
          `SELECT m.* FROM messages m
           JOIN conversations c ON c.id = m.conversation_id
           WHERE c.student_id = ?
           ORDER BY m.created_at ASC`,
          [user.id],
        )
  const allMessages = rawMessages.map((row) => ({
    ...mapMessage(row),
    sender_name: nameById[row.sender_id] || 'Member',
  }))

  const conversations = []
  for (const { id, participant } of pairs) {
    if (!id || !participant) continue
    const convMessages = allMessages.filter((m) => m.conversation_id === id)
    const lastMessage = convMessages[convMessages.length - 1]
    const readRow = await queryOne(
      'SELECT read_at FROM conversation_reads WHERE user_id = ? AND conversation_id = ?',
      [user.id, id],
    )
    const readAt = readRow?.read_at
    const unread = convMessages.filter(
      (m) =>
        m.sender_id !== user.id &&
        (!readAt || new Date(m.created_at).getTime() > new Date(readAt).getTime()),
    ).length
    conversations.push({
      id,
      kind: 'dm',
      participant_id: participant.id,
      participant_name:
        participant.role === 'parent' && participant.childName
          ? `${participant.name} (parent of ${participant.childName})`
          : participant.name,
      participant_role: participant.role,
      online: participant.role === 'teacher',
      lastMessage,
      unread,
    })
  }

  return {
    user: mappedUser,
    students,
    teachers,
    parents: parents.map((p) => ({
      ...p,
      childName: students.find((s) => s.id === p.childId)?.name,
      childPublicId: students.find((s) => s.id === p.childId)?.publicId,
      className: students.find((s) => s.id === p.childId)?.className || p.className,
    })),
    classes: classRows.map(mapClass),
    subjects: subjectRows.map(mapSubject),
    homework: homeworkRows.map(mapHomework),
    assignments: assignmentRows.map(mapAssignment),
    submissions: submissionRows.map(mapSubmission),
    reportCards: await Promise.all(cardRows.map((row) => getReportCard(row.id))),
    notifications,
    conversations,
    messages: allMessages,
    events: eventRows.map(mapEvent),
    exams: examRows.map(mapExam),
    announcements: announcementRows.map(mapAnnouncement),
    gameScores: gameScoreRows.map(mapGameScore),
  }
}
