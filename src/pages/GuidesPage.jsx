import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Languages, MapPin, Phone, Sparkles, Star } from 'lucide-react'
import Loading from '../components/Loading'
import { fetchTourGuides, formatPrice } from '../services/databaseService'
import '../styles/ServicesPage.css'

const GuidesPage = () => {
  const navigate = useNavigate()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchTourGuides()
        setGuides(data || [])
      } catch (err) {
        console.error('Failed to load tour guides:', err)
        setError("Gidlarni yuklab bo'lmadi.")
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
            <Sparkles size={20} color="var(--accent-gold)" /> Gid yollash
          </h2>
          <p className="muted">Tajribali gidlarni region, til va narx bo'yicha tanlang.</p>
        </div>
      </header>

      {error && (
        <div className="glass" style={{ padding: '14px 18px', borderRadius: '18px', marginBottom: '20px', color: '#b91c1c', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      {guides.length === 0 ? (
        <div className="glass-full services-empty">
          <h3>Hozircha gidlar yo'q</h3>
          <p className="muted">Keyinroq qayta urinib ko'ring yoki AI orqali tavsiya oling.</p>
          <button
            className="btn-accent"
            style={{ marginTop: '18px' }}
            onClick={() => navigate('/ai', { state: { initialMessage: "Menga O'zbekistonda sayohat uchun gid tanlashda yordam ber. Region, til va byudjet bo'yicha tavsiya ber." } })}
          >
            <Sparkles size={18} /> AI tavsiya
          </button>
        </div>
      ) : (
        <div className="responsive-grid">
          {guides.map((g) => (
            <div key={g.id} className="glass-full service-card">
              <div className="service-top">
                <div className="service-avatar">
                  {g.photoUrl ? <img src={g.photoUrl} alt={g.name} /> : <span>{(g.name || 'G').slice(0, 1).toUpperCase()}</span>}
                </div>
                <div className="service-meta">
                  <h3>{g.name}</h3>
                  <div className="service-sub">
                    <span className="service-pill">
                      <Star size={14} /> {Number(g.rating || 0).toFixed(1)}
                    </span>
                    {g.region && (
                      <span className="service-pill">
                        <MapPin size={14} /> {g.region}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {g.description && <p className="service-desc">{g.description}</p>}

              <div className="service-info">
                <div className="service-row">
                  <Languages size={16} color="var(--accent-gold)" />
                  <span>{(g.languages || []).length ? g.languages.join(', ') : 'uz'}</span>
                </div>
                <div className="service-row">
                  <span className="service-price">{formatPrice(g.hourlyRate)} / soat</span>
                </div>
              </div>

              <div className="service-actions">
                <a className="btn-primary" href={`tel:${g.phone}`} style={{ textDecoration: 'none' }}>
                  <Phone size={18} /> Qo'ng'iroq
                </a>
                <button
                  className="btn-accent"
                  type="button"
                  onClick={() => navigate('/ai', { state: { initialMessage: `Menga ${g.name} ismli gid bilan sayohat rejasini tuzib ber. Region: ${g.region || "O'zbekiston"}. Til: ${(g.languages || ['uz']).join(', ')}. Byudjet: soatiga ${formatPrice(g.hourlyRate)}.` } })}
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

export default GuidesPage

