import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronLeft, Lock, ChevronRight } from 'lucide-react'
import logo from '../assets/logo.png'

import '../styles/AuthPage.css'
import { fetchProfile, resendSignupConfirmation } from '../services/databaseService'
import { useAuth } from '../context/AuthContext'
import { clearPendingSignup, getPendingSignup, resendSignupOtp, verifySignupOtp } from '../services/emailVerificationService'

const OTPPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, login } = useAuth()

  const mode = location.state?.mode
  const fromLogin = Boolean(location.state?.fromLogin)
  const pendingEmailFromNav = (location.state?.email || '').toString().trim()

  const pendingFromStorage = useMemo(() => getPendingSignup(pendingEmailFromNav), [pendingEmailFromNav])
  const pendingEmail = pendingEmailFromNav || pendingFromStorage?.email || ''
  const isEmailJsSignup = !fromLogin && (mode === 'signup' || Boolean(pendingFromStorage))

  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!pendingEmail || submitting) return

    try {
      setSubmitting(true)
      setError('')
      setStatusMessage('')

      if (isEmailJsSignup) {
        await resendSignupOtp(pendingEmail)
        setStatusMessage(`Tasdiqlash kodi ${pendingEmail} manziliga qayta yuborildi.`)
      } else {
        await resendSignupConfirmation(pendingEmail)
        setStatusMessage(`Tasdiqlash xabari ${pendingEmail} manziliga qayta yuborildi.`)
      }
    } catch (err) {
      console.error('Failed to resend confirmation email:', err)
      setError(err.message || "Tasdiqlash xabarini qayta yuborib bo'lmadi.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!pendingEmail || submitting) return

    try {
      setSubmitting(true)
      setError('')
      setStatusMessage('')

      const pending = verifySignupOtp({ email: pendingEmail, otp })

      const result = await register({
        email: pending.email,
        password: pending.password,
        username: pending.username,
        fullName: pending.fullName,
      })

      if (result.session) {
        clearPendingSignup(pending.email)
        navigate('/', { replace: true })
        return
      }

      // If Supabase email confirmation is enabled, signUp may return no session.
      // Try to sign in immediately; if it fails due to email confirmation, show a clear instruction.
      try {
        await login({ identifier: pending.email, password: pending.password })
        clearPendingSignup(pending.email)
        navigate('/', { replace: true })
        return
      } catch (loginError) {
        const code = loginError?.code || ''
        const message = (loginError?.message || '').toString().toLowerCase()
        if (code === 'email_not_confirmed' || message.includes('not confirmed') || message.includes('invalid login credentials')) {
          const profile = result.user?.id ? await fetchProfile(result.user.id) : null
          clearPendingSignup(pending.email)
          setStatusMessage(
            profile?.id
              ? "Akkount Supabase'ga saqlandi, lekin Supabase email confirmation yoqilganligi uchun avtomatik login bo'lmadi. Supabase Dashboard → Authentication → Providers → Email → \"Confirm email\" ni o'chiring yoki Supabase yuborgan tasdiqlash emailini bosing."
              : "Akkount yaratildi, lekin login bo'lmadi. Supabase email confirmation sozlamalarini tekshiring (Confirm email)."
          )
          return
        }

        throw loginError
      }
    } catch (err) {
      console.error('Failed to verify OTP:', err)
      const message = err?.message || ''
      if (/database error saving new user/i.test(message)) {
        setError("Supabase'da user saqlashda DB xatosi. Odatda bu `profiles`/triggerlar yo'q yoki noto'g'ri bo'lganda bo'ladi — `supabase_full_setup.sql` ni Supabase SQL Editor'da to'liq ishga tushirganingizni tekshiring.")
      } else {
        setError(message || "Kod tasdiqlanmadi.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    if (pendingEmail) clearPendingSignup(pendingEmail)
    navigate('/register', { replace: true })
  }

  return (
    <div className="auth-page fade-in">
      <button className="btn-back-auth" onClick={() => navigate(-1)} aria-label="Ortga">
        <ChevronLeft size={24} />
      </button>
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Yo'lchiAI Logo" />
        </div>

        <h1 className="auth-title">Emailni tasdiqlang</h1>

        {isEmailJsSignup ? (
          <>
            <p className="auth-subtitle">
              {pendingEmail ? `${pendingEmail} manziliga 6 xonali tasdiqlash kodi yuborildi.` : "Email topilmadi."}
            </p>

            {pendingEmail ? (
              <form onSubmit={handleVerify} className="auth-form" style={{ marginTop: '18px' }}>
                <div className="input-field">
                  <Lock className="field-icon" size={20} />
                  <input
                    type="text"
                    inputMode="numeric"
                    name="otp"
                    placeholder="Tasdiqlash kodi (6 ta raqam)"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary auth-btn" disabled={submitting}>
                  {submitting ? 'Tekshirilmoqda...' : <>Tasdiqlash <ChevronRight size={18} /></>}
                </button>
              </form>
            ) : (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button type="button" className="btn-primary auth-btn" onClick={handleReset}>
                  Qayta ro'yxatdan o'tish
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="auth-subtitle">
              {pendingEmail
                ? `${pendingEmail} manziliga tasdiqlash xabari yuborildi. Email ichidagi havola orqali akkauntni faollashtiring.`
                : "Agar Supabase loyihangizda email confirmation yoqilgan bo'lsa, pochtangizdagi tasdiqlash havolasini bosing."}
            </p>
            {fromLogin && (
              <p style={{ color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
                Login qilishdan oldin emailingizni tasdiqlashingiz kerak.
              </p>
            )}
          </>
        )}

        <div className="resend-container" style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Tasdiqlash kodi/xabar kelmagan bo'lsa qayta yuboring
          </p>
          {pendingEmail && (
            <button
              type="button"
              className="btn-primary auth-btn"
              onClick={handleResend}
              disabled={submitting}
              style={{ width: '100%', marginBottom: '14px' }}
            >
              {submitting ? 'Yuborilmoqda...' : isEmailJsSignup ? 'Tasdiqlash kodini qayta yuborish' : 'Tasdiqlash xabarini qayta yuborish'}
            </button>
          )}
          {statusMessage && <p style={{ color: '#1f8f57', marginBottom: '12px' }}>{statusMessage}</p>}
          {error && <p style={{ color: '#d14343', marginBottom: '12px' }}>{error}</p>}
          <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: '800', background: 'none' }}>
            Login sahifasiga o'tish
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OTPPage
