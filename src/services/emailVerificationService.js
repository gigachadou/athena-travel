import emailjs from '@emailjs/browser'

const STORAGE_PREFIX = 'athena_pending_signup_v1:'
const ACTIVE_EMAIL_KEY = 'athena_pending_signup_email_v1'
const OTP_TTL_MS = 10 * 60 * 1000

const getEmailJsConfig = () => {
  const serviceId = (import.meta.env.VITE_EMAIL_SERVER_ID || import.meta.env.EMAIL_SERVER_ID || '').toString().trim()
  const templateId = (import.meta.env.VITE_EMAIL_TEMPLATE_ID || import.meta.env.EMAIL_TEMPLATE_ID || '').toString().trim()
  const publicKey = (import.meta.env.VITE_EMAIL_PUBLIC_KEY || import.meta.env.EMAIL_PUBLIC_KEY || '').toString().trim()

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS sozlamalari topilmadi. `.env` ichidagi EMAIL_SERVER_ID, EMAIL_TEMPLATE_ID, EMAIL_PUBLIC_KEY ni tekshiring.")
  }

  return { serviceId, templateId, publicKey }
}

const storageKey = (email) => `${STORAGE_PREFIX}${email.toLowerCase().trim()}`

const safeNow = () => Date.now()

const generateOtp = () => {
  const n = Math.floor(Math.random() * 1000000)
  return n.toString().padStart(6, '0')
}

const formatTimeUz = (date) => {
  try {
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}

const savePendingSignup = (payload) => {
  sessionStorage.setItem(storageKey(payload.email), JSON.stringify(payload))
  sessionStorage.setItem(ACTIVE_EMAIL_KEY, payload.email)
}

export const getPendingSignup = (email) => {
  const resolvedEmail = (email || sessionStorage.getItem(ACTIVE_EMAIL_KEY) || '').toString().trim()
  if (!resolvedEmail) return null

  const raw = sessionStorage.getItem(storageKey(resolvedEmail))
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const clearPendingSignup = (email) => {
  const resolvedEmail = (email || sessionStorage.getItem(ACTIVE_EMAIL_KEY) || '').toString().trim()
  if (!resolvedEmail) return

  sessionStorage.removeItem(storageKey(resolvedEmail))
  const active = sessionStorage.getItem(ACTIVE_EMAIL_KEY)
  if (active?.toString().trim().toLowerCase() === resolvedEmail.toLowerCase()) {
    sessionStorage.removeItem(ACTIVE_EMAIL_KEY)
  }
}

const sendOtpEmail = async ({ toName, toEmail, otp }) => {
  const { serviceId, templateId, publicKey } = getEmailJsConfig()
  const now = new Date()

  await emailjs.send(
    serviceId,
    templateId,
    {
      to_name: toName || 'Foydalanuvchi',
      to_email: toEmail,
      password: otp,
      time: formatTimeUz(now),
    },
    publicKey
  )
}

export const startSignupOtp = async ({ email, username, fullName, password }) => {
  const trimmedEmail = (email || '').toString().trim()
  if (!trimmedEmail) throw new Error('Email talab qilinadi.')

  const otp = generateOtp()
  const createdAt = safeNow()
  const expiresAt = createdAt + OTP_TTL_MS

  const pending = {
    email: trimmedEmail,
    username: (username || '').toString().trim(),
    fullName: (fullName || '').toString().trim(),
    password: (password || '').toString(),
    otp,
    createdAt,
    expiresAt,
  }

  savePendingSignup(pending)
  await sendOtpEmail({ toName: pending.fullName, toEmail: pending.email, otp: pending.otp })

  return { email: pending.email, expiresAt: pending.expiresAt }
}

export const resendSignupOtp = async (email) => {
  const pending = getPendingSignup(email)
  if (!pending) throw new Error("Tasdiqlash ma'lumoti topilmadi. Qayta ro'yxatdan o'ting.")

  const refreshed = {
    ...pending,
    otp: generateOtp(),
    createdAt: safeNow(),
  }
  refreshed.expiresAt = refreshed.createdAt + OTP_TTL_MS

  savePendingSignup(refreshed)
  await sendOtpEmail({ toName: refreshed.fullName, toEmail: refreshed.email, otp: refreshed.otp })

  return { email: refreshed.email, expiresAt: refreshed.expiresAt }
}

export const verifySignupOtp = ({ email, otp }) => {
  const pending = getPendingSignup(email)
  if (!pending) throw new Error("Tasdiqlash ma'lumoti topilmadi. Qayta ro'yxatdan o'ting.")

  if (safeNow() > Number(pending.expiresAt || 0)) {
    throw new Error("Kodning vaqti tugadi. Qayta yuboring.")
  }

  const cleanedInput = (otp || '').toString().replace(/\s+/g, '')
  if (!cleanedInput) throw new Error('Kod talab qilinadi.')

  if (cleanedInput !== pending.otp) {
    throw new Error("Kod noto'g'ri.")
  }

  return pending
}

