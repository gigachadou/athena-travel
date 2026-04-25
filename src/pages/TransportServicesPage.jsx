import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, MapPin, Phone, Sparkles, Users } from 'lucide-react'
import Loading from '../components/Loading'
import { fetchTransportProviders, formatPrice } from '../services/databaseService'
import '../styles/ServicesPage.css'

const TransportServicesPage = () => {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchTransportProviders()
        setProviders(data || [])
      } catch (err) {
        console.error('Failed to load transport providers:', err)
        setError("Transport xizmatlarini yuklab bo'lmadi.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Loading fullPage message="Yuklanmoqda..." />

  return (
    <div className="container services-page fade-in">
      <header className="services-header animate-up">
        <button className="services-back glass" type="button" onClick={() => navigate(-1)} aria-label="Orqaga">
          <ArrowLeft size={18} />
        </button>
        <div className="services-title">
          <h2>
            <Car size={20} color="var(--accent-gold)" /> Transport xizmati
          </h2>
          <p className="muted">Haydovchi, mashina va tarif bo'yicha mos xizmatni tanlang.</p>
        </div>
      </header>

      {error && (
        <div className="glass" style={{ padding: '14px 18px', borderRadius: '18px', marginBottom: '20px', color: '#b91c1c', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {providers.length === 0 ? (
        <div className="glass-full services-empty">
          <h3>Hozircha transport xizmatlari yo'q</h3>
          <p className="muted">Keyinroq qayta urinib ko'ring yoki AI orqali tavsiya oling.</p>
          <button
            className="btn-accent"
            style={{ marginTop: '18px' }}
            onClick={() => navigate('/ai', { state: { initialMessage: "Menga O'zbekistonda transport (haydovchi/transfer) tanlashda yordam ber. Region va yo'nalish bo'yicha tavsiya ber." } })}
          >
            <Sparkles size={18} /> AI tavsiya
          </button>
        </div>
      ) : (
        <div className="responsive-grid">
          {providers.map((p) => (
            <div key={p.id} className="glass-full service-card">
              <div className="service-top">
                <div className="service-avatar">
                  {p.photoUrl ? <img src={p.photoUrl} alt={p.driverName} /> : <span>{(p.driverName || 'T').slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className="service-meta">
                  <h3>{p.driverName}</h3>
                  <div className="service-sub">
                    <span className="service-pill">
                      <Car size={14} /> {p.vehicleMake} {p.vehicleModel}
                    </span>
                    {p.serviceArea && (
                      <span className="service-pill">
                        <MapPin size={14} /> {p.serviceArea}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {p.description && <p className="service-desc">{p.description}</p>}

              <div className="service-info">
                <div className="service-row">
                  <Users size={16} color="var(--accent-gold)" />
                  <span>{p.capacity} o'rin</span>
                </div>
                <div className="service-row">
                  <span className="service-price">{formatPrice(p.farePerKm)} / km</span>
                </div>
              </div>

              <div className="service-actions">
                <a className="btn-primary" href={`tel:${p.phone}`} style={{ textDecoration: 'none' }}>
                  <Phone size={18} /> Qo'ng'iroq
                </a>
                <button
                  className="btn-accent"
                  type="button"
                  onClick={() => navigate('/ai', { state: { initialMessage: `Menga transport xizmati buyurtma qilish uchun qisqa reja tuzib ber. Haydovchi: ${p.driverName}. Mashina: ${p.vehicleMake} ${p.vehicleModel}. Hudud: ${p.serviceArea || "O'zbekiston"}. Tarif: ${formatPrice(p.farePerKm)} / km. Sig'im: ${p.capacity}.` } })}
                >
                  <Sparkles size={18} /> Reja tuzish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TransportServicesPage

