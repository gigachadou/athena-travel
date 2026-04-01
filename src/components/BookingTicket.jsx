import React from 'react'
import { X, Calendar, MapPin, User, ChevronRight, Ticket as TicketIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../styles/BookingTicket.css'

const BookingTicket = ({ place, onClose }) => {
  const { t, i18n } = useTranslation()
  const userName = JSON.parse(localStorage.getItem('afina_user_data'))?.name || 'Sayohatsiz'
  const currentDate = new Date().toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

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
                <TicketIcon size={24} className="icon-gold" />
                <span>AFINA PREMIUM</span>
              </div>
              <div className="ticket-id">#AF-{Math.floor(Math.random() * 9000) + 1000}</div>
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
                  <div className="qr-mock">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="qr-bit" style={{ opacity: Math.random() }}></div>
                    ))}
                  </div>
                  <p>{t('scanner_text')}</p>
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

        <button className="btn-confirm-booking btn-primary" onClick={onClose}>
          {t('book_now')} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export default BookingTicket
