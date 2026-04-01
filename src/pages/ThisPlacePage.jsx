import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Heart, Share2, MapPin, ArrowLeft, Send, ExternalLink, History, Landmark, Utensils, Hotel, Trees, Info, Plane, Train, Bus, Sparkles, Smile } from 'lucide-react'
import Loading from '../components/Loading'
import BookingTicket from '../components/BookingTicket'
import { fetchWikipediaSummary, fetchPlacesFromOTM } from '../utils/api'
import { SURKHANDARYA_POSTS } from '../data/posts'
import '../styles/ThisPlacePage.css'

const ThisPlacePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isLiked, setIsLiked] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [placeData, setPlaceData] = useState(null)
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [activeCategory, setActiveCategory] = useState('historical_places')
  const [galleryImages, setGalleryImages] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [showSparkles, setShowSparkles] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [comments, setComments] = useState([
    { id: 1, user: 'Jasur', text: 'Juda ajoyib joy ekan, hammaga tavsiya qilaman!', date: '2 kun oldin', rating: 5 },
    { id: 2, user: 'Malika', text: 'Manzara juda gozal, dam olish uchun eng yaxshi maskan.', date: '1 hafta oldin', rating: 4 }
  ])

  const CATEGORIES = [
    { id: 'historical_places', label: t('landmarks'), icon: <Landmark size={18} /> },
    { id: 'museums', label: t('landmarks'), icon: <Info size={18} /> },
    { id: 'hotels', label: t('hotels'), icon: <Hotel size={18} /> },
    { id: 'restaurants', label: t('restaurants'), icon: <Utensils size={18} /> },
    { id: 'parks', label: t('landmarks'), icon: <Trees size={18} /> },
  ]

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      // Robust ID comparison for demo
      const post = SURKHANDARYA_POSTS.find(p => String(p.id) === String(id))
      
      if (post) {
          // Immediately set base data from our static file for demo speed
          setPlaceData({
              title: post.title,
              extract: post.description,
              meta: post
          })
          setGalleryImages([
              post.image,
              'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',
              'https://images.unsplash.com/photo-1540959196431-2fd74d538645?w=800'
          ])
      }

      // Try enrichment but don't block
      const placeName = post ? post.title : 'Surkhandarya'
      const lang = i18n.language === 'uz' ? 'uz' : 'en'
      
      try {
          const wikiData = await fetchWikipediaSummary(placeName, lang)
          if (wikiData) {
              setPlaceData(prev => ({
                  ...prev,
                  extract: wikiData.extract || prev.extract,
                  link: wikiData.link
              }))
          }
      } catch (e) {
          console.log("Wiki enrichment skipped for demo")
      }

      // Nearby places fallback for demo
      try {
          const coords = post ? { lat: post.lat, lon: post.lon } : { lat: 37.22, lon: 67.27 }
          const nearby = await fetchPlacesFromOTM(coords.lat, coords.lon, activeCategory)
          if (nearby && nearby.length > 0) {
              setNearbyPlaces(nearby)
          } else {
              // Static nearby places for demo
              setNearbyPlaces([
                  { xid: 'n1', name: 'Markaziy Park', kinds: 'park', dist: 1200 },
                  { xid: 'n2', name: 'Milliy Taomlar', kinds: 'restaurant', dist: 800 },
                  { xid: 'n3', name: 'Grand Hotel', kinds: 'hotel', dist: 2500 }
              ])
          }
      } catch (e) {
          setNearbyPlaces([
              { xid: 'n1', name: 'Markaziy Park', kinds: 'park', dist: 1200 },
              { xid: 'n2', name: 'Milliy Taomlar', kinds: 'restaurant', dist: 800 }
          ])
      }
      
      setLoading(false)
    }
    loadData()
  }, [id, activeCategory, i18n.language])

  const handleBookingClick = () => {
    setShowTicket(true)
  }

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    const newComment = {
      id: Date.now(),
      user: 'Siz',
      text: comment,
      date: 'Hozir',
      rating: userRating || 5
    }
    setComments([newComment, ...comments])
    setComment('')
  }

  const handleRate = (val) => {
    setUserRating(val)
    setShowSparkles(true)
    setTimeout(() => setShowSparkles(false), 2000)
  }

  if (loading) {
    return <Loading fullPage message={t('loading')} />
  }

  if (!placeData) {
    return (
      <div className="flex-center" style={{ height: '80vh', textAlign: 'center', padding: '20px' }}>
        <h3>{t('no_results')}</h3>
        <button onClick={() => navigate(-1)} className="btn-primary" style={{ marginTop: '20px' }}>
          {t('logout')}
        </button>
      </div>
    )
  }

  return (
    <div className="place-details-page fade-in">
      <div className="details-header animate-up">
        <button onClick={() => navigate(-1)} className="btn-icon-back glass">
          <ArrowLeft size={24} />
        </button>
        <div className="header-actions">
          <button onClick={() => setIsLiked(!isLiked)} className={`btn-icon-action glass ${isLiked ? 'liked' : ''}`}>
            <Heart size={24} fill={isLiked ? '#ff4757' : 'none'} />
          </button>
          <button className="book-btn btn-accent" onClick={handleBookingClick}>
          {t('book_now', 'Hozir band qilish')}
        </button>
        </div>
      </div>

      <div className="image-gallery-container no-scrollbar">
        {galleryImages.map((img, idx) => (
            <div key={idx} className="gallery-item">
                <img src={img} alt={`Gallery ${idx}`} />
            </div>
        ))}
      </div>

      <div className="details-content">
        <div className="title-row">
          <div className="title-left">
            <div className="category-tag-premium glass-full">
                <Sparkles size={12} color="var(--accent-gold)" />
                {t('must_visit', 'Borish Shart!')}
            </div>
            <h1>{placeData.title}</h1>
          </div>
          <div className="rating-badge-premium glass-full">
            <Star size={16} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
            <span>4.8</span>
          </div>
        </div>
        
        <div className="location-row">
          <MapPin size={18} color="var(--accent-gold)" />
          <span>{placeData.meta?.location || placeData.description || t('location')}</span>
        </div>

        <section className="accessibility-section animate-up">
            <div className="section-title">
                <Info size={20} color="var(--accent-gold)" />
                <h3>{t('location_info', 'Joylashuv ma\'lumotlari')}</h3>
            </div>
            <div className="access-grid-premium">
                <div className="access-card-premium glass-full">
                    <div className="icon-wrap-gold"><Plane size={24} /></div>
                    <div className="access-info">
                        <label>{t('airport', 'Aeroport')}</label>
                        <span>{placeData.meta?.airportDist || 'N/A'}</span>
                    </div>
                </div>
                <div className="access-card-premium glass-full">
                    <div className="icon-wrap-gold"><Train size={24} /></div>
                    <div className="access-info">
                        <label>{t('train', 'Poyezd')}</label>
                        <span>{placeData.meta?.metroDist || 'N/A'}</span>
                    </div>
                </div>
                <div className="access-card-premium glass-full">
                    <div className="icon-wrap-gold"><Bus size={24} /></div>
                    <div className="access-info">
                        <label>{t('bus', 'Avtobus')}</label>
                        <span>{placeData.meta?.busDist || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </section>

        {placeData.meta?.type === 'hotels' && (
            <section className="pricing-section animate-up">
                <div className="section-title">
                    <Hotel size={20} color="var(--accent-gold)" />
                    <h3>{t('pricing', 'Narxlar')}</h3>
                </div>
                <div className="price-detail-card-premium glass-full">
                    <div className="price-row">
                        <span>{t('per_person', 'Kishi boshiga')}:</span>
                        <span className="price-val-gold">{placeData.meta?.pricePerPerson}</span>
                    </div>
                    <div className="price-row total">
                        <span>{t('total_price', 'Umumiy narx')}:</span>
                        <span className="price-val-gold large">{placeData.meta?.price}</span>
                    </div>
                    <p className="price-note">* Narxlar bir kecha uchun ko'rsatilgan</p>
                </div>
            </section>
        )}

        <section className="info-section animate-up">
          <div className="section-title">
            <History size={20} color="var(--accent-gold)" />
            <h3>{t('historical_info')}</h3>
          </div>
          <div className="wiki-card-premium glass-full">
            <p className="description">{placeData.extract}</p>
            {placeData.link && (
              <a href={placeData.link} target="_blank" rel="noopener noreferrer" className="wiki-link-gold">
                {t('view_all')} <ExternalLink size={14} />
              </a>
            )}
          </div>
        </section>

        <section className="user-rating-section animate-up">
            <div className="rating-card glass-full">
                <div className="rating-text">
                    <h3>Qanday baholaysiz?</h3>
                    <p>Fikringiz biz uchun muhim!</p>
                </div>
                <div className="interactive-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star} 
                            className={`star-btn ${star <= (hoverRating || userRating) ? 'active' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRate(star)}
                        >
                            <Star 
                                size={32} 
                                fill={star <= (hoverRating || userRating) ? "var(--accent-gold)" : "none"} 
                                stroke={star <= (hoverRating || userRating) ? "var(--accent-gold)" : "var(--text-muted)"}
                            />
                        </button>
                    ))}
                </div>
                {showSparkles && <div className="rating-success animate-pop"><Sparkles size={20} /> Rahmat!</div>}
            </div>
        </section>

        <section className="nearby-section animate-up" style={{ marginTop: '40px' }}>
          <div className="section-title">
            <MapPin size={20} color="var(--accent-gold)" />
            <h3>{t('nearby_places')}</h3>
          </div>
          
          <div className="category-filter no-scrollbar">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                className={`filter-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="nearby-list">
            {nearbyPlaces.length > 0 ? (
              nearbyPlaces.map((place, idx) => (
                <div key={place.xid} className="nearby-item glass" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="nearby-info">
                    <h4>{place.name || t('no_results')}</h4>
                    <p>{place.kinds.split(',').slice(0, 2).join(', ').replace(/_/g, ' ')}</p>
                  </div>
                  <div className="nearby-distance">
                    <span>{(place.dist / 1000).toFixed(1)} km</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">{t('no_results')}</div>
            )}
          </div>
        </section>

        <div className="divider"></div>

        <section className="comments-section animate-up">
          <h3>Fikrlar <span className="comment-count">({comments.length})</span></h3>
          <form className="comment-form" onSubmit={handleAddComment}>
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit" className="btn-send-comment">
              <Send size={18} />
            </button>
          </form>
          <div className="comments-list">
            {comments.map(c => (
              <div key={c.id} className="comment-item-premium glass-full">
                <div className="comment-header">
                  <div className="user-info">
                    <div className="user-avatar-gold"><Smile size={14} /></div>
                    <strong>{c.user}</strong>
                  </div>
                  <div className="comment-meta">
                    <div className="mini-rating">
                        {[...Array(c.rating)].map((_, i) => <Star key={i} size={10} fill="var(--accent-gold)" stroke="var(--accent-gold)" />)}
                    </div>
                    <span>{c.date}</span>
                  </div>
                </div>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      <style>{`
        .place-details-page {
            max-width: 900px;
            margin: 0 auto;
            padding-bottom: 50px;
        }

        .category-tag-premium {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 800;
            color: var(--accent-gold);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        .rating-badge-premium {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 18px;
            font-weight: 800;
            color: var(--text-dark);
        }

        .access-grid-premium {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
        }

        .access-card-premium {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            border-radius: 24px;
            transition: var(--transition);
        }

        .access-card-premium:hover {
            transform: translateY(-5px);
            border-color: var(--accent-gold);
        }

        .icon-wrap-gold {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--accent-gold-glow);
            color: var(--accent-gold);
            border-radius: 14px;
        }

        .price-detail-card-premium {
            padding: 25px;
            border-radius: 24px;
            margin-top: 20px;
        }

        .price-val-gold {
            font-weight: 800;
            font-size: 1.3rem;
            color: var(--accent-gold);
        }

        .price-val-gold.large {
            font-size: 1.8rem;
            text-shadow: 0 0 20px var(--accent-gold-glow);
        }

        .wiki-card-premium {
            padding: 25px;
            border-radius: 24px;
            line-height: 1.7;
        }

        .wiki-link-gold {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 15px;
            color: var(--accent-gold);
            font-weight: 700;
            text-decoration: none;
            font-size: 14px;
        }

        .user-rating-section {
            margin-top: 50px;
        }

        .rating-card {
            padding: 40px;
            border-radius: 30px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 25px;
        }

        .interactive-stars {
            display: flex;
            gap: 15px;
        }

        .star-btn {
            background: none;
            border: none;
            cursor: pointer;
            transition: var(--transition);
        }

        .star-btn:hover {
            transform: scale(1.2);
        }

        .rating-success {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--accent-gold);
            font-weight: 800;
            font-size: 18px;
        }

        .comment-item-premium {
            padding: 25px;
            border-radius: 24px;
            margin-bottom: 20px;
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-avatar-gold {
            width: 32px;
            height: 32px;
            background: var(--accent-gold);
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .comment-meta {
            text-align: right;
        }

        .mini-rating {
            display: flex;
            gap: 2px;
            margin-bottom: 4px;
        }

        .comment-meta span {
            font-size: 11px;
            color: var(--text-muted);
        }

        @media (max-width: 768px) {
            .access-grid-premium {
                grid-template-columns: 1fr;
            }
        }
      `}</style>
      {showTicket && (
        <BookingTicket 
          place={placeData.meta} 
          onClose={() => setShowTicket(false)} 
        />
      )}
    </div>
  )
}

export default ThisPlacePage
