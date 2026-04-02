import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronLeft, MailCheck } from 'lucide-react'

import '../styles/AuthPage.css'
import { resendSignupConfirmation } from '../services/databaseService'

const OTPPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pendingEmail = location.state?.email
  const fromLogin = Boolean(location.state?.fromLogin)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!pendingEmail || submitting) return

    try {
      setSubmitting(true)
      setError('')
      setStatusMessage('')
      await resendSignupConfirmation(pendingEmail)
      setStatusMessage(`Tasdiqlash xabari ${pendingEmail} manziliga qayta yuborildi.`)
    } catch (err) {
      console.error('Failed to resend confirmation email:', err)
      setError(err.message || "Tasdiqlash xabarini qayta yuborib bo'lmadi.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page fade-in">
      <button className="btn-back-auth" onClick={() => navigate(-1)} aria-label="Ortga">
        <ChevronLeft size={24} />
      </button>
      <div className="auth-card">
        
        <div className="auth-logo">
          <MailCheck size={40} color="var(--primary-blue)" />
        </div>
        
        <h1 className="auth-title">Emailni tasdiqlang</h1>
        <p className="auth-subtitle">
          {pendingEmail
            ? `${pendingEmail} manziliga tasdiqlash xabari yuborildi. Email ichidagi havola orqali akkauntni faollashtiring.`
            : 'Agar Supabase loyihangizda email confirmation yoqilgan bo‘lsa, pochtangizdagi tasdiqlash havolasini bosing.'}
        </p>
        {fromLogin && (
          <p style={{ color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
            Login qilishdan oldin emailingizni tasdiqlashingiz kerak.
          </p>
        )}
        
        <div className="resend-container" style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Tasdiqlagandan keyin login qilishingiz mumkin</p>
          {pendingEmail && (
            <button
              type="button"
              className="btn-primary auth-btn"
              onClick={handleResend}
              disabled={submitting}
              style={{ width: '100%', marginBottom: '14px' }}
            >
              {submitting ? 'Yuborilmoqda...' : 'Tasdiqlash xabarini qayta yuborish'}
            </button>
          )}
          {statusMessage && <p style={{ color: '#1f8f57', marginBottom: '12px' }}>{statusMessage}</p>}
          {error && <p style={{ color: '#d14343', marginBottom: '12px' }}>{error}</p>}
          <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: '800', background: 'none' }}>
            Login sahifasiga o‘tish
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OTPPage
