import './env.js'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import {
  bootstrap,
  execute,
  getReportCard,
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
} from './db.js'
import { emailConfigured, sendInviteEmail, sendOtpEmail } from './mail.js'

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
  if (value === 'teacher' || value === 'admin' || value === 'student') return value
  return 'student'
}

function listsFromBody(body, fallbackClass = 'SSS 2') {
  const classNames = parseStringList(body?.classNames ?? body?.className ?? fallbackClass)
  const subjects = parseStringList(body?.subjects ?? body?.subject)
  return {
    classNames: classNames.length ? classNames : [fallbackClass],
    subjects,
  }
}

async function saveTeacherLoad(teacherId, teacherName, classNames, subjects) {
  const classes = classNames.length ? classNames : ['SSS 2']
  const subjectNames = subjects.length ? subjects : []
  for (const className of classes) {
    const existing = await queryOne(
      'SELECT id FROM classes WHERE name = ? AND teacher_id = ?',
      [className, teacherId],
    )
    if (!existing) {
      await execute(
        `INSERT INTO classes (id, name, level, teacher_id, teacher_name, student_count)
         VALUES (?, ?, 'Senior Secondary', ?, ?, 0)`,
        [`class-${crypto.randomUUID()}`, className, teacherId, teacherName],
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

async function insertUserRecord({ id, name, email, role, classNames, subjects }) {
  const classes = classNames.length ? classNames : ['SSS 2']
  await execute(
    `INSERT INTO users (id, name, email, phone, role, class_name, class_names, subjects, verification_key)
     VALUES (?, ?, ?, '', ?, ?, ?, ?, 'otp')`,
    [
      id,
      name,
      email,
      role,
      classes[0],
      encodeStringList(classes),
      encodeStringList(subjects),
    ],
  )
  if (role === 'teacher') {
    await saveTeacherLoad(id, name, classes, subjects)
  }
}

async function insertOtp({ email, code, purpose, name, role, classNames, subjects }) {
  const classes = classNames.length ? classNames : ['SSS 2']
  await execute(
    `INSERT INTO otp_codes (
      id, email, code_hash, purpose, name, role, class_name, class_names, subjects,
      expires_at, attempts, consumed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
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
    const { classNames, subjects } = listsFromBody(req.body)

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
        : [otp.class_name || 'SSS 2']
      const subjects = parseStringList(otp.subjects)
      await insertUserRecord({
        id,
        name: otp.name || email,
        email,
        role,
        classNames,
        subjects,
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
    const role = req.body?.role === 'teacher' ? 'teacher' : 'student'
    const { classNames, subjects } = listsFromBody(req.body)

    if (!name) {
      return res.status(400).json({ error: 'Enter their full name.' })
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (role === 'teacher' && subjects.length === 0) {
      return res.status(400).json({ error: 'Choose at least one subject.' })
    }

    const existing = await queryOne('SELECT * FROM users WHERE email = ?', [email])
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const id = `user-${crypto.randomUUID()}`
    await insertUserRecord({ id, name, email, role, classNames, subjects })

    const code = String(crypto.randomInt(100000, 1000000))
    await insertOtp({
      email,
      code,
      purpose: 'signin',
      name,
      role,
      classNames,
      subjects,
    })

    let emailSent = false
    try {
      const sent = await sendInviteEmail({
        to: email,
        code,
        name,
        role,
        className: classNames.join(', '),
      })
      emailSent = Boolean(sent.delivered)
    } catch (error) {
      console.error('Invite email failed:', error)
    }

    res.json({
      ...(await bootstrap(req.user)),
      emailSent,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/classes', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
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
         VALUES (?, ?, 'Senior Secondary', ?, ?, 0)`,
        [`class-${crypto.randomUUID()}`, name, teacher.id, teacher.name],
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
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Only teachers can add subjects.' })
    }
    const name = String(req.body?.name ?? '').trim()
    const className = String(req.body?.className ?? req.user.class_name ?? 'SSS 2').trim() || 'SSS 2'
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

app.post('/api/homework', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
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
      }
    })
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/homework/:id', requireUser, async (req, res, next) => {
  try {
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
    await execute('DELETE FROM homework WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/assignments', requireUser, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only teachers can create assignments' })
    }
    const input = req.body ?? {}
    const title = String(input.title ?? '').trim()
    if (!title) {
      return res.status(400).json({ error: 'Enter an assignment name.' })
    }
    const className =
      String(input.className ?? req.user.class_name ?? '').trim() || 'SSS 2'
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
        }
      }
    })
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/assignments/:id', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
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
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Only teachers can delete assignments' })
    }
    await execute('DELETE FROM submissions WHERE assignment_id = ?', [req.params.id])
    await execute('DELETE FROM assignments WHERE id = ?', [req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/homework/:id/toggle-status', requireUser, async (req, res, next) => {
  try {
    const existing = await queryOne('SELECT * FROM homework WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Homework not found' })
    const nextStatus = existing.status === 'completed' ? 'pending' : 'completed'
    await execute('UPDATE homework SET status = ? WHERE id = ?', [nextStatus, req.params.id])
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.patch('/api/report-cards/:id', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Only teachers can edit report cards' })
    }
    const existing = await getReportCard(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Report card not found' })
    const remark = req.body?.teacher_remark
    if (typeof remark === 'string') {
      await execute(
        'UPDATE report_cards SET teacher_remark = ?, updated_at = ? WHERE id = ?',
        [remark, nowIso(), req.params.id],
      )
    }
    res.json(await bootstrap(req.user))
  } catch (error) {
    next(error)
  }
})

app.post('/api/report-cards/:id/toggle-published', requireUser, async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Only teachers can publish report cards' })
    }
    const existing = await queryOne('SELECT * FROM report_cards WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Report card not found' })
    await execute(
      'UPDATE report_cards SET published = ?, updated_at = ? WHERE id = ?',
      [Number(existing.published) ? 0 : 1, nowIso(), req.params.id],
    )
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
    if (req.user.role === 'student') {
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

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: error.message || 'Server error' })
})

await initDb()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Homework Tracker API listening on http://localhost:${PORT}`)
})
