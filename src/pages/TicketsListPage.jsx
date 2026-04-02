import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket as TicketIcon, Calendar, MapPin, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { fetchUserTickets } from '../services/databaseService'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'
import '../styles/SearchPage.css' // Reusing some glass styles

const TicketsListPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        const data = await fetchUserTickets(user.id)
        setTickets((data || []).filter(t => t && t.id))
      } catch (e) {
        console.error('Failed to load tickets', e)
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [user])

  if (loading) return <Loading fullPage />

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center', minHeight: '80vh' }}>
        <TicketIcon size={64} color="var(--accent-gold)" style={{ marginBottom: '30px' }} />
        <h2 style={{ fontSize: '32px' }}>Biletlaringizni ko'rish uchun kiring</h2>
        <p className="muted" style={{ maxWidth: '500px', margin: '15px auto 30px' }}>
          Siz xarid qilgan barcha chiptalar faqat tizimga kirganingizda ko'rsatiladi.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
           <button onClick={() => navigate('/login')} className="btn-primary">Kirish</button>
           <button onClick={() => navigate('/register')} className="btn-accent">Ro'yxatdan o'tish</button>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'checking': return <Clock size={16} />
      case 'confirmed': 
      case 'completed': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  return (
    <div className="container fade-in" style={{ padding: '60px 20px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
           <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '15px' }}>
             <TicketIcon size={32} color="var(--accent-gold)" /> Sayohat Chiptalari
           </h2>
           <p className="muted">Sizning barcha faol va yakunlangan sayohatlaringiz.</p>
        </div>
        <Link to="/" className="btn-accent" style={{ padding: '12px 24px' }}>Joy izlash <ArrowRight size={18} /></Link>
      </header>

      {tickets.length === 0 ? (
        <div className="glass-full" style={{ padding: '60px', textAlign: 'center', borderRadius: '30px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ background: 'rgba(255,184,0,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
             <TicketIcon size={40} color="var(--accent-gold)" />
          </div>
          <h3>Hozircha chiptalar yo'q</h3>
          <p className="muted">Siz hali hech qanday joy uchun chipta xarid qilmagansiz.</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '30px' }}>
            Hozir band qilish
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {tickets.map((t) => (
            <div key={t.id} className="glass-full ticket-card-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '25px', borderRadius: '24px', alignItems: 'center', transition: 'transform 0.3s ease', cursor: 'default' }}>
              <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(11, 82, 193, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b52c1' }}>
                  <TicketIcon size={30} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{t.place_title}</h3>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {t.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {t.place_location}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent-gold)' }}>{t.total_price.toLocaleString()} UZS</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', background: t.status === 'confirmed' || t.status === 'completed' ? '#16a34a' : t.status === 'checking' ? '#0b52c1' : '#ef4444', padding: '4px 12px', borderRadius: '100px', marginTop: '5px', justifyContent: 'flex-end', fontWeight: '800' }}>
                     {getStatusIcon(t.status)} {t.status_label || t.status.toUpperCase()}
                   </div>
                </div>
                <Link to={`/ticket/${t.place_id}/${t.id}`} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: '800' }}>
                  Chiptani ko'rish
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <footer style={{ marginTop: '60px', padding: '30px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
        <p className="muted small">Barcha chiptalar QR-kod orqali tekshiriladi. Sayohat paytida ID-kartangizni yoningizda olib yuring.</p>
      </footer>
    </div>
  )
}

export default TicketsListPage
