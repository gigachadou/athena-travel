import React from 'react'
import { Search, MapPin, Compass, Mountain, Hotel, Utensils, Landmarks, Waves } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import logo from '../assets/logo.png'
import './HeroSection.css'

const CATEGORIES = [
  { id: 'mountains', icon: Mountain, label: "Tog'lar" },
  { id: 'historical', icon: Landmarks, label: 'Tarixiy' },
  { id: 'hotels', icon: Hotel, label: 'Mehmonxonalar' },
  { id: 'food', icon: Utensils, label: 'Restoranlar' },
  { id: 'lakes', icon: Waves, label: 'Ko\'llar' },
]

const HeroSection = () => {
  const { t } = useTranslation()

  return (
    <div className="hero-section animate-up">
      <div className="hero-bg">
        <div className="hero-overlay"></div>
        <img 
            src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Background" 
        />
      </div>
      
      <div className="hero-content">
        <div className="hero-brand animate-up">
          <img src={logo} alt="Yo'lchiAI Logo" />
          <div>
            <p>Yo'lchiAI bilan aqlli sayohat va shaxsiy sayohat yordamchisi.</p>
          </div>
        </div>

        <div className="hero-badge glass animate-up">
            <Compass size={16} />
            <span>{t('explore_uzb', 'O\'zbekistonni kashf eting')}</span>
        </div>
        
        <h1 className="animate-up" style={{ animationDelay: '0.1s' }}>
            {t('hero_title', 'Qadimiy Ipak Yo\'liga premium darvozangiz')}
        </h1>
        
        <div className="hero-search-container glass animate-up" style={{ animationDelay: '0.2s' }}>
            <div className="search-box">
                <Search className="search-icon" size={20} />
                <input type="text" placeholder={t('hero_search_placeholder', 'Qayerga borishni xohlaysiz?')} />
            </div>
            <div className="location-box">
                <MapPin className="pin-icon" size={20} />
                <span>{t('anywhere', 'Ixtiyoriy joy')}</span>
            </div>
            <button className="btn-search-hero">
                {t('search', 'Qidirish')}
            </button>
        </div>

        <div className="hero-categories animate-up" style={{ animationDelay: '0.3s' }}>
            {CATEGORIES.map((cat) => (
                <button key={cat.id} className="category-chip glass">
                    <cat.icon size={18} />
                    <span>{t(cat.id, cat.label)}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  )
}

export default HeroSection
