import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { User, Lock, ChevronRight, Sparkles, ChevronLeft } from 'lucide-react'

import '../styles/AuthPage.css'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!identifier || !password) return

    try {
      setSubmitting(true)
      setError('')
      await login({ identifier, password })
      const nextPath = location.state?.from || '/'
      navigate(nextPath, { replace: true })
    } catch (err) {
      console.error('Failed to login:', err)
      if (err.code === 'email_not_confirmed') {
        navigate('/otp', {
          replace: true,
          state: {
            email: err.email || (identifier.includes('@') ? identifier.trim() : ''),
            fromLogin: true,
          },
        })
        return
      }

      setError(err.message || 'Kirish amalga oshmadi.')
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
          <Sparkles size={32} color="var(--primary-blue)" />
        </div>
        <h1 className="auth-title">Xush kelibsiz!</h1>
        <p className="auth-subtitle">Email yoki username va parol orqali tizimga kiring</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-field">
            <User className="field-icon" size={20} />
            <input
              type="text"
              placeholder="Email yoki username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="input-field">
            <Lock className="field-icon" size={20} />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary auth-btn">
            {submitting ? 'Yuborilmoqda...' : <>Davom etish <ChevronRight size={18} /></>}
          </button>
        </form>
        {error && <p style={{ color: '#d14343', marginTop: '14px' }}>{error}</p>}

        <p className="auth-footer">
          Akkountingiz yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
