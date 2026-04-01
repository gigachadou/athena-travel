import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Heart, MapPin, ArrowRight, Plane, Train, Bus, Clock, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../styles/PostCard.css'

const PostCard = ({ item }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <div className="post-card glass animate-up" onClick={() => navigate(`/place/${item.id}`)}>
      <div className="card-image-wrapper">
        <img src={item.image} alt={item.title} className="card-image" loading="lazy" />
        <div className="card-badge glass">
          <Star size={12} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
          <span>{item.rating}</span>
        </div>
        <button className="btn-like-pill glass" onClick={(e) => { e.stopPropagation(); }}>
          <Heart size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
        </button>
      </div>
      
      <div className="card-content">
        <div className="card-main-info">
          <h3 className="card-title">{item.title}</h3>
          <p className="card-location">
            <MapPin size={14} />
            <span>{item.location}</span>
          </p>
          <p className="card-short-desc">{item.description}</p>
          <div className="card-meta-pills">
            {item.duration && (
              <span className="meta-pill">
                <Clock size={12} /> {item.duration}
              </span>
            )}
            {item.difficulty && (
              <span className="meta-pill">
                <Activity size={12} /> {item.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="card-transport-info">
          <div className="transport-item" title="Aeroport">
            <Plane size={14} />
            <span>{item.airportDist}</span>
          </div>
          <div className="transport-item" title="Metro">
            <Train size={14} />
            <span>{item.metroDist}</span>
          </div>
          <div className="transport-item" title="Avtobus">
            <Bus size={14} />
            <span>{item.busDist}</span>
          </div>
        </div>
        
        <div className="card-footer">
          <div className="price-tag">
            <span className="price-val">{item.price}</span>
            <span className="price-label">
                {item.type === 'hotels' ? `${t('per_person', 'kishi boshiga')} / ${t('per_day')}` : `/ ${t('per_day')}`}
            </span>
          </div>
          <button className="btn-details">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      
      <style>{`
        .post-card {
          border-radius: 24px;
          overflow: hidden;
          background: var(--white);
          border: 1px solid var(--glass-border);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .post-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);
          border-color: var(--accent-gold);
        }
        .card-image-wrapper {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .post-card:hover .card-image {
          transform: scale(1.15) rotate(1deg);
        }
        .card-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 100px;
          font-weight: 800;
          font-size: 13px;
          z-index: 2;
          background: var(--glass-highlight) !important;
          color: var(--text-dark);
        }
        .btn-like-pill {
          position: absolute;
          top: 15px;
          right: 15px;
          padding: 8px;
          border-radius: 14px;
          color: white;
          z-index: 2;
          background: rgba(0,0,0,0.2) !important;
          backdrop-filter: blur(8px);
        }
        .btn-like-pill:hover {
          color: #0f172a;
          background: var(--accent-gold) !important;
          box-shadow: 0 0 15px var(--accent-gold-glow);
        }
        
        .card-content {
          padding: 20px;
        }
        .card-main-info {
          margin-bottom: 12px;
        }
        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 4px;
          color: var(--text-dark);
        }
        .card-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .card-short-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .card-meta-pills {
          display: flex;
          gap: 8px;
          margin-bottom: 5px;
        }
        .meta-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-gold);
          background: var(--accent-gold-glow);
          padding: 4px 8px;
          border-radius: 8px;
          text-transform: uppercase;
        }
        
        .card-transport-info {
          display: flex;
          gap: 12px;
          margin-bottom: 15px;
          padding: 8px 12px;
          background: rgba(0,0,0,0.03);
          border-radius: 12px;
        }
        .transport-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-dark);
          font-size: 11px;
          font-weight: 600;
        }
        .transport-item span {
          opacity: 0.8;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 15px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .price-tag {
          display: flex;
          flex-direction: column;
        }
        .price-val {
          font-weight: 800;
          font-size: 17px;
          color: var(--accent-gold);
        }
        .price-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }
        
        .btn-details {
          width: 44px;
          height: 44px;
          background: var(--accent-gold-glow);
          color: var(--accent-gold);
          border-radius: 14px;
          transition: var(--transition);
        }
        .post-card:hover .btn-details {
          background: var(--accent-gold);
          color: #0f172a;
        }
      `}</style>
    </div>
  )
}

export default PostCard
