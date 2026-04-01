import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Phone, Globe, ChevronRight, Sparkles } from 'lucide-react'

import '../styles/AuthPage.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    phone: ''
  })
  const navigate = useNavigate()

  const handleRegister = (e) => {
    e.preventDefault()
    if (formData.phone) navigate('/otp')
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="auth-logo">
            <Sparkles size={32} color="var(--primary-blue)" />
        </div>
        <h1 className="auth-title">Ro'yxatdan o'tish</h1>
        <p className="auth-subtitle">Premium platformaga qo'shiling va barcha imkoniyatlardan foydalaning</p>
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-field">
                <User className="field-icon" size={20} />
                <input 
                type="text" 
                name="firstName"
                placeholder="Ism" 
                value={formData.firstName}
                onChange={handleChange}
                required
                />
            </div>
            <div className="input-field">
                <User className="field-icon" size={20} />
                <input 
                type="text" 
                name="lastName"
                placeholder="Familiya" 
                value={formData.lastName}
                onChange={handleChange}
                required
                />
            </div>
          </div>
          
          <div className="input-field">
            <Globe className="field-icon" size={20} />
            <input 
              type="text" 
              name="country"
              placeholder="Davlat" 
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-field">
            <Phone className="field-icon" size={20} />
            <input 
              type="tel" 
              name="phone"
              placeholder="Telefon raqam" 
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary auth-btn">
            Ro'yxatdan o'tish <ChevronRight size={18} />
          </button>
        </form>
        
        <p className="auth-footer">
          Akkountingiz bormi? <Link to="/login">Kiring</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
