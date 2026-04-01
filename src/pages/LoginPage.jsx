import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, ChevronRight, Sparkles } from 'lucide-react'

import '../styles/AuthPage.css'

const LoginPage = () => {
  const [phone, setPhone] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (phone) navigate('/otp')
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="auth-logo">
            <Sparkles size={32} color="var(--primary-blue)" />
        </div>
        <h1 className="auth-title">Xush kelibsiz!</h1>
        <p className="auth-subtitle">Premium xizmatlardan foydalanish uchun telefon raqamingizni kiriting</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-field">
            <Phone className="field-icon" size={20} />
            <input 
              type="tel" 
              placeholder="+998 90 123 45 67" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary auth-btn">
            Davom etish <ChevronRight size={18} />
          </button>
        </form>
        
        <p className="auth-footer">
          Akkountingiz yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
