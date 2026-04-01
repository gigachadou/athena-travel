import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ticket as TicketIcon, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { fetchUserTickets } from '../services/databaseService'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'

const TicketsListPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTickets = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const data = await fetchUserTickets(user.id)
        setTickets(data || [])
      } catch (e) {
        console.error('Failed to load tickets', e)
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [user])

  if (loading) return <Loading fullPage />

  if (!user) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <TicketIcon size={48} color="var(--accent-gold)" style={{ marginBottom: '20px' }} />
        <h2>Biletlaringizni ko'rish uchun kiring</h2>
        <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '20px' }}>
          Kirish
        </button>
      </div>
    )
  }

  return (
    <div className="container fade-in" style={{ padding: '40px 20px', minHeight: '70vh' }}>
      <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TicketIcon size={28} color="var(--accent-gold)" /> Barcha biletlar
      </h2>

      {tickets.length === 0 ? (
        <div className="glass-full" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
          <p>Sizda hozircha xarid qilingan chiptalar yo'q.</p>
          <Link to="/" className="btn-accent" style={{ display: 'inline-flex', marginTop: '20px' }}>
            Joy izlash <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {tickets.map((t) => (
            <div key={t.id} className="glass-full ticket-list-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '10px' }}>{t.place_title}</h3>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {t.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {t.place_location}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '12px', background: t.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: t.status === 'confirmed' ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                  {t.status === 'confirmed' ? 'Tasdiqlangan' : t.status}
                </span>
                <Link to={`/ticket/${t.place_id}/${t.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                  Batafsil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TicketsListPage
