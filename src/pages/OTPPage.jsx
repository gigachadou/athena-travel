import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, ArrowLeft, ShieldCheck } from 'lucide-react'

import '../styles/AuthPage.css'

const OTPPage = ({ setIsAuthenticated }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const navigate = useNavigate()

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))])

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus()
    }
  }

  const handleVerify = (e) => {
    e.preventDefault()
    if (otp.every(v => v !== '')) {
      setIsAuthenticated(true)
      navigate('/')
    }
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card" style={{ position: 'relative' }}>
        <button onClick={() => navigate(-1)} className="btn-back-circle" style={{ position: 'absolute', top: '25px', left: '25px', width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'var(--primary-blue)' }}>
          <ArrowLeft size={20} />
        </button>
        
        <div className="auth-logo">
          <ShieldCheck size={40} color="var(--primary-blue)" />
        </div>
        
        <h1 className="auth-title">Tasdiqlash</h1>
        <p className="auth-subtitle">Telefoningizga yuborilgan 6 xonali maxfiy kodni kiriting</p>
        
        <form onSubmit={handleVerify} className="auth-form">
          <div className="otp-inputs" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px' }}>
            {otp.map((data, index) => {
              return (
                <input
                  style={{ width: '45px', height: '60px', borderRadius: '15px', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '24px', fontWeight: '800', background: 'white' }}
                  type="text"
                  name="otp"
                  maxLength="1"
                  key={index}
                  value={data}
                  onChange={e => handleChange(e.target, index)}
                  onFocus={e => e.target.select()}
                />
              )
            })}
          </div>
          <button type="submit" className="btn-primary auth-btn">
            Tasdiqlash
          </button>
        </form>
        
        <div className="resend-container" style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '5px' }}>Kod kelmadimi?</p>
          <button style={{ color: 'var(--primary-blue)', fontWeight: '800', background: 'none' }}>Qayta yuborish</button>
        </div>
      </div>
    </div>
  )
}

export default OTPPage
