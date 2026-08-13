import fs from 'node:fs'
import path from 'node:path'
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
    ['otp_codes', 'class_names'],
    ['otp_codes', 'subjects'],
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

export function classMatches(studentClass, assignmentClass) {
  const student = normalizeClassName(studentClass)
  const assigned = normalizeClassName(assignmentClass)
  if (!assigned || assigned === 'whole school') return true
  if (!student) return true
  if (student === assigned) return true
  const compact = (value) => value.replace(/\s+/g, '').replace(/^sss/, 'ss')
  if (compact(student) === compact(assigned)) return true
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

export async function getTeacher() {
  return queryOne("SELECT * FROM users WHERE role = 'teacher' LIMIT 1")
}

export async function conversationIdFor(studentId) {
  const teacher = await getTeacher()
  return `conv-${teacher.id}-${studentId}`
}

export async function ensureConversation(studentId) {
  const teacher = await getTeacher()
  if (!teacher) return null
  const id = `conv-${teacher.id}-${studentId}`
  await execute(
    `INSERT INTO conversations (id, teacher_id, student_id)
     VALUES (?, ?, ?)
     ON CONFLICT (teacher_id, student_id) DO NOTHING`,
    [id, teacher.id, studentId],
  )
  return id
}

export async function bootstrap(user) {
  user = (await queryOne('SELECT * FROM users WHERE id = ?', [user.id])) || user
  const students = await listStudents()
  const teachers = await listTeachers()
  const teacherRow = await getTeacher()
  const teacher = mapUser(teacherRow)
  const nameById = Object.fromEntries(
    [...students, ...teachers, mapUser(user)]
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
        : await query(
            'SELECT * FROM homework WHERE student_id = ? ORDER BY due_date ASC',
            [user.id],
          )

  const assignmentRowsRaw =
    user.role === 'student'
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
    user.role === 'student'
      ? assignmentRowsRaw.filter((row) =>
          classMatches(user.class_name, row.class_name),
        )
      : assignmentRowsRaw

  const assignmentIds = assignmentRows.map((row) => row.id)
  const submissionRows = assignmentIds.length
    ? user.role === 'student'
      ? await query(
          `SELECT * FROM submissions
           WHERE student_id = ? AND assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
          [user.id, ...assignmentIds],
        )
      : await query(
          `SELECT * FROM submissions WHERE assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
          assignmentIds,
        )
    : []

  const cardRows =
    user.role === 'teacher' || user.role === 'admin'
      ? await query('SELECT id FROM report_cards ORDER BY position ASC')
      : await query(
          'SELECT id FROM report_cards WHERE student_id = ? AND published = 1 ORDER BY position ASC',
          [user.id],
        )

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
    user.role === 'student'
      ? await query(
          'SELECT * FROM exams WHERE published = 1 AND class_name = ? ORDER BY date ASC',
          [user.class_name],
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

  const pairs =
    user.role === 'teacher'
      ? await Promise.all(
          students.map(async (s) => ({
            id: await ensureConversation(s.id),
            participant: s,
          })),
        )
      : teacher
        ? [
            {
              id: await ensureConversation(user.id),
              participant: teacher,
            },
          ]
        : []

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
      participant_name: participant.name,
      participant_role: participant.role,
      online: participant.role === 'teacher',
      lastMessage,
      unread,
    })
  }

  return {
    user: mapUser(user),
    students,
    teachers,
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
