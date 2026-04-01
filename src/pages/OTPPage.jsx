import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'

import '../styles/AuthPage.css'

const OTPPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const pendingEmail = location.state?.email

  return (
    <div className="auth-page fade-in">
      <div className="auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate(-1)} className="btn-back-circle" style={{ position: 'absolute', top: '25px', left: '25px', width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'var(--primary-blue)' }}>
          <ArrowLeft size={20} />
        </button>
        
        <div className="auth-logo">
          <MailCheck size={40} color="var(--primary-blue)" />
        </div>
        
        <h1 className="auth-title">Emailni tasdiqlang</h1>
        <p className="auth-subtitle">
          {pendingEmail
            ? `${pendingEmail} manziliga tasdiqlash xabari yuborildi. Email ichidagi havola orqali akkauntni faollashtiring.`
            : 'Agar Supabase loyihangizda email confirmation yoqilgan bo‘lsa, pochtangizdagi tasdiqlash havolasini bosing.'}
        </p>
        
        <div className="resend-container" style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>Tasdiqlagandan keyin login qilishingiz mumkin</p>
          <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: '800', background: 'none' }}>
            Login sahifasiga o‘tish
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OTPPage
