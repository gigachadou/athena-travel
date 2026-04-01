import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Bot, MapPin, User, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import logo from '../assets/logo.png'

import '../styles/Navigation.css'

export const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  
  return (
    <header className="header glass animate-up">
      <div className="container header-content">
        <div className="logo" onClick={() => navigate('/')}>
          <img src={logo} alt="Afina Travel Logo" className="logo-img" />
          <div className="logo-text">
            <span className="premium">Afina</span>
            <span className="platform">Travel</span>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to="/search" className={`action-btn ${location.pathname === '/search' ? 'active' : ''}`}>
            <Search size={22} color="var(--text-dark)" />
          </Link>
          {location.pathname !== '/ai' && (
            <Link to="/ai" className="btn-ai-header">
              <div className="ai-pulse"></div>
              <Bot size={20} color="#0f172a" />
              <span className="hide-mobile" style={{ color: '#0f172a' }}>{t('ai_chat')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export const Footer = () => {
  const location = useLocation()
  const { t } = useTranslation()
  
  const navItems = [
    { id: 'home', path: '/', icon: <Home size={24} />, label: t('home') },
    { id: 'search', path: '/search', icon: <Search size={24} />, label: t('search') },
    { id: 'ai', path: '/ai', icon: <Bot size={28} />, label: t('ai_chat'), special: true },
    { id: 'map', path: '/map', icon: <MapPin size={24} />, label: t('map') },
    { id: 'profile', path: '/profile', icon: <User size={24} />, label: t('profile') },
  ]

  return (
    <nav className="footer glass">
      <div className="container footer-content">
        {navItems.map(item => (
          <Link 
            key={item.id} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${item.special ? 'special' : ''}`}
          >
            <div className="icon-wrapper">
              {item.icon}
            </div>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
      <style>{navStyles}</style>
    </nav>
  )
}

/* Updated styles for Navigation */
const navStyles = `
.btn-ai-header {
  background: var(--accent-gold) !important;
  color: #0f172a !important;
  font-weight: 800 !important;
  padding: 10px 20px !important;
  border-radius: 14px !important;
  box-shadow: 0 0 20px var(--accent-gold-glow) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
.ai-pulse {
  background: white;
  opacity: 0.5;
}
.nav-item.active {
  color: var(--accent-gold) !important;
}
.nav-item.active svg {
  color: var(--accent-gold) !important;
}
.nav-item.special .icon-wrapper {
  background: var(--accent-gold) !important;
  color: #0f172a !important;
}
.nav-item.special.active .icon-wrapper {
  box-shadow: 0 0 25px var(--accent-gold-glow) !important;
}
`
