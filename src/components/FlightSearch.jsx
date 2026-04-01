import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plane, Hotel, Train, Truck, Ticket, 
  ArrowLeftRight, Search, Sparkles, 
  User, ChevronDown, MapPin, X
} from 'lucide-react'
import './FlightSearch.css'

const POPULAR_CITIES = [
  { name: 'Tashkent', code: 'TAS', country: 'Uzbekistan', region: 'Central Asia' },
  { name: 'Moscow', code: 'SVO', country: 'Russia', region: 'Europe' },
  { name: 'Beijing', code: 'PEK', country: 'China', region: 'Asia' },
  { name: 'Istanbul', code: 'IST', country: 'Turkey', region: 'Asia' },
  { name: 'Dubai', code: 'DXB', country: 'UAE', region: 'Middle East' },
  { name: 'Phuket', code: 'HKT', country: 'Thailand', region: 'Asia' },
  { name: 'Antalya', code: 'AYT', country: 'Turkey', region: 'Asia' },
  { name: 'Samarkand', code: 'SKD', country: 'Uzbekistan', region: 'Central Asia' },
  { name: 'Bangkok', code: 'BKK', country: 'Thailand', region: 'Asia' },
  { name: 'London', code: 'LHR', country: 'UK', region: 'Europe' },
]

const FlightSearch = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flights')
  const [tripType, setTripType] = useState('round')
  const [fromCity, setFromCity] = useState({ name: 'Tashkent', code: 'TAS' })
  const [toCity, setToCity] = useState({ name: 'Moscow', code: 'SVO' })
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)
  const [departureDate, setDepartureDate] = useState('2026-04-03')
  const [returnDate, setReturnDate] = useState('2026-04-10')
  const [passengers, setPassengers] = useState('1 adult, Economy')
  
  const fromRef = useRef(null)
  const toRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) setShowFromPicker(false)
      if (toRef.current && !toRef.current.contains(event.target)) setShowToPicker(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwap = () => {
    const temp = fromCity
    setFromCity(toCity)
    setToCity(temp)
  }

  const handleAISearch = () => {
    const query = `Menga ${fromCity.name} dan ${toCity.name} ga ${departureDate} sanasida sayohat uchun eng zo'r tavsiyalar bering. Yo'lovchilar: ${passengers}. Baza ma'lumotlaridan foydalaning.`
    navigate('/ai', { state: { initialMessage: query } })
  }

  const TABS = [
    { id: 'flights', icon: <Plane size={20} />, label: 'Aviabiletlar' },
    { id: 'hotels', icon: <Hotel size={20} />, label: 'Mehmonxonalar' },
    { id: 'trains', icon: <Train size={20} />, label: 'Poyezd biletlari' },
    { id: 'transfers', icon: <Truck size={20} />, label: 'Transferlar' },
    { id: 'excursions', icon: <Ticket size={20} />, label: 'Ekskursiyalar' },
  ]

  const CityPicker = ({ onSelect, currentCity }) => (
    <div className="city-picker glass animate-pop">
      <div className="picker-header">
        <h4>Mashhur shaharlar</h4>
      </div>
      <div className="city-grid">
        {POPULAR_CITIES.map(city => (
          <div 
            key={city.code} 
            className={`city-item ${currentCity.code === city.code ? 'active' : ''}`}
            onClick={() => onSelect(city)}
          >
            <div className="city-name">{city.name}</div>
            <div className="city-info">{city.country}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flight-search-container glass-full animate-up">
      {/* Tabs */}
      <div className="search-tabs">
        {TABS.map(tab => (
          <button 
            key={tab.id} 
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="search-box-main">
        {/* Trip options */}
        <div className="search-options">
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="tripType" 
                checked={tripType === 'round'} 
                onChange={() => setTripType('round')} 
              />
              <span className="custom-radio"></span>
              Borish va qaytish
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="tripType" 
                checked={tripType === 'single'} 
                onChange={() => setTripType('single')} 
              />
              <span className="custom-radio"></span>
              Bir tomonga
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="tripType" 
                checked={tripType === 'multi'} 
                onChange={() => setTripType('multi')} 
              />
              <span className="custom-radio"></span>
              Murakkab yo'nalish
            </label>
          </div>
          <div className="checkbox-group">
            <label className="check-label">
              <input type="checkbox" />
              <span className="custom-checkbox"></span>
              O'tkazmalarsiz
            </label>
          </div>
        </div>

        {/* Inputs row */}
        <div className="search-row">
          <div className="input-block from" ref={fromRef}>
            <label>Qayerdan</label>
            <div className="display-val" onClick={() => setShowFromPicker(!showFromPicker)}>
              <span className="primary-val">{fromCity.name}</span>
              <span className="secondary-val">{fromCity.code}</span>
            </div>
            {showFromPicker && (
              <CityPicker onSelect={(c) => { setFromCity(c); setShowFromPicker(false); }} currentCity={fromCity} />
            )}
          </div>

          <button className="swap-btn-circle" onClick={handleSwap}>
            <ArrowLeftRight size={18} />
          </button>

          <div className="input-block to" ref={toRef}>
            <label>Qayerga</label>
            <div className="display-val" onClick={() => setShowToPicker(!showToPicker)}>
              <span className="primary-val">{toCity.name}</span>
              <span className="secondary-val">{toCity.code}</span>
            </div>
            {showToPicker && (
              <CityPicker onSelect={(c) => { setToCity(c); setShowToPicker(false); }} currentCity={toCity} />
            )}
          </div>

          <div className="input-block date">
            <label>Borish — Qaytish</label>
            <div className="date-group">
              <div className="date-input">
                <span className="date-val">{departureDate}</span>
              </div>
              <div className="date-sep"></div>
              <div className="date-input">
                <span className="date-val">{returnDate}</span>
              </div>
            </div>
          </div>

          <div className="input-block passengers">
            <label>Yo'lovchilar va klass</label>
            <div className="display-val">
              <User size={16} color="var(--accent-gold)" />
              <span className="primary-val">{passengers}</span>
              <ChevronDown size={14} className="chevron" />
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="search-actions">
           <button className="btn-ai-search" onClick={handleAISearch}>
             <Sparkles size={20} />
             <span>AI Search</span>
             <div className="btn-glow"></div>
           </button>
           
           <button className="btn-find-main">
             <Search size={22} />
             <span>Qidirish</span>
           </button>
        </div>
      </div>
    </div>
  )
}

export default FlightSearch
