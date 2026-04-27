import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, ChevronRight, ChevronLeft } from 'lucide-react'
import logo from '../assets/logo.png'

import '../styles/AuthPage.css'
import { startSignupOtp } from '../services/emailVerificationService'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!formData.username || !formData.fullName || !formData.email || !formData.password) return
    if (formData.password !== formData.confirmPassword) {
      setError('Parollar bir xil emas.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const email = formData.email.trim()
      await startSignupOtp({
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        email,
        password: formData.password,
      })

      navigate('/otp', {
        replace: true,
        state: {
          email,
          mode: 'signup',
        },
      })
    } catch (err) {
      console.error('Failed to register:', err)
      setError(err.message || "Ro'yxatdan o'tib bo'lmadi.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
        <h1 className="auth-title">Ro'yxatdan o'tish</h1>
        <p className="auth-subtitle">Premium platformaga qo'shiling va barcha imkoniyatlardan foydalaning</p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-field">
            <User className="field-icon" size={20} />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-field">
            <User className="field-icon" size={20} />
            <input
              type="text"
              name="fullName"
              placeholder="Ism familiya"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-field">
            <Mail className="field-icon" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-field">
            <Lock className="field-icon" size={20} />
            <input
              type="password"
              name="password"
              placeholder="Parol"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-field">
            <Lock className="field-icon" size={20} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Parolni tasdiqlang"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary auth-btn">
            {submitting ? "Yuborilmoqda..." : <>Ro'yxatdan o'tish <ChevronRight size={18} /></>}
          </button>
        </form>
        {error && <p style={{ color: '#d14343', marginTop: '14px' }}>{error}</p>}

        <p className="auth-footer">
          Akkountingiz bormi? <Link to="/login">Kiring</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
