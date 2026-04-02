import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Shield, 
  Ticket as TicketIcon, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  User,
  CreditCard,
  QrCode,
  Lock
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { formatDatePretty, parsePriceToNumber } from '../utils/tickets'
import { useAuth } from '../context/AuthContext'
import { createTicketInDB, fetchPlaceById, fetchUserTicketById, formatPrice } from '../services/databaseService'
import '../styles/TicketPage.css'

const TicketPage = () => {
  const { id, ticketId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, isAuthenticated } = useAuth()

  // State
  const [remoteTicket, setRemoteTicket] = useState(null)
  const [remotePlace, setRemotePlace] = useState(null)
  const [status, setStatus] = useState('idle') // idle | success | error | loading
  const [errorMessage, setErrorMessage] = useState('')
  const [bookingStep, setBookingStep] = useState(1) // 1: General, 2: Passport, 3: Final

  const [form, setForm] = useState({
    name: user?.fullName || user?.user_metadata?.full_name || '',
    phone: '',
    email: user?.email || '',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    guests: 1,
    ticketType: 'Standart chipta',
    passportNumber: '',
    birthDate: '',
    gender: 'MALE',
    notes: ''
  })

  // Load place and ticket info
  const place = useMemo(() => {
    if (remotePlace) return remotePlace
    return location.state?.place || null
  }, [id, location.state, remotePlace])

  useEffect(() => {
    if (ticketId && user) {
      fetchUserTicketById({ ticketId, userId: user.id })
        .then(data => {
          if (data) {
            setRemoteTicket(data)
            setStatus('success')
          }
        })
    }
  }, [ticketId, user])

  useEffect(() => {
    const pId = remoteTicket?.place_id || id
    if (!pId) return
    
    fetchPlaceById(pId).then(data => {
      if (data) setRemotePlace(data)
    })
  }, [id, remoteTicket])

  const activeTicket = remoteTicket || null
  const displayPlace = place || (activeTicket ? { 
    id: activeTicket.place_id, 
    title: activeTicket.place_title, 
    location: activeTicket.place_location,
    price: activeTicket.total_price 
  } : null)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!form.name.trim()) return "Ismingizni kiriting"
    if (!form.phone.trim()) return "Telefon raqamingizni kiriting"
    if (!form.date) return "Sayohat sanasini tanlang"
    return null
  }

  const validateStep2 = () => {
    const passportRegex = /^[A-Z]{2}[0-9]{7}$/
    if (!passportRegex.test(form.passportNumber)) return "Pasport seriyasi va raqami noto'g'ri (Masalan: AA1234567)"
    if (!form.birthDate) return "Tug'ilgan sanangizni kiriting"
    return null
  }

  const handleNextStep = () => {
    let error = null
    if (bookingStep === 1) error = validateStep1()
    else if (bookingStep === 2) error = validateStep2()

    if (error) {
      setErrorMessage(error)
      setStatus('error')
    } else {
      setErrorMessage('')
      setStatus('idle')
      setBookingStep(prev => prev + 1)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!isAuthenticated || !user?.id || !displayPlace?.id) {
      setErrorMessage('Tizimda xatolik yoki ma\'lumotlar yetarli emas. Iltimos, qaytadan urinib ko\'ring.')
      setStatus('error')
      return
    }

    setStatus('loading')
    try {
      const basePrice = parsePriceToNumber(displayPlace?.price || 0)
      const totalPrice = basePrice * (form.guests || 1)
      const uniqueId = `AF-${Math.floor(100000 + Math.random() * 900000)}`

      const ticketPayload = {
        user_id: user.id,
        ticket_id: uniqueId,
        place_id: String(displayPlace.id),
        place_title: displayPlace.title,
        place_location: displayPlace.location,
        ticket_type: form.ticketType,
        guests: form.guests,
        date: form.date,
        passenger_name: form.name,
        passenger_phone: form.phone,
        passenger_email: form.email,
        passport_number: form.passportNumber,
        birth_date: form.birthDate,
        gender: form.gender,
        total_price: totalPrice,
        
        // Payment Metadata
        payment_status: 'paid',
        payment_method: 'card',
        card_last4: cardData.number.replace(/\s/g, '').slice(-4),
        transaction_id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        payment_at: new Date().toISOString(),

        status: 'checking',
        seat: `S${Math.floor(Math.random() * 50) + 1}`,
        train: `REG-${Math.floor(Math.random() * 900) + 100}`,
        coach: `${Math.floor(Math.random() * 12) + 1}`,
        platform: `${Math.floor(Math.random() * 5) + 1}`,
        depart_time: '08:00',
        arrival_time: '12:30',
        ticket_class: form.ticketType.includes('Premium') ? 'First Class' : 'Economy Class',
        qr_code_data: uniqueId
      }

      const result = await createTicketInDB(ticketPayload)
      setRemoteTicket(result)
      setStatus('success')
    } catch (err) {
      setErrorMessage(err.message || 'Xatolik yuz berdi')
      setStatus('error')
    }
  }

  // Not logged in UI
  if (!isAuthenticated && !ticketId) {
    return (
      <div className="ticket-page">
        <div className="empty-state glass-full animate-up">
          <Lock size={64} color="var(--accent-gold)" />
          <h2>Kirish talab qilinadi</h2>
          <p>Chipta olish uchun tizimga kirishingiz kerak. Xavfsizlik yuzasidan barcha chiptalar foydalanuvchi hisobiga bog'lanadi.</p>
          <div className="actions" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <Link to="/login" className="btn-primary">Kirish</Link>
            <Link to="/register" className="btn-accent">Ro'yxatdan o'tish</Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success' && activeTicket) {
    return (
      <div className="ticket-page fade-in">
        <div className="ticket-shell container">
          <div className="ticket-top">
            <button className="btn-icon-round glass" onClick={() => navigate('/tickets')}>
              <ArrowLeft size={18} />
            </button>
            <div className="top-meta">
              <div className={`status-badge-premium ${activeTicket.status}`}>
                 <span className="pulse"></span> {activeTicket.status === 'checking' ? 'Tekshirilmoqda' : 'Tasdiqlangan'}
              </div>
            </div>
          </div>

          <div className="ticket-success-header">
            <div className="success-icon-wrap"><CheckCircle size={40} /></div>
            <h1>Sayohat chiptangiz tayyor!</h1>
            <p className="muted">Elektron chiptangiz muvaffaqiyatli band qilindi va tasdiqlanish jarayonida.</p>
          </div>

          <div className="holographic-ticket animate-up">
             <div className="ticket-main">
                <div className="ticket-inner">
                    <div className="ticket-header">
                       <div className="brand-group">
                          <img src="/logo.png" alt="Logo" className="ticket-logo" onError={(e) => e.target.style.display='none'} />
                          <div className="brand-texts">
                             <span className="b-main">AFINA</span>
                             <span className="b-sub">TRAVEL AGENCY</span>
                          </div>
                       </div>
                       <div className="ticket-serial">
                          <label>TICKET NO</label>
                          <span>{activeTicket.ticket_id}</span>
                       </div>
                    </div>

                    <div className="ticket-body">
                       <div className="route-info">
                          <div className="from">
                             <label>JO'NASH MANZILI</label>
                             <h3>TOSHKENT</h3>
                             <div className="time">{activeTicket.depart_time}</div>
                          </div>
                          <div className="transport-way">
                             <div className="line"></div>
                             <div className="transport-icon"><TicketIcon size={20} /></div>
                             <div className="line"></div>
                          </div>
                          <div className="to">
                             <label>YETIB BORISH</label>
                             <h3>{activeTicket.place_title?.toUpperCase()}</h3>
                             <div className="time">{activeTicket.arrival_time}</div>
                          </div>
                       </div>

                       <div className="passenger-grid">
                          <div className="p-item">
                             <label>YO'LOVCHI</label>
                             <span>{activeTicket.passenger_name}</span>
                          </div>
                          <div className="p-item">
                             <label>PASPORT NO</label>
                             <span>{activeTicket.passport_number}</span>
                          </div>
                          <div className="p-item">
                             <label>SANA</label>
                             <span>{formatDatePretty(activeTicket.date)}</span>
                          </div>
                          <div className="p-item">
                             <label>KLASS</label>
                             <span>{activeTicket.ticket_class}</span>
                          </div>
                       </div>

                       <div className="seat-info-ribbon glass">
                          <div className="ribbon-item">
                             <label>POYEZD/REYS</label>
                             <span>{activeTicket.train}</span>
                          </div>
                          <div className="ribbon-item">
                             <label>VAGON</label>
                             <span>{activeTicket.coach}</span>
                          </div>
                          <div className="ribbon-item">
                             <label>O'RINIDIQ</label>
                             <span>{activeTicket.seat}</span>
                          </div>
                          <div className="ribbon-item">
                             <label>PLATFORMA</label>
                             <span>{activeTicket.platform}</span>
                          </div>
                       </div>
                    </div>
                </div>
             </div>
             
             <div className="ticket-stub">
                <div className="stub-inner">
                   <div className="qr-wrap">
                      <QRCodeSVG 
                        value={`AFINA-${activeTicket.ticket_id}-${activeTicket.passport_number}`} 
                        size={110} 
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                           src: "/logo.png",
                           excavate: true,
                           width: 24,
                           height: 24
                        }}
                      />
                   </div>
                   <div className="stub-info">
                      <div className="price-tag">{formatPrice(activeTicket.total_price)}</div>
                      <div className="insurance-badge">
                         <Shield size={12} /> Sug'urta bor
                      </div>
                   </div>
                   <div className="barcode">|||| ||||| || |||| |||</div>
                </div>
             </div>
          </div>

          <div className="ticket-footer-actions">
            <button className="btn-print" onClick={() => window.print()}>
               <QrCode size={18} /> Chiptani saqlash (PDF)
            </button>
            <button className="btn-outline" onClick={() => navigate('/tickets')}>
               Mening chiptalarim
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ticket-page fade-in">
      <div className="ticket-shell container">
        <div className="booking-layout">
          <div className="booking-main">
            <div className="booking-header">
               <button className="btn-back-link" onClick={() => navigate(-1)}>
                  <ArrowLeft size={16} /> <span>Ortga qaytish</span>
               </button>
               <h1 className="booking-title">Chiptani band qilish</h1>
               <p className="muted">Uch qadamda sayohatingizni xavfsiz rasmiylashtiring.</p>
            </div>

            <div className="booking-stepper-premium">
              <div className={`step-item ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                <div className="step-icon"><Users size={20} /></div>
                <span>Ma'lumot</span>
              </div>
              <div className="step-line"></div>
              <div className={`step-item ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                <div className="step-icon"><Shield size={20} /></div>
                <span>Tasdiqlash</span>
              </div>
              <div className="step-line"></div>
              <div className={`step-item ${bookingStep >= 3 ? 'active' : ''}`}>
                <div className="step-icon"><CheckCircle size={20} /></div>
                <span>Yakunlash</span>
              </div>
            </div>

            <div className="booking-container glass-full">
              {bookingStep === 1 && (
                <div className="step-content animate-up">
                  <div className="step-header">
                    <div className="icon-badge-gold"><TicketIcon size={24} /></div>
                    <h3>Sayohat tafsilotlari</h3>
                  </div>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Ism Familiya *</label>
                      <div className="input-with-icon">
                        <User size={18} />
                        <input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Toliq ism" />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Telefon raqam *</label>
                      <div className="input-with-icon">
                        <Phone size={18} />
                        <input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+998" />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Sayohat sanasi *</label>
                      <div className="input-with-icon">
                        <Calendar size={18} />
                        <input type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Mehmonlar soni</label>
                      <div className="input-with-icon">
                        <Users size={18} />
                        <select value={form.guests} onChange={e => handleChange('guests', parseInt(e.target.value))}>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} kishi</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="actions-row" style={{ marginTop: '30px' }}>
                    <button className="btn-cancel" onClick={() => navigate(-1)}>Bekor qilish</button>
                    <button className="btn-primary next-btn" onClick={handleNextStep}>Keyingi bosqich <ChevronRight size={18} /></button>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="step-content animate-up">
                  <div className="step-header">
                    <div className="icon-badge-gold"><CreditCard size={24} /></div>
                    <h3>ID-Karta / Pasport tasdig'i</h3>
                  </div>
                  <p className="step-desc">Haqiqiy chipta yaratish uchun shaxsingizni tasdiqlovchi hujjat ma'lumotlarini kiriting.</p>
                  
                  <div className="form-grid">
                    <div className="input-group full-width">
                      <label>Pasport seriya va raqami *</label>
                      <div className="input-with-icon">
                        <Shield size={18} />
                        <input 
                          value={form.passportNumber} 
                          onChange={e => handleChange('passportNumber', e.target.value.toUpperCase())} 
                          placeholder="AA1234567" 
                          maxLength={9} 
                        />
                      </div>
                      <small className="input-hint">Seriya va raqamni birga yozing (Masalan: AA1234567)</small>
                    </div>
                    <div className="input-group">
                      <label>Tug'ilgan sana *</label>
                      <div className="input-with-icon">
                        <Calendar size={18} />
                        <input type="date" value={form.birthDate} onChange={e => handleChange('birthDate', e.target.value)} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Jinsi</label>
                      <div className="input-with-icon">
                        <User size={18} />
                        <select value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                          <option value="MALE">Erkak</option>
                          <option value="FEMALE">Ayol</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="actions-row" style={{ marginTop: '30px' }}>
                    <button className="btn-secondary" onClick={() => setBookingStep(1)}>Orqaga</button>
                    <button className="btn-primary next-btn" onClick={handleNextStep}>Ma'lumotlarni tasdiqlash <ChevronRight size={18} /></button>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="step-content animate-up text-center">
                  <div className="step-header centered">
                    <Lock size={32} className="icon-gold animate-bounce" style={{ margin: '0 auto 15px' }} />
                    <h3>Yakuniy bosqich</h3>
                  </div>
                  
                  <div className="payment-security-card glass">
                    <div className="info" style={{ textAlign: 'left' }}>
                      <h4 style={{ color: 'var(--accent-gold)' }}>Xavfsizlik kafolati</h4>
                      <p>Siz kiritgan ma'lumotlar faqat chipta rasmiylashtirish uchun ishlatiladi va bizning tizimimizda shifrlangan holda saqlanadi.</p>
                      <div className="cancellation-policy" style={{ padding: '10px 0', background: 'none' }}>
                        <AlertCircle size={16} /> <span>Eslatma: Sayohatdan 24 soat oldin bekor qilish imkoniyati mavjud.</span>
                      </div>
                    </div>
                  </div>

                  <div className="actions-row centered">
                    <button className="btn-secondary" onClick={() => setBookingStep(2)}>Tahrirlash</button>
                    <button className="btn-accent submit-btn-large" onClick={handleSubmit} disabled={status === 'loading'}>
                      {status === 'loading' ? (
                        <><Clock className="animate-spin" size={18} /> Saqlanmoqda...</>
                      ) : (
                        <><QrCode size={18} /> Chiptani band qilish</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="error-banner animate-shake">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          <aside className="booking-sidebar hide-mobile">
            <div className="order-summary-card glass-full animate-up">
              <div className="summary-image">
                 <img src={displayPlace?.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500'} alt="Place" />
                 <div className="img-overlay"></div>
                 <div className="place-tag glass">{displayPlace?.location || 'Surxondaryo'}</div>
              </div>
              <div className="summary-info">
                 <h3 className="place-title">{displayPlace?.title}</h3>
                 <div className="summary-details">
                    <div className="detail-item">
                       <Calendar size={14} />
                       <span>{form.date || 'Sana tanlanmagan'}</span>
                    </div>
                    <div className="detail-item">
                       <Users size={14} />
                       <span>{form.guests} kishi</span>
                    </div>
                 </div>
                 <div className="price-divider"></div>
                 <div className="price-breakdown">
                    <div className="price-row">
                       <span>1 kishi uchun:</span>
                       <span>{formatPrice(parsePriceToNumber(displayPlace?.price || 0))}</span>
                    </div>
                    <div className="price-row total">
                       <span>Jami narx:</span>
                       <span className="total-val">{formatPrice(parsePriceToNumber(displayPlace?.price || 0) * form.guests)}</span>
                    </div>
                 </div>
              </div>
            </div>
            <div className="trust-badge glass animate-up" style={{ animationDelay: '0.2s' }}>
               <Shield size={20} color="var(--accent-gold)" />
               <p>Barcha chiptalar davlat standartlari asosida himoyalangan.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default TicketPage
