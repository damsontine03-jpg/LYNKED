const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim()
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL?.trim()
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME?.trim() || 'LynkED'

export function emailConfigured() {
  return Boolean(BREVO_API_KEY && BREVO_SENDER_EMAIL)
}

async function sendHtmlEmail({ to, subject, html }) {
  if (!emailConfigured()) {
    console.log(`[dev] Email to ${to}: ${subject}`)
    return { delivered: false }
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo email failed: ${response.status} ${detail}`)
  }

  return { delivered: true }
}

function signInLink() {
  const signInUrl = (process.env.FRONTEND_URL || '').split(',')[0]?.replace(/\/$/, '') || ''
  return signInUrl ? `${signInUrl}/login` : '/login'
}

function emailShell({ title, bodyHtml }) {
  return `
    <div style="font-family:Georgia,serif;background:#dceee3;padding:32px 16px">
      <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;color:#1f3d2d">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2d6a4f;font-weight:700">LynkED</p>
        <h1 style="margin:0 0 16px;font-size:22px">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  `
}

export async function sendOtpEmail({ to, code, purpose }) {
  const subject =
    purpose === 'signup' ? 'Your LynkED sign up code' : 'Your LynkED sign in code'
  const action = purpose === 'signup' ? 'finish creating your account' : 'sign in'
  const html = emailShell({
    title: 'Your code',
    bodyHtml: `
      <p style="margin:0 0 20px;line-height:1.5">Use this code to ${action}. It expires in 10 minutes.</p>
      <p style="margin:0 0 24px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#2d6a4f">${code}</p>
      <p style="margin:0;font-size:13px;color:#5b7166">If you did not request this, you can ignore the email.</p>
    `,
  })
  return sendHtmlEmail({ to, subject, html })
}

export async function sendInviteEmail({ to, code, name, role, className, publicId }) {
  const loginLink = signInLink()
  const roleLabel =
    role === 'teacher' ? 'teacher' : role === 'parent' ? 'parent' : 'student'
  const html = emailShell({
    title: 'Your account is ready',
    bodyHtml: `
      <p style="margin:0 0 12px;line-height:1.5">Hello ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;line-height:1.5">
        A school admin created your ${roleLabel} account${className ? ` for ${escapeHtml(className)}` : ''}.
        Sign in with this email. No password is needed. Use the code below. It expires in 10 minutes.
      </p>
      ${
        publicId
          ? `<p style="margin:0 0 20px;line-height:1.5">Your ID is <strong>${escapeHtml(publicId)}</strong>. Parents use a student's ID to link their account.</p>`
          : ''
      }
      <p style="margin:0 0 24px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#2d6a4f">${code}</p>
      <p style="margin:0 0 16px;line-height:1.5">
        Open <a href="${loginLink}" style="color:#2d6a4f;font-weight:700">Sign in</a>, enter your email, then enter this code.
      </p>
      <p style="margin:0;font-size:13px;color:#5b7166">Next time, request a new code from the sign in page. If you did not expect this, you can ignore the email.</p>
    `,
  })
  return sendHtmlEmail({ to, subject: 'Your LynkED account', html })
}

export async function sendAssignmentEmail({
  to,
  parentName,
  childName,
  title,
  subject,
  dueDate,
  teacherName,
  className,
}) {
  const loginLink = signInLink()
  const due = formatEmailDate(dueDate)
  const html = emailShell({
    title: 'New assignment',
    bodyHtml: `
      <p style="margin:0 0 12px;line-height:1.5">Hello ${escapeHtml(parentName || 'there')},</p>
      <p style="margin:0 0 16px;line-height:1.5">
        ${escapeHtml(childName)} has a new assignment in ${escapeHtml(className || 'class')}.
      </p>
      <p style="margin:0 0 8px;line-height:1.5"><strong>${escapeHtml(title)}</strong></p>
      <p style="margin:0 0 8px;line-height:1.5">Subject: ${escapeHtml(subject)}</p>
      <p style="margin:0 0 8px;line-height:1.5">Due: ${escapeHtml(due)}</p>
      <p style="margin:0 0 20px;line-height:1.5">Teacher: ${escapeHtml(teacherName)}</p>
      <p style="margin:0 0 16px;line-height:1.5">
        Sign in to LynkED to see the details.
        Open <a href="${loginLink}" style="color:#2d6a4f;font-weight:700">LynkED</a>.
      </p>
      <p style="margin:0;font-size:13px;color:#5b7166">You received this because you are linked as a parent on LynkED.</p>
    `,
  })
  return sendHtmlEmail({
    to,
    subject: `New assignment for ${childName}: ${title}`,
    html,
  })
}

function formatEmailDate(value) {
  const [year, month, day] = String(value ?? '')
    .slice(0, 10)
    .split('-')
    .map(Number)
  if (!year || !month || !day) return String(value || '')
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
