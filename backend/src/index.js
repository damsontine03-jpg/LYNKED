import './env.js'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import {
  bootstrap,
  execute,
  initDb,
  listStudents,
  mapUser,
  parseStringList,
  encodeStringList,
  query,
  queryOne,
  studentsForClass,
  subjectCode,
  usingNeon,
  withTransaction,
  DEFAULT_CLASS,
  classLevel,
  nextPublicId,
  findStudentByPublicId,
} from './db.js'
import { emailConfigured, sendInviteEmail, sendOtpEmail, sendAssignmentEmail } from './mail.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000
const OTP_TTL_MS = 10 * 60 * 1000
const OTP_RESEND_MS = 45 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  }),
)
app.use(express.json())

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function hashOtp(email, code) {
  const secret = process.env.OTP_SECRET || 'homework-tracker-otp'
  return sha256(`${code}|${email}|${secret}`)
}

function hashToken(token) {
  return sha256(token)
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function parseRole(value) {
  if (value === 'teacher' || value === 'admin' || value === 'student' || value === 'parent') {
    return value
  }
  return 'student'
}

function isStaff(role) {
  return role === 'teacher' || role === 'admin'
}

function listsFromBody(body, fallbackClass = DEFAULT_CLASS) {
  const classNames = parseStringList(body?.classNames ?? body?.className ?? fallbackClass)
  const subjects = parseStringList(body?.subjects ?? body?.subject)
  return {
    classNames: classNames.length ? classNames : [fallbackClass],
    subjects,
  }
}

async function saveTeacherLoad(teacherId, teacherName, classNames, subjects) {
  const classes = classNames.length ? classNames : [DEFAULT_CLASS]
  const subjectNames = subjects.length ? subjects : []
  for (const className of classes) {
    const existing = await queryOne(
      'SELECT id FROM classes WHERE name = ? AND teacher_id = ?',
      [className, teacherId],
    )
    if (!existing) {
      await execute(
        `INSERT INTO classes (id, name, level, teacher_id, teacher_name, student_count)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [`class-${crypto.randomUUID()}`, className, classLevel(className), teacherId, teacherName],
      )
    }
  }
  for (const subject of subjectNames) {
    for (const className of classes) {
      const existing = await queryOne(
        'SELECT id FROM subjects WHERE name = ? AND teacher_id = ? AND class_name = ?',
        [subject, teacherId, className],
      )
      if (!existing) {
        await execute(
          `INSERT INTO subjects (id, name, code, teacher_id, teacher_name, class_name)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `sub-${crypto.randomUUID()}`,
            subject,
            subjectCode(subject),
            teacherId,
            teacherName,
            className,
          ],
        )
      }
    }
  }
}

async function insertUserRecord({
  id,
  name,
  email,
  role,
  classNames,
  subjects,
  childId = null,
  childEmail = null,
}) {
  const classes = classNames.length ? classNames : [DEFAULT_CLASS]
  const publicId = await nextPublicId(role)
  await execute(
    `INSERT INTO users (
      id, name, email, phone, role, class_name, class_names, subjects,
      verification_key, child_id, child_email, public_id
    )
     VALUES (?, ?, ?, '', ?, ?, ?, ?, 'otp', ?, ?, ?)`,
    [
      id,
      name,
      email,
      role,
      classes[0],
      encodeStringList(classes),
      encodeStringList(subjects),
      childId,
      childEmail,
      publicId,
    ],
  )
  if (role === 'teacher') {
    await saveTeacherLoad(id, name, classes, subjects)
  }
  return publicId
}

async function resolveChildStudent(rawId) {
  const childPublicId = String(rawId ?? '').trim()
  if (!childPublicId) {
    return { error: 'Enter your child\'s student ID.' }
  }
  const child = await findStudentByPublicId(childPublicId)
  if (!child) {
    return {
      error: 'No student account found for that ID. Ask the school to add the student first.',
    }
  }
  const classNames = parseStringList(child.class_names).length
    ? parseStringList(child.class_names)
    : [child.class_name || DEFAULT_CLASS]
  return {
    childId: child.id,
    childEmail: child.email || null,
    classNames,
  }
}

async function insertOtp({
  email,
  code,
  purpose,
  name,
  role,
  classNames,
  subjects,
  childId = null,
  childEmail = null,
}) {
  const classes = classNames.length ? classNames : [DEFAULT_CLASS]
  await execute(
    `INSERT INTO otp_codes (
      id, email, code_hash, purpose, name, role, class_name, class_names, subjects,
      child_id, child_email, expires_at, attempts, consumed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    [
      `otp-${crypto.randomUUID()}`,
      email,
      hashOtp(email, code),
      purpose,
      name,
      role,
      classes[0],
      encodeStringList(classes),
      encodeStringList(subjects),
      childId,
      childEmail,
      new Date(Date.now() + OTP_TTL_MS).toISOString(),
      nowIso(),
    ],
  )
}

async function appendUserList(userId, field, value) {
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId])
  if (!user) return
  if (field === 'class_names') {
    const names = parseStringList(user.class_names)
    if (user.class_name && !names.includes(user.class_name)) names.unshift(user.class_name)
    if (!names.includes(value)) names.push(value)
    await execute(
      'UPDATE users SET class_name = ?, class_names = ? WHERE id = ?',
      [names[0], encodeStringList(names), userId],
    )
    return
  }
  const names = parseStringList(user.subjects)
  if (!names.includes(value)) names.push(value)
  await execute('UPDATE users SET subjects = ? WHERE id = ?', [encodeStringList(names), userId])
}

async function listParentsForStudents(studentIds) {
  if (!studentIds.length) return []
  const placeholders = studentIds.map(() => '?').join(', ')
  return query(
    `SELECT id, name, email, child_id FROM users WHERE role = 'parent' AND child_id IN (${placeholders})`,
    studentIds,
  )
}

async function emailParentsAboutAssignment({
  students,
  title,
  subject,
  dueDate,
  teacherName,
  className,
}) {
  const parents = await listParentsForStudents(students.map((student) => student.id))
  if (!parents.length) return
  const nameById = Object.fromEntries(students.map((student) => [student.id, student.name]))
  await Promise.all(
    parents.map(async (parent) => {
      if (!parent.email) return
      try {
        await sendAssignmentEmail({
          to: parent.email,
          parentName: parent.name,
          childName: nameById[parent.child_id] || 'your child',
          title,
          subject,
          dueDate,
          teacherName,
          className,
        })
      } catch (error) {
        console.error(`Assignment email failed for ${parent.email}:`, error.message)
      }
    }),
  )
}

function letterGrade(score) {
  const n = Number(score)
  if (!Number.isFinite(n)) return 'F'
  if (n >= 80) return 'A'
  if (n >= 70) return 'B'
  if (n >= 60) return 'C'
  if (n >= 50) return 'D'
  return 'F'
}

function defaultGradeRemark(grade) {
  if (grade === 'A') return 'Excellent work'
  if (grade === 'B') return 'Good work'
  if (grade === 'C') return 'Fair. Keep practising'
  if (grade === 'D') return 'Needs more effort'
  return 'Needs serious improvement'
}

function parseReportResults(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const subject = String(row?.subject ?? '').trim()
      if (!subject) return null
      const score = Math.max(0, Math.min(100, Math.round(Number(row.score) || 0)))
      const grade = letterGrade(score)
      const remark = String(row?.remark ?? '').trim() || defaultGradeRemark(grade)
      return { subject, score, grade, remark }
    })
    .filter(Boolean)
}

async function recountReportPositions(className, term) {
  const rows = await query(
    `SELECT id FROM report_cards
     WHERE class_name = ? AND term = ?
     ORDER BY average DESC, student_name ASC`,
    [className, term],
  )
  let position = 1
  for (const row of rows) {
    await execute('UPDATE report_cards SET position = ? WHERE id = ?', [position, row.id])
    position += 1
  }
}

async function notifyReportPublished(studentId, studentName, term) {
  const created = nowIso()
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
     VALUES (?, ?, 'grade', ?, ?, ?, 0)`,
    [
      `n-${crypto.randomUUID()}`,
      studentId,
      'Report Card is ready',
      `Your ${term} report card has been published.`,
      created,
    ],
  )
  const parents = await query(
    "SELECT id FROM users WHERE role = 'parent' AND child_id = ?",
    [studentId],
  )
  for (const parent of parents) {
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
       VALUES (?, ?, 'grade', ?, ?, ?, 0)`,
      [
        `n-${crypto.randomUUID()}`,
        parent.id,
        'Report Card is ready',
        `${studentName}'s ${term} report card has been published.`,
        created,
      ],
    )
  }
}

async function saveReportCardRecord({ id, student, term, results, teacherRemark, published }) {
  const scores = results.map((row) => row.score)
  const average = scores.length
    ? Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length)
    : 0
  const overall = letterGrade(average)
  const now = nowIso()
  const existing = id ? await queryOne('SELECT * FROM report_cards WHERE id = ?', [id]) : null
  const cardId = existing?.id || `rc-${crypto.randomUUID()}`
  const className = student.class_name || DEFAULT_CLASS

  if (existing) {
    await execute(
      `UPDATE report_cards SET
        student_id = ?, student_name = ?, class_name = ?, term = ?,
        average = ?, overall_grade = ?, teacher_remark = ?, published = ?, updated_at = ?
       WHERE id = ?`,
      [
        student.id,
        student.name,
        className,
        term,
        average,
        overall,
        teacherRemark,
        published ? 1 : 0,
        now,
        cardId,
      ],
    )
    await execute('DELETE FROM report_card_results WHERE report_card_id = ?', [cardId])
  } else {
    await execute(
      `INSERT INTO report_cards (
        id, student_id, student_name, class_name, term, average, overall_grade,
        position, teacher_remark, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        cardId,
        student.id,
        student.name,
        className,
        term,
        average,
        overall,
        teacherRemark,
        published ? 1 : 0,
        now,
      ],
    )
  }

  for (const row of results) {
    await execute(
      `INSERT INTO report_card_results (id, report_card_id, subject, score, grade, remark)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`rr-${crypto.randomUUID()}`, cardId, row.subject, row.score, row.grade, row.remark],
    )
  }
  await recountReportPositions(className, term)
  return cardId
}

async function requireUser(req, res, next) {
  try {
    const header = req.header('authorization') || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.header('x-session-token')
    if (!token) {
      return res.status(401).json({ error: 'Not signed in' })
    }
    const session = await queryOne(
      'SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?',
      [hashToken(token), nowIso()],
    )
    if (!session) {
      return res.status(401).json({ error: 'Session expired. Sign in again.' })
    }
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [session.user_id])
    if (!user) {
      return res.status(401).json({ error: 'Unknown user' })
    }
    req.user = user
    req.sessionToken = token
    next()
  } catch (error) {
    next(error)
  }
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await execute(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [hashToken(token), userId, expires, nowIso()],
  )
  return token
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: usingNeon ? 'neon' : 'sqlite',
    email: emailConfigured(),
  })
})

app.post('/api/auth/request-otp', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const purpose = req.body?.purpose === 'signup' ? 'signup' : 'signin'
    const name = String(req.body?.name ?? '').trim()
    const role = parseRole(req.body?.role)
    let { classNames, subjects } = listsFromBody(req.body)
    let childId = null
    let childEmail = null

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (purpose === 'signup' && !name) {
      return res.status(400).json({ error: 'Enter your full name.' })
    }
    if (purpose === 'signup' && role === 'teacher' && subjects.length === 0) {
      return res.status(400).json({ error: 'Choose at least one subject.' })
    }
    if (purpose === 'signup' && role === 'teacher' && classNames.length === 0) {
      return res.status(400).json({ error: 'Choose at least one class.' })
    }
    if (purpose === 'signup' && role === 'parent') {
      const child = await resolveChildStudent(
        req.body?.childPublicId ?? req.body?.childId ?? req.body?.childEmail,
      )
      if (child.error) {
        return res.status(child.error.startsWith('No student') ? 404 : 400).json({
          error: child.error,
        })
      }
      childId = child.childId
      childEmail = child.childEmail
      classNames = child.classNames
    }

    const existing = await queryOne('SELECT * FROM users WHERE email = ?', [email])
    if (purpose === 'signup' && existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })
    }
    if (purpose === 'signin' && !existing) {
      return res.status(404).json({ error: 'No account found for this email. Sign up first.' })
    }

    const latest = await queryOne(
      `SELECT * FROM otp_codes
       WHERE email = ? AND purpose = ? AND consumed = 0
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, purpose],
    )
    if (latest && Date.now() - new Date(latest.created_at).getTime() < OTP_RESEND_MS) {
      const wait = Math.ceil(
        (OTP_RESEND_MS - (Date.now() - new Date(latest.created_at).getTime())) / 1000,
      )
      return res.status(429).json({ error: `Wait ${wait} seconds before requesting another code.` })
    }

    const code = String(crypto.randomInt(100000, 1000000))
    await insertOtp({
      email,
      code,
      purpose,
      name: purpose === 'signup' ? name : existing.name,
      role: purpose === 'signup' ? role : existing.role,
      classNames:
        purpose === 'signup' ? classNames : parseStringList(existing.class_names).length
          ? parseStringList(existing.class_names)
          : [existing.class_name],
      subjects:
        purpose === 'signup' ? subjects : parseStringList(existing.subjects),
      childId: purpose === 'signup' ? childId : existing.child_id,
      childEmail: purpose === 'signup' ? childEmail || null : existing.child_email,
    })

    const sent = await sendOtpEmail({ to: email, code, purpose })
    res.json({
      sent: true,
      delivered: sent.delivered,
      expiresInSec: OTP_TTL_MS / 1000,
      ...(sent.delivered || process.env.NODE_ENV === 'production'
        ? {}
        : { devCode: code }),
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/verify-otp', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const code = String(req.body?.code ?? '').replace(/\s/g, '')
    const purpose = req.body?.purpose === 'signup' ? 'signup' : 'signin'

    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Enter the 6 digit code from your email.' })
    }

    const otp = await queryOne(
      `SELECT * FROM otp_codes
       WHERE email = ? AND purpose = ? AND consumed = 0
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, purpose],
    )
    if (!otp) {
      return res.status(400).json({ error: 'No active code. Request a new one.' })
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      await execute('UPDATE otp_codes SET consumed = 1 WHERE id = ?', [otp.id])
      return res.status(400).json({ error: 'That code has expired. Request a new one.' })
    }
    if (Number(otp.attempts) >= 5) {
      await execute('UPDATE otp_codes SET consumed = 1 WHERE id = ?', [otp.id])
      return res.status(400).json({ error: 'Too many attempts. Request a new code.' })
    }
    if (otp.code_hash !== hashOtp(email, code)) {
      await execute('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id])
      return res.status(400).json({ error: 'Incorrect code. Try again.' })
    }

    await execute('UPDATE otp_codes SET consumed = 1 WHERE id = ?', [otp.id])

    let user = await queryOne('SELECT * FROM users WHERE email = ?', [email])
    if (purpose === 'signup') {
      if (user) {
        return res.status(409).json({ error: 'An account with this email already exists.' })
      }
      const id = `user-${crypto.randomUUID()}`
      const role = parseRole(otp.role)
      const classNames = parseStringList(otp.class_names).length
        ? parseStringList(otp.class_names)
        : [otp.class_name || DEFAULT_CLASS]
      const subjects = parseStringList(otp.subjects)
      await insertUserRecord({
        id,
        name: otp.name || email,
        email,
        role,
        classNames,
        subjects,
        childId: otp.child_id || null,
        childEmail: otp.child_email || null,
      })
      user = await queryOne('SELECT * FROM users WHERE id = ?', [id])
    }
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email.' })
    }

    const token = await createSession(user.id)
    res.json({ token, user: mapUser(user) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const header = req.header('authorization') || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.header('x-session-token')
    if (token) {
      await execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)])
    }
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/me', requireUser, async (req, res, next) => {
  try {
    res.json({ user: mapUser(req.user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/bootstrap', requireUser, async (req, res, next) => {
  try {
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/users', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can add people.' })
    }
    const name = String(req.body?.name ?? '').trim()
    const email = normalizeEmail(req.body?.email)
    const requested = req.body?.role
    const role =
      requested === 'teacher' ? 'teacher' : requested === 'parent' ? 'parent' : 'student'
    let { classNames, subjects } = listsFromBody(req.body)
    let childId = null
    let childEmail = null

    if (!name) {
      return res.status(400).json({ error: 'Enter their full name.' })
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (role === 'teacher' && subjects.length === 0) {
      return res.status(400).json({ error: 'Choose at least one subject.' })
    }
    if (role === 'parent') {
      const child = await resolveChildStudent(
        req.body?.childPublicId ?? req.body?.childId ?? req.body?.childEmail,
      )
      if (child.error) {
        return res.status(child.error.startsWith('No student') ? 404 : 400).json({
          error:
            child.error === 'Enter your child\'s student ID.'
              ? 'Enter the student ID for their child.'
              : 'No student account found for that ID.',
        })
      }
      childId = child.childId
      childEmail = child.childEmail
      classNames = child.classNames
    }

    const existing = await queryOne('SELECT * FROM users WHERE email = ?', [email])
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const id = `user-${crypto.randomUUID()}`
    const publicId = await insertUserRecord({
      id,
      name,
      email,
      role,
      classNames,
      subjects,
      childId,
      childEmail: childEmail || null,
    })

    const code = String(crypto.randomInt(100000, 1000000))
    await insertOtp({
      email,
      code,
      purpose: 'signin',
      name,
      role,
      classNames,
      subjects,
      childId,
      childEmail: childEmail || null,
    })

    let emailSent = false
    try {
      const sent = await sendInviteEmail({
        to: email,
        code,
        name,
        role,
        className: classNames.join(', '),
        publicId,
      })
      emailSent = Boolean(sent.delivered)
    } catch (error) {
      console.error('Invite email failed:', error)
    }

    res.json({
      ...(await bootstrap(req.user)),
      emailSent,
      publicId,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/classes', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can add classes.' })
    }
    const name = String(req.body?.name ?? '').trim()
    if (!name) {
      return res.status(400).json({ error: 'Enter a class name.' })
    }
    const teacher =
      req.user.role === 'admin'
        ? (await queryOne('SELECT * FROM users WHERE id = ?', [req.body?.teacher_id])) || req.user
        : req.user
    const existing = await queryOne(
      'SELECT id FROM classes WHERE name = ? AND teacher_id = ?',
      [name, teacher.id],
    )
    if (!existing) {
      await execute(
        `INSERT INTO classes (id, name, level, teacher_id, teacher_name, student_count)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [`class-${crypto.randomUUID()}`, name, classLevel(name), teacher.id, teacher.name],
      )
    }
    await appendUserList(teacher.id, 'class_names', name)
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/subjects', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can add subjects.' })
    }
    const name = String(req.body?.name ?? '').trim()
    const className = String(req.body?.className ?? req.user.class_name ?? DEFAULT_CLASS).trim() || DEFAULT_CLASS
    if (!name) {
      return res.status(400).json({ error: 'Enter a subject name.' })
    }
    const teacher =
      req.user.role === 'admin'
        ? (await queryOne('SELECT * FROM users WHERE id = ?', [req.body?.teacher_id])) || req.user
        : req.user
    const existing = await queryOne(
      'SELECT id FROM subjects WHERE name = ? AND teacher_id = ? AND class_name = ?',
      [name, teacher.id, className],
    )
    if (!existing) {
      await execute(
        `INSERT INTO subjects (id, name, code, teacher_id, teacher_name, class_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `sub-${crypto.randomUUID()}`,
          name,
          String(req.body?.code ?? subjectCode(name)).trim() || subjectCode(name),
          teacher.id,
          teacher.name,
          className,
        ],
      )
    }
    await appendUserList(teacher.id, 'subjects', name)
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/subjects/:id', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can remove a subject.' })
    }
    const existing = await queryOne('SELECT * FROM subjects WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Subject not found.' })
    if (req.user.role !== 'admin' && existing.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove a subject you added.' })
    }
    await execute('DELETE FROM subjects WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/homework', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can create homework' })
    }
    const input = req.body ?? {}
    const students = await listStudents()
    const className = String(input.className ?? req.user.class_name ?? '').trim()
    const targets =
      input.student_id === 'all' || !input.student_id
        ? studentsForClass(students, className).map((s) => s.id)
        : [input.student_id]
    const created = nowIso()
    await withTransaction(async (tx) => {
      for (const studentId of targets) {
        const id = `hw-${crypto.randomUUID()}`
        await tx.execute(
          `INSERT INTO homework (
            id, title, description, subject, due_date, status,
            assigned_by, teacher_id, student_id, priority, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            input.title,
            input.description ?? null,
            input.subject,
            input.due_date,
            input.status ?? 'pending',
            req.user.name,
            req.user.id,
            studentId,
            input.priority ?? 'medium',
            created,
          ],
        )
        await tx.execute(
          `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
           VALUES (?, ?, 'assignment', ?, ?, ?, 0)`,
          [
            `n-${crypto.randomUUID()}`,
            studentId,
            `New homework: ${String(input.title ?? '').trim()}`,
            `${req.user.name} assigned a new ${input.subject} task.`,
            created,
          ],
        )
        const parentRows = await query(
          "SELECT id FROM users WHERE role = 'parent' AND child_id = ?",
          [studentId],
        )
        for (const parent of parentRows) {
          await tx.execute(
            `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
             VALUES (?, ?, 'assignment', ?, ?, ?, 0)`,
            [
              `n-${crypto.randomUUID()}`,
              parent.id,
              `New homework: ${String(input.title ?? '').trim()}`,
              `${req.user.name} assigned a new ${input.subject} task.`,
              created,
            ],
          )
        }
      }
    })
    const studentRows = students.filter((student) => targets.includes(student.id))
    await emailParentsAboutAssignment({
      students: studentRows,
      title: String(input.title ?? '').trim(),
      subject: String(input.subject ?? 'class'),
      dueDate: String(input.due_date ?? ''),
      teacherName: req.user.name,
      className,
    })
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/homework/:id', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'parent') {
      return res.status(403).json({
        error: 'Parents can view assignments but cannot change them.',
      })
    }
    const existing = await queryOne('SELECT * FROM homework WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Homework not found' })
    const patch = req.body ?? {}
    await execute(
      `UPDATE homework SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        subject = COALESCE(?, subject),
        due_date = COALESCE(?, due_date),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        student_id = COALESCE(?, student_id)
       WHERE id = ?`,
      [
        patch.title ?? null,
        patch.description ?? null,
        patch.subject ?? null,
        patch.due_date ?? null,
        patch.status ?? null,
        patch.priority ?? null,
        patch.student_id && patch.student_id !== 'all' ? patch.student_id : null,
        req.params.id,
      ],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/homework/:id', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'parent') {
      return res.status(403).json({
        error: 'Parents can view assignments but cannot change them.',
      })
    }
    await execute('DELETE FROM homework WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/assignments', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can create assignments' })
    }
    const input = req.body ?? {}
    const title = String(input.title ?? '').trim()
    if (!title) {
      return res.status(400).json({ error: 'Enter an assignment name.' })
    }
    const className =
      String(input.className ?? req.user.class_name ?? '').trim() || DEFAULT_CLASS
    const status = input.status === 'draft' ? 'draft' : 'published'
    const postedAt = nowIso().slice(0, 10)
    const dueDate = String(input.due_date ?? postedAt)
    const id = `asg-${crypto.randomUUID()}`
    const students = studentsForClass(await listStudents(), className)
    const created = nowIso()

    await withTransaction(async (tx) => {
      await tx.execute(
        `INSERT INTO assignments (
          id, title, subject, class_name, topic, instructions,
          attachment_name, attachment_size, posted_at, due_date,
          max_marks, teacher_id, teacher_name, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          title,
          String(input.subject ?? 'Mathematics'),
          className,
          String(input.topic ?? 'Homework'),
          String(input.instructions ?? ''),
          input.attachmentName ?? null,
          input.attachmentName ? 'None' : null,
          postedAt,
          dueDate,
          Number(input.max_marks) || 20,
          req.user.id,
          req.user.name,
          status,
        ],
      )

      for (const student of students) {
        await tx.execute(
          `INSERT INTO submissions (
            id, assignment_id, student_id, student_name, status
          ) VALUES (?, ?, ?, ?, 'not_submitted')`,
          [`sub-${crypto.randomUUID()}`, id, student.id, student.name],
        )
        if (status === 'published') {
          await tx.execute(
            `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
             VALUES (?, ?, 'assignment', ?, ?, ?, 0)`,
            [
              `n-${crypto.randomUUID()}`,
              student.id,
              `New assignment: ${title}`,
              `${req.user.name} assigned a new ${input.subject || 'class'} task.`,
              created,
            ],
          )
          const parentRows = await query(
            "SELECT id FROM users WHERE role = 'parent' AND child_id = ?",
            [student.id],
          )
          for (const parent of parentRows) {
            await tx.execute(
              `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
               VALUES (?, ?, 'assignment', ?, ?, ?, 0)`,
              [
                `n-${crypto.randomUUID()}`,
                parent.id,
                `New assignment: ${title}`,
                `${student.name} has a new ${input.subject || 'class'} task.`,
                created,
              ],
            )
          }
        }
      }
    })
    if (status === 'published') {
      await emailParentsAboutAssignment({
        students,
        title,
        subject: String(input.subject ?? 'Mathematics'),
        dueDate,
        teacherName: req.user.name,
        className,
      })
    }
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/assignments/:id', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can edit assignments' })
    }
    const existing = await queryOne('SELECT * FROM assignments WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Assignment not found' })
    const patch = req.body ?? {}
    await execute(
      `UPDATE assignments SET
        title = COALESCE(?, title),
        subject = COALESCE(?, subject),
        class_name = COALESCE(?, class_name),
        topic = COALESCE(?, topic),
        instructions = COALESCE(?, instructions),
        due_date = COALESCE(?, due_date),
        max_marks = COALESCE(?, max_marks),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        patch.title ?? null,
        patch.subject ?? null,
        patch.className ?? null,
        patch.topic ?? null,
        patch.instructions ?? null,
        patch.due_date ?? null,
        patch.max_marks ?? null,
        patch.status ?? null,
        req.params.id,
      ],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/assignments/:id', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can delete assignments' })
    }
    const assignment = await queryOne('SELECT id FROM assignments WHERE id = ?', [req.params.id])
    if (assignment) {
      await execute('DELETE FROM submissions WHERE assignment_id = ?', [req.params.id])
      await execute('DELETE FROM assignments WHERE id = ?', [req.params.id])
      return res.json(await bootstrap(req.user))
    }
    const homework = await queryOne('SELECT id FROM homework WHERE id = ?', [req.params.id])
    if (!homework) {
      return res.status(404).json({ error: 'Assignment not found.' })
    }
    await execute('DELETE FROM homework WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/homework/:id/toggle-status', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'parent') {
      return res.status(403).json({
        error: 'Parents can view assignments but cannot submit work.',
      })
    }
    const existing = await queryOne('SELECT * FROM homework WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Homework not found' })
    const nextStatus = existing.status === 'completed' ? 'pending' : 'completed'
    await execute('UPDATE homework SET status = ? WHERE id = ?', [nextStatus, req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/report-cards', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can create report cards.' })
    }
    const studentId = String(req.body?.student_id ?? '').trim()
    const term = String(req.body?.term ?? '').trim()
    const results = parseReportResults(req.body?.results)
    if (!studentId || !term) {
      return res.status(400).json({ error: 'Pick a student and a term.' })
    }
    if (results.length === 0) {
      return res.status(400).json({ error: 'Add at least one subject score.' })
    }
    const student = await queryOne("SELECT * FROM users WHERE id = ? AND role = 'student'", [studentId])
    if (!student) return res.status(404).json({ error: 'Student not found.' })
    const existing = await queryOne(
      'SELECT id FROM report_cards WHERE student_id = ? AND term = ?',
      [studentId, term],
    )
    const published = Boolean(req.body?.published)
    await saveReportCardRecord({
      id: existing?.id,
      student,
      term,
      results,
      teacherRemark: String(req.body?.teacher_remark ?? '').trim(),
      published,
    })
    if (published) {
      await notifyReportPublished(student.id, student.name, term)
    }
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/report-cards/:id', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can edit report cards' })
    }
    const existing = await queryOne('SELECT * FROM report_cards WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Report card not found' })
    const student = await queryOne('SELECT * FROM users WHERE id = ?', [existing.student_id])
    if (!student) return res.status(404).json({ error: 'Student not found.' })
    const results = Array.isArray(req.body?.results)
      ? parseReportResults(req.body.results)
      : (await query(
          'SELECT subject, score, grade, remark FROM report_card_results WHERE report_card_id = ?',
          [existing.id],
        )).map((row) => ({
          subject: row.subject,
          score: Number(row.score),
          grade: row.grade,
          remark: row.remark,
        }))
    if (results.length === 0) {
      return res.status(400).json({ error: 'Add at least one subject score.' })
    }
    const published =
      typeof req.body?.published === 'boolean' ? req.body.published : Boolean(Number(existing.published))
    await saveReportCardRecord({
      id: existing.id,
      student,
      term: String(req.body?.term ?? existing.term).trim() || existing.term,
      results,
      teacherRemark:
        typeof req.body?.teacher_remark === 'string'
          ? req.body.teacher_remark.trim()
          : existing.teacher_remark,
      published,
    })
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/report-cards/:id/toggle-published', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can publish report cards' })
    }
    const existing = await queryOne('SELECT * FROM report_cards WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Report card not found' })
    const nextPublished = Number(existing.published) ? 0 : 1
    await execute(
      'UPDATE report_cards SET published = ?, updated_at = ? WHERE id = ?',
      [nextPublished, nowIso(), req.params.id],
    )
    if (nextPublished) {
      await notifyReportPublished(existing.student_id, existing.student_name, existing.term)
    }
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/notifications/:id/read', requireUser, async (req, res, next) => {
  try {
    await execute('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/notifications/read-all', requireUser, async (req, res, next) => {
  try {
    await execute(
      "UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id = 'all'",
      [req.user.id],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/announcements', requireUser, async (req, res, next) => {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Only teachers can send announcements' })
    }
    const title = String(req.body?.title ?? '').trim()
    const body = String(req.body?.body ?? '').trim()
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, body, created_at, read)
       VALUES (?, 'all', 'announcement', ?, ?, ?, 0)`,
      [`n-${crypto.randomUUID()}`, title, body, nowIso()],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/conversations/:id/messages', requireUser, async (req, res, next) => {
  try {
    const body = String(req.body?.body ?? '').trim()
    if (!body) return res.status(400).json({ error: 'Message body is required' })
    const conv = await queryOne('SELECT * FROM conversations WHERE id = ?', [req.params.id])
    if (!conv) return res.status(404).json({ error: 'Conversation not found' })
    if (req.user.role === 'parent' && conv.student_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only message teachers for your child\'s class.' })
    }
    const created = nowIso()
    await execute(
      `INSERT INTO messages (id, conversation_id, sender_id, sender_role, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`m-${crypto.randomUUID()}`, req.params.id, req.user.id, req.user.role, body, created],
    )
    await execute(
      `INSERT INTO conversation_reads (user_id, conversation_id, read_at)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id, conversation_id) DO UPDATE SET read_at = excluded.read_at`,
      [req.user.id, req.params.id, created],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/conversations/:id/read', requireUser, async (req, res, next) => {
  try {
    await execute(
      `INSERT INTO conversation_reads (user_id, conversation_id, read_at)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id, conversation_id) DO UPDATE SET read_at = excluded.read_at`,
      [req.user.id, req.params.id, nowIso()],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/games/:gameId/score', requireUser, async (req, res, next) => {
  try {
    const score = Number(req.body?.score) || 0
    const now = nowIso()
    await execute(
      `INSERT INTO game_scores (user_id, game_id, high_score, last_played, favorite)
       VALUES (?, ?, ?, ?, 0)
       ON CONFLICT (user_id, game_id) DO UPDATE SET
         high_score = CASE
           WHEN excluded.high_score > game_scores.high_score THEN excluded.high_score
           ELSE game_scores.high_score
         END,
         last_played = excluded.last_played`,
      [req.user.id, req.params.gameId, score, now],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/games/:gameId/favorite', requireUser, async (req, res, next) => {
  try {
    await execute(
      `INSERT INTO game_scores (user_id, game_id, high_score, last_played, favorite)
       VALUES (?, ?, 0, NULL, 1)
       ON CONFLICT (user_id, game_id) DO UPDATE SET
         favorite = CASE WHEN game_scores.favorite = 1 THEN 0 ELSE 1 END`,
      [req.user.id, req.params.gameId],
    )
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/exams', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can publish the timetable.' })
    }
    const title = String(req.body?.title ?? '').trim()
    const subject = String(req.body?.subject ?? '').trim()
    const date = String(req.body?.date ?? '').trim()
    if (!title || !subject || !date) {
      return res.status(400).json({ error: 'Enter a title, subject, and date.' })
    }
    const kind = req.body?.kind === 'exam' ? 'exam' : 'class'
    const startTime = String(req.body?.start_time ?? '09:00').trim() || '09:00'
    const endTime = String(req.body?.end_time ?? '11:00').trim() || '11:00'
    const duration = String(req.body?.duration ?? '2h').trim() || '2h'
    const room = String(req.body?.room ?? '').trim()
    const className = String(req.body?.className ?? DEFAULT_CLASS).trim() || DEFAULT_CLASS
    const id = String(req.body?.id ?? '').trim() || `ex-${crypto.randomUUID()}`
    const existing = await queryOne('SELECT id FROM exams WHERE id = ?', [id])
    if (existing) {
      await execute(
        `UPDATE exams SET
          title = ?, subject = ?, date = ?, start_time = ?, end_time = ?,
          duration = ?, room = ?, class_name = ?, kind = ?, published = 1
         WHERE id = ?`,
        [title, subject, date, startTime, endTime, duration, room, className, kind, id],
      )
    } else {
      await execute(
        `INSERT INTO exams (
          id, title, subject, date, start_time, end_time, duration, room, class_name, kind, published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, title, subject, date, startTime, endTime, duration, room, className, kind],
      )
    }
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/exams/:id', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can change the timetable.' })
    }
    await execute('DELETE FROM exams WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/events', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can add school events.' })
    }
    const title = String(req.body?.title ?? '').trim()
    const date = String(req.body?.date ?? '').trim()
    if (!title || !date) {
      return res.status(400).json({ error: 'Enter a title and date.' })
    }
    const id = String(req.body?.id ?? '').trim() || `ev-${crypto.randomUUID()}`
    const startTime = String(req.body?.start_time ?? '09:00').trim() || '09:00'
    const endTime = String(req.body?.end_time ?? '12:00').trim() || '12:00'
    const location = String(req.body?.location ?? 'School').trim() || 'School'
    const description = String(req.body?.description ?? '').trim()
    const organizer = String(req.body?.organizer ?? req.user.name).trim() || req.user.name
    const existing = await queryOne('SELECT id FROM events WHERE id = ?', [id])
    if (existing) {
      await execute(
        `UPDATE events SET
          title = ?, date = ?, start_time = ?, end_time = ?,
          location = ?, description = ?, organizer = ?, published = 1
         WHERE id = ?`,
        [title, date, startTime, endTime, location, description, organizer, id],
      )
    } else {
      await execute(
        `INSERT INTO events (
          id, title, date, start_time, end_time, location, description, organizer, published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, title, date, startTime, endTime, location, description, organizer],
      )
    }
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/events/:id', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only school admins can change school events.' })
    }
    await execute('DELETE FROM events WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: error.message || 'Server error' })
})

await initDb()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Homework Tracker API listening on http://localhost:${PORT}`)
})
