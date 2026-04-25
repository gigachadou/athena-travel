import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plane, Hotel, Train, Truck, Ticket, 
  ArrowLeftRight, Search, Sparkles, 
  User, ChevronDown, MapPin, X
} from 'lucide-react'
import './FlightSearch.css'
import { fetchFlights } from '../services/flightService'

const POPULAR_CITIES = [
  { name: 'Tashkent', code: 'TAS', country: 'Uzbekistan', region: 'Central Asia' },
  { name: 'Moscow', code: 'VKO', country: 'Russia', region: 'Europe' },
  { name: 'Beijing', code: 'PEK', country: 'China', region: 'Asia' },
  { name: 'Istanbul', code: 'IST', country: 'Turkey', region: 'Asia' },
  { name: 'Dubai', code: 'DXB', country: 'UAE', region: 'Middle East' },
  { name: 'Samarkand', code: 'SKD', country: 'Uzbekistan', region: 'Central Asia' },
  { name: 'Antalya', code: 'AYT', country: 'Turkey', region: 'Asia' },
  { name: 'Seoul', code: 'ICN', country: 'Korea', region: 'Asia' },
]

const formatPrice = (price) => {
  return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(price);
}

const FlightSearch = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flights')
  const [tripType, setTripType] = useState('round')
  const [fromCity, setFromCity] = useState({ name: 'Tashkent', code: 'TAS' })
  const [toCity, setToCity] = useState({ name: 'Moscow', code: 'VKO' })
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, class: 'Economy' })
  const [flights, setFlights] = useState([])
  
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)
  const [showPaxPicker, setShowPaxPicker] = useState(false)
  const [citySearchTerm, setCitySearchTerm] = useState('')
  const [searching, setSearching] = useState(false)

  const [departureDate, setDepartureDate] = useState('2026-04-03')
  const [returnDate, setReturnDate] = useState('2026-04-10')
  
  const fromRef = useRef(null)
  const toRef = useRef(null)
  const paxRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setShowFromPicker(false)
        setCitySearchTerm('')
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setShowToPicker(false)
        setCitySearchTerm('')
      }
      if (paxRef.current && !paxRef.current.contains(event.target)) {
        setShowPaxPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwap = () => {
    const temp = fromCity
    setFromCity(toCity)
    setToCity(temp)
  }

  const handleMainSearch = async () => {
    if (searching) return
    setSearching(true)
    setFlights([])

    try {
      const data = await fetchFlights({
        dep_iata: fromCity.code,
        arr_iata: toCity.code,
        flight_date: departureDate
      })
      setFlights(data)
    } catch (err) {
      console.error('Search failed:', err)
      alert("Haqiqiy ma'lumotlarni olishda xatolik yuz berdi. Mock ma'lumotlar ko'rsatilmoqda.")
    } finally {
      setSearching(false)
    }
  }

  const handleAISearch = () => {
    const query = `Menga ${fromCity.name} (${fromCity.code}) dan ${toCity.name} (${toCity.code}) ga ${departureDate} sanasida ${tripType === 'round' ? 'borish-qaytish' : 'bir tomonga'} sayohat uchun eng zo'r tavsiyalar bering. Yo'lovchilar: ${passengers.adults} kattalar, ${passengers.children} bolalar. Klass: ${passengers.class}.`
    navigate('/ai', { state: { initialMessage: query } })
  }

  const filteredCities = POPULAR_CITIES.filter(c => 
    c.name.toLowerCase().includes(citySearchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(citySearchTerm.toLowerCase())
  )

  const TABS = [
    { id: 'flights', icon: <Plane size={20} />, label: 'Aviabiletlar' },
    { id: 'hotels', icon: <Hotel size={20} />, label: 'Mehmonxonalar' },
    { id: 'trains', icon: <Train size={20} />, label: 'Poyezd biletlari' },
    { id: 'transfers', icon: <Truck size={20} />, label: 'Transferlar' },
    { id: 'guides', icon: <User size={20} />, label: 'Gid yollash' },
  ]

  const CityPicker = ({ onSelect, currentCity }) => (
    <div className="city-picker glass animate-pop">
      <div className="picker-search">
        <Search size={16} />
        <input 
          autoFocus
          placeholder="Shahar yoki aeroport..." 
          value={citySearchTerm}
          onChange={(e) => setCitySearchTerm(e.target.value)}
        />
      </div>
      <div className="picker-header">
        <h4>{citySearchTerm ? 'Qidiruv natijalari' : 'Mashhur shaharlar'}</h4>
      </div>
      <div className="city-grid">
        {filteredCities.map(city => (
          <div 
            key={city.code} 
            className={`city-item ${currentCity.code === city.code ? 'active' : ''}`}
            onClick={() => {
              onSelect(city)
              setCitySearchTerm('')
            }}
          >
            <div className="city-name">{city.name}</div>
            <div className="city-info">{city.country}</div>
          </div>
        ))}
        {filteredCities.length === 0 && <p className="no-results" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Hech narsa topilmadi</p>}
      </div>
    </div>
  )

  const PassengerPicker = () => (
    <div className="city-picker glass animate-pop" style={{ width: '280px', right: 0, left: 'auto' }}>
      <div className="pax-options">
        <div className="pax-row">
          <div className="pax-info">
            <span className="p-title">Kattalar</span>
            <span className="p-sub">12 yoshdan yuqori</span>
          </div>
          <div className="pax-ctrl">
            <button onClick={(e) => { e.stopPropagation(); setPassengers({...passengers, adults: Math.max(1, passengers.adults - 1)}) }}>-</button>
            <span>{passengers.adults}</span>
            <button onClick={(e) => { e.stopPropagation(); setPassengers({...passengers, adults: passengers.adults + 1}) }}>+</button>
          </div>
        </div>
        <div className="pax-row">
          <div className="pax-info">
            <span className="p-title">Bolalar</span>
            <span className="p-sub">2 - 12 yosh</span>
          </div>
          <div className="pax-ctrl">
            <button onClick={(e) => { e.stopPropagation(); setPassengers({...passengers, children: Math.max(0, passengers.children - 1)}) }}>-</button>
            <span>{passengers.children}</span>
            <button onClick={(e) => { e.stopPropagation(); setPassengers({...passengers, children: passengers.children + 1}) }}>+</button>
          </div>
        </div>
        <div className="pax-divider"></div>
        <div className="class-selection">
          {['Economy', 'Business', 'First Class'].map(cls => (
            <div 
              key={cls} 
              className={`class-item ${passengers.class === cls ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setPassengers({...passengers, class: cls}) }}
            >
              {cls === 'Economy' ? 'Ekonom' : cls === 'Business' ? 'Biznes' : 'Premium'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const FlightCard = ({ flight }) => (
     <div className="flight-card glass animate-pop">
        <div className="flight-main">
           <div className="airline-info">
              <div className="airline-logo">{flight.airline[0]}</div>
              <div className="airline-name">
                 <strong>{flight.airline}</strong>
                 <span>{flight.flight_no}</span>
              </div>
           </div>
           <div className="flight-times">
              <div className="time-block">
                 <span className="f-time">{flight.departure.time}</span>
                 <span className="f-iata">{flight.departure.iata}</span>
              </div>
              <div className="time-path">
                 <div className="path-line"></div>
                 <Plane size={14} className="path-plane" />
              </div>
              <div className="time-block">
                 <span className="f-time">{flight.arrival.time}</span>
                 <span className="f-iata">{flight.arrival.iata}</span>
              </div>
           </div>
           <div className="flight-price">
              <span className="p-label">Bilet narxi</span>
              <span className="p-amount">{formatPrice(flight.price)}</span>
           </div>
           <button className="btn-book-flight">Sotib olish</button>
        </div>
        <div className="flight-footer">
           <span>Status: <strong className={flight.status}>{flight.status}</strong></span>
           <span>Terminal: {flight.departure.terminal || '—'}</span>
        </div>
     </div>
  )

  return (
    <div className="flight-search-container animate-up">
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

      {activeTab === 'guides' ? (
      <div className="search-box-main">
        <div className="guide-hire-box">
          <div className="guide-hire-copy">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
              <User size={22} color="var(--accent-gold)" />
              Gid yollash
            </h3>
            <p style={{ marginTop: '6px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hudud, til va narx bo'yicha mos gidni toping yoki AI orqali tavsiya oling.
            </p>
          </div>

          <div className="search-actions" style={{ marginTop: '28px', justifyContent: 'flex-start' }}>
            <button
              className="btn-ai-search"
              onClick={() => navigate('/ai', { state: { initialMessage: "Menga O'zbekistonda sayohat uchun gid tanlashda yordam ber. Region, til va byudjet bo'yicha 3 ta variant tavsiya qil." } })}
            >
              <Sparkles size={20} />
              <span>AI tavsiya</span>
            </button>

            <button className="btn-find-main" onClick={() => navigate('/guides')}>
              <Search size={22} />
              <span>Gidlarni ko'rish</span>
            </button>
          </div>
        </div>
      </div>
      ) : (
      <div className="search-box-main">
        <div className="search-options">
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" name="tripType" checked={tripType === 'round'} onChange={() => setTripType('round')} />
              <span className="custom-radio"></span> Borish va qaytish
            </label>
            <label className="radio-label">
              <input type="radio" name="tripType" checked={tripType === 'single'} onChange={() => setTripType('single')} />
              <span className="custom-radio"></span> Bir tomonga
            </label>
            <label className="radio-label">
              <input type="radio" name="tripType" checked={tripType === 'multi'} onChange={() => setTripType('multi')} />
              <span className="custom-radio"></span> Murakkab yo'nalish
            </label>
          </div>
          <div className="checkbox-group">
            <label className="check-label">
              <input type="checkbox" /> O'tkazmalarsiz
            </label>
          </div>
        </div>

        <div className="search-row">
          <div className="input-block from" ref={fromRef} onClick={() => setShowFromPicker(!showFromPicker)}>
            <label>QAYERDAN</label>
            <div className="display-val">
              <span className="primary-val">{fromCity.name}</span>
              <span className="secondary-val">{fromCity.code}</span>
            </div>
            {showFromPicker && <CityPicker onSelect={(c) => setFromCity(c)} currentCity={fromCity} />}
          </div>

          <button className="swap-btn-circle" onClick={(e) => { e.stopPropagation(); handleSwap(); }}>
            <ArrowLeftRight size={18} />
          </button>

          <div className="input-block to" ref={toRef} onClick={() => setShowToPicker(!showToPicker)}>
            <label>QAYERGA</label>
            <div className="display-val">
              <span className="primary-val">{toCity.name}</span>
              <span className="secondary-val">{toCity.code}</span>
            </div>
            {showToPicker && <CityPicker onSelect={(c) => setToCity(c)} currentCity={toCity} />}
          </div>

          <div className="input-block date">
            <label>BORISH — QAYTISH</label>
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

          <div className="input-block passengers" ref={paxRef} onClick={() => setShowPaxPicker(!showPaxPicker)}>
            <label>YO'LOVCHILAR VA KLASS</label>
            <div className="display-val">
              <span className="primary-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#f59e0b" />
                {passengers.adults + passengers.children} pax, {passengers.class}
              </span>
              <ChevronDown size={16} className="chevron" />
            </div>
            {showPaxPicker && <PassengerPicker />}
          </div>
        </div>

        <div className="search-actions">
           <button className="btn-ai-search" onClick={handleAISearch}>
             <Sparkles size={20} />
             <span>AI Search</span>
           </button>
           
           <button className="btn-find-main" onClick={handleMainSearch} disabled={searching}>
             {searching ? 'Qidirilmoqda...' : <><Search size={22} /> <span>Qidirish</span></>}
           </button>
        </div>
      </div>
      )}

      {flights.length > 0 && (
        <div className="flights-results animate-up">
           <div className="results-header">
              <h3>Topilgan reyslar ({flights.length})</h3>
           </div>
           <div className="flights-list">
              {flights.map(flight => (
                 <FlightCard key={flight.id} flight={flight} />
              ))}
           </div>
        </div>
      )}
    </div>
  )
}

export default FlightSearch
