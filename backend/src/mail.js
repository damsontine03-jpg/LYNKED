const BREVO_API_KEY = process.env.BREVO_API_KEY?.trim()
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL?.trim()
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME?.trim() || 'Homework Tracker'

export function emailConfigured() {
  return Boolean(BREVO_API_KEY && BREVO_SENDER_EMAIL)
}

export async function sendOtpEmail({ to, code, purpose }) {
  const subject =
    purpose === 'signup'
      ? 'Your Homework Tracker sign up code'
      : 'Your Homework Tracker sign in code'
  const action = purpose === 'signup' ? 'finish creating your account' : 'sign in'
  const html = `
    <div style="font-family:Georgia,serif;background:#dceee3;padding:32px 16px">
      <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;color:#1f3d2d">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2d6a4f;font-weight:700">Homework Tracker</p>
        <h1 style="margin:0 0 16px;font-size:22px">Your code</h1>
        <p style="margin:0 0 20px;line-height:1.5">Use this code to ${action}. It expires in 10 minutes.</p>
        <p style="margin:0 0 24px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#2d6a4f">${code}</p>
        <p style="margin:0;font-size:13px;color:#5b7166">If you did not request this, you can ignore the email.</p>
      </div>
    </div>
  `

  if (!emailConfigured()) {
    console.log(`[dev] OTP for ${to}: ${code}`)
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

export async function sendInviteEmail({ to, code, name, role, className }) {
  const signInUrl = (process.env.FRONTEND_URL || '').split(',')[0]?.replace(/\/$/, '') || ''
  const loginLink = signInUrl ? `${signInUrl}/login` : '/login'
  const roleLabel = role === 'teacher' ? 'teacher' : 'student'
  const subject = 'Your Homework Tracker account'
  const html = `
    <div style="font-family:Georgia,serif;background:#dceee3;padding:32px 16px">
      <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;color:#1f3d2d">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#2d6a4f;font-weight:700">Homework Tracker</p>
        <h1 style="margin:0 0 16px;font-size:22px">Your account is ready</h1>
        <p style="margin:0 0 12px;line-height:1.5">Hello ${escapeHtml(name)},</p>
        <p style="margin:0 0 20px;line-height:1.5">
          A school admin created your ${roleLabel} account${className ? ` for ${escapeHtml(className)}` : ''}.
          Sign in with this email. No password is needed. Use the code below. It expires in 10 minutes.
        </p>
        <p style="margin:0 0 24px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#2d6a4f">${code}</p>
        <p style="margin:0 0 16px;line-height:1.5">
          Open <a href="${loginLink}" style="color:#2d6a4f;font-weight:700">Sign in</a>, enter your email, then enter this code.
        </p>
        <p style="margin:0;font-size:13px;color:#5b7166">Next time, request a new code from the sign in page. If you did not expect this, you can ignore the email.</p>
      </div>
    </div>
  `

  if (!emailConfigured()) {
    console.log(`[dev] Invite OTP for ${to}: ${code}`)
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
