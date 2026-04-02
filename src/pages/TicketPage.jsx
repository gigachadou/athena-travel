import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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
  ChevronRight 
} from 'lucide-react'
import { SURKHANDARYA_POSTS } from '../data/posts'
import { addTicket, formatDatePretty, getTicketById, parsePriceToNumber } from '../utils/tickets'
import { useAuth } from '../context/AuthContext'
import { createTicketInDB, fetchPlaceById, fetchUserTicketById, formatPrice } from '../services/databaseService'
import '../styles/TicketPage.css'

const TicketPage = () => {
  const { id, ticketId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const savedUser = useMemo(() => {
    const stored = localStorage.getItem('afina_user_data')
    return stored ? JSON.parse(stored) : {}
  }, [])

  const storedTicket = useMemo(() => getTicketById(ticketId || id), [id, ticketId])
  const [remoteTicket, setRemoteTicket] = useState(null)
  const [remotePlace, setRemotePlace] = useState(null)

  const activeTicket = remoteTicket || storedTicket || null

  const place = useMemo(() => {
    if (remotePlace) {
      return remotePlace
    }

    if (storedTicket) {
      return SURKHANDARYA_POSTS.find(p => String(p.id) === String(storedTicket.placeId)) || location.state?.place || null
    }

    const fromList = SURKHANDARYA_POSTS.find(p => String(p.id) === String(id)) || null
    return location.state?.place || fromList || null
  }, [id, storedTicket, location.state, remotePlace])

  const [form, setForm] = useState({
    name: savedUser.name || '',
    phone: savedUser.phone || '',
    email: savedUser.email || '',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    guests: 2,
    ticketType: place?.type === 'hotels' ? 'Premium xona' : 'Standart chipta',
    notes: ''
  })

  const [status, setStatus] = useState(activeTicket ? 'success' : 'idle') // idle | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [createdTicket, setCreatedTicket] = useState(activeTicket || null)

  const ticketIdRef = useRef(activeTicket?.id || `AF-${Math.floor(Math.random() * 900000 + 100000)}`)

  const basePrice = parsePriceToNumber(place?.price || 0)
  const computedTotal = activeTicket?.totalPrice ?? activeTicket?.total_price ?? (basePrice * (form.guests || 1))

  const locale = i18n.language === 'uz' ? 'uz-UZ' : 'en-US'
  const fallbackFrom = 'Tashkent'
  const fallbackTo = 'Surxondaryo'

  const generatedSeat = useMemo(() => activeTicket?.seat || `C ${Math.floor(Math.random() * 36) + 1}`, [activeTicket])
  const generatedTrain = useMemo(() => activeTicket?.train || `0${Math.floor(Math.random() * 9000 + 1000)}`, [activeTicket])
  const generatedCoach = useMemo(() => activeTicket?.coach || String(Math.floor(Math.random() * 8) + 1).padStart(2, '0'), [activeTicket])
  const generatedPlatform = useMemo(() => activeTicket?.platform || String(Math.floor(Math.random() * 3) + 1), [activeTicket])

  const formattedDate = formatDatePretty(form.date || new Date().toISOString().slice(0, 10), locale)

  const placeDisplay = place || (activeTicket ? {
    id: activeTicket.place_id || activeTicket.placeId || id,
    title: activeTicket.place_title || activeTicket.title || 'Tanlangan joy',
    location: activeTicket.place_location || activeTicket.location || '',
    price: formatPrice(activeTicket.total_price || activeTicket.totalPrice || 0),
    type: activeTicket.ticket_type || activeTicket.type || 'historical',
  } : null)

  const previewTicket = useMemo(() => {
    const destination = placeDisplay?.location?.split(',')?.[0] || placeDisplay?.title || fallbackTo
    const origin = placeDisplay?.origin || fallbackFrom
    const ticketId = activeTicket?.id || ticketIdRef.current

    return {
      id: ticketId,
      passenger: form.name.trim() || 'Komiljonov Diyorbek',
      from: activeTicket?.from || origin,
      to: activeTicket?.to || destination,
      date: activeTicket?.date || form.date,
      datePretty: formatDatePretty(activeTicket?.date || form.date, locale) || formattedDate,
      seat: generatedSeat,
      train: generatedTrain,
      coach: generatedCoach,
      platform: generatedPlatform,
      departTime: activeTicket?.departTime || activeTicket?.depart_time || '8:13 PM',
      arrivalTime: activeTicket?.arrivalTime || activeTicket?.arrival_time || '9:30 PM',
      className: activeTicket?.ticketClass || activeTicket?.ticket_class || 'Economy Class',
      total: computedTotal
    }
  }, [activeTicket, computedTotal, formattedDate, form.date, form.name, generatedCoach, generatedPlatform, generatedSeat, generatedTrain, locale, placeDisplay])

  useEffect(() => {
    let active = true

    const loadRemoteTicket = async () => {
      if (!ticketId || !user?.id) {
        if (active) setRemoteTicket(null)
        return
      }

      try {
        const nextTicket = await fetchUserTicketById({ ticketId, userId: user.id })
        if (active) {
          setRemoteTicket(nextTicket)
          if (nextTicket) {
            setCreatedTicket(nextTicket)
            setStatus('success')
          }
        }
      } catch (error) {
        console.error('Failed to load ticket from Supabase:', error)
      }
    }

    loadRemoteTicket()
    return () => {
      active = false
    }
  }, [ticketId, user?.id])

  useEffect(() => {
    let active = true

    const remotePlaceId = remoteTicket?.place_id || id
    const localMatch = SURKHANDARYA_POSTS.find((item) => String(item.id) === String(remotePlaceId))

    if (location.state?.place) {
      setRemotePlace(location.state.place)
      return undefined
    }

    if (localMatch) {
      setRemotePlace(localMatch)
      return undefined
    }

    if (!remotePlaceId) {
      setRemotePlace(null)
      return undefined
    }

    fetchPlaceById(remotePlaceId)
      .then((data) => {
        if (active) setRemotePlace(data)
      })
      .catch((error) => {
        console.error('Failed to load place for ticket:', error)
        if (active) setRemotePlace(null)
      })

    return () => {
      active = false
    }
  }, [id, location.state, remoteTicket?.place_id])

  useEffect(() => {
    if (activeTicket) {
      setForm(prev => ({
        ...prev,
        name: activeTicket.name || activeTicket.passenger_name || prev.name,
        phone: activeTicket.phone || activeTicket.passenger_phone || prev.phone,
        email: activeTicket.email || activeTicket.passenger_email || prev.email,
        date: activeTicket.date || prev.date,
        guests: activeTicket.guests || prev.guests,
        ticketType: activeTicket.type || activeTicket.ticket_type || prev.ticketType
      }))
    }
  }, [activeTicket])

  useEffect(() => {
    if (placeDisplay) {
      setForm(prev => ({
        ...prev,
        ticketType: placeDisplay.type === 'hotels' ? 'Premium xona' : prev.ticketType
      }))
    }
  }, [placeDisplay])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!placeDisplay) {
      return 'Tanlangan joy topilmadi. Iltimos, ortga qayting.'
    }
    const missing = []
    if (!form.name.trim()) missing.push(t('name', 'Ism'))
    if (!form.phone.trim()) missing.push(t('phone', 'Telefon'))
    if (!form.date) missing.push(t('date', 'Sana'))
    if (missing.length) {
      return `Quyidagi maydonlarni to'ldiring: ${missing.join(', ')}`
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (activeTicket) return
    const validationError = validate()
    if (validationError) {
      setStatus('error')
      setErrorMessage(validationError)
      return
    }

    const ticketId = ticketIdRef.current
    const totalPrice = basePrice * (form.guests || 1)
    const ticketPayload = {
      id: ticketId,
      placeId: placeDisplay.id,
      title: placeDisplay.title,
      location: placeDisplay.location,
      price: placeDisplay.price,
      from: placeDisplay?.origin || fallbackFrom,
      to: placeDisplay?.location?.split(',')?.[0] || placeDisplay?.title || fallbackTo,
      type: form.ticketType,
      guests: form.guests,
      date: form.date,
      name: form.name,
      phone: form.phone,
      email: form.email,
      status: 'confirmed',
      totalPrice,
      createdAt: new Date().toISOString(),
      seat: generatedSeat,
      train: generatedTrain,
      coach: generatedCoach,
      platform: generatedPlatform,
      departTime: '8:13 PM',
      arrivalTime: '9:30 PM',
      ticketClass: previewTicket.className
    }

    if (user) {
      try {
        await createTicketInDB({
          id: ticketId,
          user_id: user.id,
          place_id: String(placeDisplay.id),
          place_title: placeDisplay.title,
          place_location: placeDisplay.location,
          ticket_type: form.ticketType,
          guests: form.guests,
          date: form.date,
          passenger_name: form.name,
          passenger_phone: form.phone,
          passenger_email: form.email,
          status: 'confirmed',
          total_price: totalPrice,
          seat: generatedSeat,
          train: generatedTrain,
          coach: generatedCoach,
          platform: generatedPlatform,
          depart_time: '8:13 PM',
          arrival_time: '9:30 PM',
          ticket_class: previewTicket.className
        })
      } catch (err) {
        console.error('Failed to save to supabase', err)
      }
    }

    addTicket(ticketPayload) // Local fallback
    setCreatedTicket(ticketPayload)
    setStatus('success')
    setErrorMessage('')
  }

  if (!placeDisplay && !activeTicket) {
    return (
      <div className="ticket-page fade-in">
        <div className="empty-state glass-full animate-up">
          <AlertCircle size={32} color="var(--accent-gold)" />
          <h3>Joy topilmadi</h3>
          <p>Ro'yxatdan qayta tanlab ko'ring.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>{t('home')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ticket-page fade-in">
      <div className="ticket-shell container">
        <div className="ticket-top">
          <button className="btn-icon-round glass" onClick={() => navigate(-1)} title="Ortga qaytish">
            <ArrowLeft size={18} />
          </button>
          <div className="top-meta">
            <div className="pill solid">
              <TicketIcon size={14} /> Afina Travel
            </div>
            <div className="top-price glass">
              <span>{t('price')}</span>
              <strong>{placeDisplay?.price || formatPrice(computedTotal)}</strong>
            </div>
          </div>
        </div>

        <div className="ticket-layout-modern">
          <div className="card glass-full ticket-form-card animate-up">
            <div className="card-header">
              <div>
                <p className="eyebrow">1-qadam</p>
                <h3>Chipta ma'lumotlari</h3>
                <p className="muted">Ism, sana va mehmonlar sonini kiriting. Pastdagi dizaynda tayyor chipta ko'rinadi.</p>
              </div>
              <Shield size={32} color="var(--accent-gold)" />
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="input-field">
                  <span>{t('name')}</span>
                  <div className="input-shell">
                    <TicketIcon size={16} />
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={(e) => handleChange('name', e.target.value)} 
                      placeholder="Ism Familiya"
                      disabled={!!activeTicket}
                    />
                  </div>
                </label>

                <label className="input-field">
                  <span>{t('phone')}</span>
                  <div className="input-shell">
                    <Phone size={16} />
                    <input 
                      type="tel" 
                      value={form.phone} 
                      onChange={(e) => handleChange('phone', e.target.value)} 
                      placeholder="+998 90 123 45 67"
                      disabled={!!activeTicket}
                    />
                  </div>
                </label>

                <label className="input-field">
                  <span>Email</span>
                  <div className="input-shell">
                    <Mail size={16} />
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={(e) => handleChange('email', e.target.value)} 
                      placeholder="user@example.com"
                      disabled={!!activeTicket}
                    />
                  </div>
                </label>

                <label className="input-field">
                  <span>{t('date')}</span>
                  <div className="input-shell">
                    <Calendar size={16} />
                    <input 
                      type="date" 
                      value={form.date} 
                      onChange={(e) => handleChange('date', e.target.value)} 
                      min={new Date().toISOString().slice(0, 10)}
                      disabled={!!activeTicket}
                    />
                  </div>
                </label>

                <label className="input-field">
                  <span>Mehmonlar</span>
                  <div className="input-shell">
                    <Users size={16} />
                    <input 
                      type="number" 
                      value={form.guests} 
                      onChange={(e) => handleChange('guests', Number(e.target.value))} 
                      min={1}
                      max={12}
                      disabled={!!activeTicket}
                    />
                  </div>
                </label>

                <label className="input-field">
                  <span>Chipta turi</span>
                  <div className="input-shell">
                    <Shield size={16} />
                    <select value={form.ticketType} onChange={(e) => handleChange('ticketType', e.target.value)} disabled={!!activeTicket}>
                      <option value="Standart chipta">Standart chipta</option>
                      <option value="Premium xona">Premium xona</option>
                      <option value="VIP ekskursiya">VIP ekskursiya</option>
                    </select>
                    {activeTicket && <span className="locked-tag">View only</span>}
                  </div>
                </label>
              </div>

              <label className="input-field full">
                <span>Qo'shimcha izoh</span>
                <div className="input-shell">
                  <Clock size={16} />
                  <textarea 
                    rows="3" 
                    value={form.notes} 
                    onChange={(e) => handleChange('notes', e.target.value)} 
                    placeholder="Yo'lga chiqish vaqti, maxsus ehtiyojlar..."
                    disabled={!!activeTicket}
                  />
                </div>
              </label>

              {status === 'error' && (
                <div className="banner error">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {status === 'success' && createdTicket && (
                <div className="banner success">
                  <CheckCircle size={18} color="var(--accent-gold)" />
                  <div>
                    <strong>Chipta tayyor!</strong>
                    <p className="muted">Quyidagi dizayn orqali chop etishingiz yoki saqlashingiz mumkin.</p>
                  </div>
                </div>
              )}

              {!activeTicket && (
                <button type="submit" className="btn-accent submit-btn">
                  Tasdiqlash <ChevronRight size={18} />
                </button>
              )}
            </form>
          </div>

          <div className="ticket-preview-wrapper animate-up">
            <div className="preview-top">
              <div>
                <p className="eyebrow">Vizual chipta</p>
                <h3>{placeDisplay?.title || 'Tanlangan joy'}</h3>
                <p className="muted"><MapPin size={14} /> {placeDisplay?.location || fallbackTo}</p>
              </div>
              <div className={`status-chip ${status === 'success' ? 'ok' : 'pending'}`}>
                {status === 'success' ? 'Tasdiqlandi' : 'Draft'}
              </div>
            </div>

            <div className="train-ticket">
              <div className="perforation-line">
                <span className="circle top"></span>
                <span className="circle bottom"></span>
              </div>

              <div className="ticket-left">
                <div className="ticket-watermark"></div>
                
                <div className="ticket-header-strip">
                  <div className="blue-banner">
                    <div className="brand-text">AFINA<br/>TRAVEL</div>
                    <div className="main-title">TRAIN TICKET</div>
                  </div>
                  <div className="ticket-class">{previewTicket.className}</div>
                </div>

                <div className="ticket-body">
                  <div className="passenger-info">
                    <span className="meta-label">YO'LOVCHI ISMI:</span>
                    <span className="passenger-name">{previewTicket.passenger}</span>
                  </div>

                  <div className="route-info">
                    <div>
                      <div className="meta-label">QAYERDAN:</div>
                      <div className="meta-value">{previewTicket.from}</div>
                    </div>
                    <div>
                      <div className="meta-label">QAYERGA:</div>
                      <div className="meta-value">{previewTicket.to}</div>
                    </div>
                  </div>

                  <div className="details-row">
                    <div>
                      <div className="meta-label">SANA:</div>
                      <div className="meta-value">{form.date}</div>
                    </div>
                    <div>
                      <div className="meta-label">POYEZD VAGON</div>
                      <div className="meta-value">{previewTicket.train} &nbsp;&nbsp;&nbsp;&nbsp; {previewTicket.coach}</div>
                    </div>
                    <div>
                      <div className="meta-label">VAGON RAQAMI</div>
                      <div className="meta-value">{previewTicket.seat.replace(/[^0-9]/g, '') || '2'}</div>
                    </div>
                  </div>

                  <div className="barcode-block">
                    <div className="route-info" style={{gap: '40px', marginBottom: '8px'}}>
                      <div>
                        <div className="meta-label">JO'NASH VAQTI</div>
                        <div className="meta-value" style={{fontSize: '14px'}}>{previewTicket.departTime}</div>
                      </div>
                      <div>
                        <div className="meta-label">YETIB BORISH VAQTI</div>
                        <div className="meta-value" style={{fontSize: '14px'}}>{previewTicket.arrivalTime}</div>
                      </div>
                    </div>
                    <div className="barcode-lines">
                      {Array.from({ length: 42 }).map((_, idx) => (
                        <span key={idx}></span>
                      ))}
                    </div>
                    <small>1676 8989 7867 9020</small>
                  </div>
                </div>
                

                <div className="vertical-brand" style={{right: 'auto', left: '100%', marginLeft: '10px'}}>
                  {previewTicket.from.toUpperCase()} TO {previewTicket.to.toUpperCase()}
                </div>
              </div>

              <div className="ticket-right">
                <div className="right-list">
                  <div className="right-row"><span>DATE</span> <div>: {form.date}</div></div>
                  <div className="right-row"><span>NAME</span> <div>: {previewTicket.passenger}</div></div>
                  <div className="right-row"><span>TRAIN</span> <div>: {previewTicket.train}</div></div>
                  <div className="right-row"><span>PLATFORM</span> <div>: {previewTicket.platform}</div></div>
                  <div className="right-row"><span>CARRIAGE</span> <div>: {previewTicket.coach}</div></div>
                  <div className="right-row"><span>SEAT</span> <div>: {previewTicket.seat}</div></div>
                  <div className="right-row"><span>TIME</span> <div>: {previewTicket.departTime} - {previewTicket.arrivalTime}</div></div>
                </div>

                <div className="blue-bottom">
                  TRAIN TICKET
                </div>
              </div>
            </div>

            <div className="ticket-actions">
              {status === 'success' && createdTicket ? (
                <>
                  <button className="btn-primary" onClick={() => navigate('/profile')}>
                    Profilga o'tish
                  </button>
                  <button className="btn-accent" onClick={() => navigate(`/ticket/${createdTicket.id}`)}>
                    Chiptani ko'rish
                  </button>
                </>
              ) : (
                <p className="muted small">Ma'lumotlarni to'ldiring va "Tasdiqlash" ni bosing — chipta shu ko'rinishda saqlanadi.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketPage
