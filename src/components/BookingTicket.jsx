import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Calendar, MapPin, User, ChevronRight, Ticket as TicketIcon, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../styles/BookingTicket.css'
import logo from '../assets/logo.png'
import { useAuth } from '../context/AuthContext'

const BookingTicket = ({ place, onClose }) => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const userName = user?.fullName || user?.username || 'Sayohatchi'
  const currentDate = new Date().toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleBookNow = () => {
    onClose();
    navigate(`/ticket/${place.id}`);
  }

  return (
    <div className="ticket-overlay glass-full fade-in" onClick={onClose}>
      <div className="ticket-container animate-up" onClick={e => e.stopPropagation()}>
        <button className="btn-close-ticket" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="ticket-perspective">
          <div className="ticket glass">
            <div className="ticket-header">
              <div className="ticket-logo">
                <img src={logo} alt="Yo'lchiAI Logo" className="booking-logo" />
                <span>YO'LCHIAI PREMIUM</span>
              </div>
              <div className="ticket-id">PROPOSAL</div>
            </div>

            <div className="ticket-body">
              <div className="ticket-image">
                <img src={place.image} alt={place.title} />
                <div className="image-overlay"></div>
              </div>

              <div className="ticket-info">
                <div className="info-main">
                  <div className="label">{t('destination')}</div>
                  <h3>{place.title}</h3>
                  <div className="location">
                    <MapPin size={14} />
                    <span>{place.location}</span>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="label">{t('name')}</div>
                    <div className="val">
                      <User size={14} />
                      <span>{userName}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="label">{t('date')}</div>
                    <div className="val">
                      <Calendar size={14} />
                      <span>{currentDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ticket-divider">
                <div className="circle left"></div>
                <div className="line"></div>
                <div className="circle right"></div>
              </div>

              <div className="ticket-footer">
                <div className="qr-section">
                  <div className="qr-mock preview-qr">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="qr-bit" style={{ opacity: Math.random() }}></div>
                    ))}
                  </div>
                  <p>CHIPTA PREVYEW</p>
                </div>
                <div className="price-section">
                    <div className="label">{t('price')}</div>
                    <div className="val">{place.price}</div>
                </div>
              </div>
            </div>
            
            <div className="hologram-overlay"></div>
          </div>
        </div>

        <div className="ticket-actions-group">
            <button className="btn-cancel-ticket" onClick={onClose}>
                <ArrowLeft size={18} /> Orqaga qaytish
            </button>
            <button className="btn-confirm-booking btn-primary" onClick={handleBookNow}>
                {t('book_now')} <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  )
}

export default BookingTicket
