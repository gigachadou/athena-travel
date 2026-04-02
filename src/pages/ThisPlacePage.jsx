import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Heart, MapPin, ArrowLeft, Send, History, Landmark, Utensils, Hotel, Trees, Info, Plane, Train, Bus, Sparkles, Smile, Trash } from 'lucide-react'
import Loading from '../components/Loading'
import BookingTicket from '../components/BookingTicket'
import { fetchPlacesFromOTM } from '../utils/api'
import { addComment, addFavorite, deleteComment, fetchCommentsByPlaceId, fetchIsFavorite, fetchPlaceAiText, fetchPlaceById, removeFavorite } from '../services/databaseService'
import '../styles/ThisPlacePage.css'
import { useAuth } from '../context/AuthContext'

const ThisPlacePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuth()
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
  const [comments, setComments] = useState([])
  const [commentError, setCommentError] = useState('')
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [deletingCommentIds, setDeletingCommentIds] = useState([])

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
      try {
        const [place, placeComments, aiText] = await Promise.all([
          fetchPlaceById(id),
          fetchCommentsByPlaceId(id),
          fetchPlaceAiText(id, i18n.language).catch((error) => {
            console.error('Failed to load AI texts:', error)
            return null
          }),
        ])

        setComments(placeComments)

        if (place) {
          setPlaceData({
            title: place.title,
            extract: aiText?.summary || place.description,
            copy: aiText,
            meta: place,
          })
          setGalleryImages([
            place.image,
            'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800',
            'https://images.unsplash.com/photo-1540959196431-2fd74d538645?w=800',
          ])

          if (currentUser) {
            const favoriteState = await fetchIsFavorite({ placeId: id, userId: currentUser.id })
            setIsLiked(favoriteState)
          } else {
            setIsLiked(false)
          }
        }

        const coords = place ? { lat: place.lat, lon: place.lon } : { lat: 37.22, lon: 67.27 }
        const nearby = await fetchPlacesFromOTM(coords.lat, coords.lon, activeCategory)
        if (nearby && nearby.length > 0) {
          setNearbyPlaces(nearby)
        } else {
          const fallbackData = [
            { id: 'historical_places', items: [{ xid: 'h1', name: 'Eski Jome Masjid', kinds: 'historical', dist: 500 }, { xid: 'h2', name: 'Arxeologiya Muzeyi', kinds: 'museum', dist: 1200 }] },
            { id: 'museums', items: [{ xid: 'm1', name: 'Termiz muzeyi', kinds: 'museum', dist: 1500 }] },
            { id: 'hotels', items: [{ xid: 'ht1', name: 'Grand Hotel', kinds: 'hotel', dist: 2500 }, { xid: 'ht2', name: 'Meridian Hotel', kinds: 'hotel', dist: 3100 }] },
            { id: 'restaurants', items: [{ xid: 'r1', name: 'Milliy Taomlar', kinds: 'restaurant', dist: 800 }, { xid: 'r2', name: 'Choyxona', kinds: 'food', dist: 100 }] },
            { id: 'parks', items: [{ xid: 'n1', name: 'Markaziy Park', kinds: 'park', dist: 1200 }] },
          ]
          const catItems = fallbackData.find(c => c.id === activeCategory)?.items || []
          setNearbyPlaces(catItems)
        }
      } catch (e) {
        console.error('Failed to load place details:', e)
        setPlaceData(null)
        setComments([])
        setNearbyPlaces([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, activeCategory, i18n.language, currentUser?.id])

  const handleBookingClick = () => {
    navigate(`/ticket/${id}`)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    if (!currentUser) {
      setCommentError('Fikr yozish uchun avval tizimga kiring.')
      return
    }

    try {
      setCommentError('')
      await addComment({
        placeId: id,
        userId: currentUser.id,
        commentText: comment.trim(),
        rating: userRating || 5,
      })

      const refreshedComments = await fetchCommentsByPlaceId(id)
      setComments(refreshedComments)
      setComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      setCommentError("Fikrni saqlab bo'lmadi.")
    }
  }

  const handleRate = (val) => {
    setUserRating(val)
    setShowSparkles(true)
    setTimeout(() => setShowSparkles(false), 2000)
  }

  const handleFavoriteToggle = async () => {
    if (!currentUser) {
      setCommentError('Sevimlilarga qo‘shish uchun avval tizimga kiring.')
      return
    }

    try {
      setFavoriteBusy(true)
      setCommentError('')

      if (isLiked) {
        await removeFavorite({ placeId: id, userId: currentUser.id })
        setIsLiked(false)
      } else {
        await addFavorite({ placeId: id, userId: currentUser.id })
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Failed to update favorite:', error)
      setCommentError("Sevimli holatini yangilab bo'lmadi.")
    } finally {
      setFavoriteBusy(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!commentId || !currentUser) return

    try {
      setCommentError('')
      setDeletingCommentIds((prev) => [...prev, commentId])
      await deleteComment(commentId)
      const refreshedComments = await fetchCommentsByPlaceId(id)
      setComments(refreshedComments)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      setCommentError("Fikrni o'chirib bo'lmadi.")
    } finally {
      setDeletingCommentIds((prev) => prev.filter((item) => item !== commentId))
    }
  }

  const formatCommentDate = (value) => {
    if (!value) return 'Hozir'
    return new Date(value).toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return <Loading fullPage message={t('loading')} />
  }

  const copy = placeData?.copy || {}

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
      <div className="details-header premium-header animate-up">
        <div className="header-left">
           <button onClick={() => navigate(-1)} className="btn-icon-back glass">
              <ArrowLeft size={24} />
           </button>
           <div className="header-logo" onClick={() => navigate('/')}>
              <span className="premium">Afina</span>
              <span className="platform">Travel</span>
           </div>
        </div>
        
        <div className="header-right">
           <button onClick={handleFavoriteToggle} disabled={favoriteBusy} className={`btn-icon-action glass ${isLiked ? 'liked' : ''}`}>
             <Heart size={22} fill={isLiked ? '#ff4757' : 'none'} />
           </button>
           <button className="book-btn-premium" onClick={handleBookingClick}>
             {t('book_now', 'Band qilish')}
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
              {copy.mustVisitLabel || t('must_visit', 'Borish Shart!')}
            </div>
            <h1>{placeData.title}</h1>
          </div>
          <div className="rating-badge-premium glass-full">
            <Star size={16} fill="var(--accent-gold)" stroke="var(--accent-gold)" />
            <span>{Number(placeData.meta?.rating || 0).toFixed(1)}</span>
          </div>
        </div>

        <div className="location-row">
          <MapPin size={18} color="var(--accent-gold)" />
          <span>{placeData.meta?.location || placeData.extract || t('location')}</span>
        </div>

        <section className="accessibility-section animate-up">
          <div className="section-title">
            <Info size={20} color="var(--accent-gold)" />
            <h3>{copy.locationInfoTitle || t('location_info', 'Joylashuv ma\'lumotlari')}</h3>
          </div>
          <div className="access-grid-premium">
            <div className="access-card-premium glass-full">
              <div className="icon-wrap-gold"><Plane size={24} /></div>
              <div className="access-info">
                <label>{t('airport', 'Aeroport')}: </label>
                <span>{placeData.meta?.airportDist || 'N/A'}</span>
              </div>
            </div>
            <div className="access-card-premium glass-full">
              <div className="icon-wrap-gold"><Train size={24} /></div>
              <div className="access-info">
                <label>{t('train', 'Poyezd')}: </label>
                <span>{placeData.meta?.metroDist || '15 km'}</span>
              </div>
            </div>
            <div className="access-card-premium glass-full">
              <div className="icon-wrap-gold"><Bus size={24} /></div>
              <div className="access-info">
                <label>{t('bus', 'Avtobus/Metro')}: </label>
                <span>{placeData.meta?.busDist || '2 km'}</span>
              </div>
            </div>
            <div className="access-card-premium glass-full">
              <div className="icon-wrap-gold"><Trees size={24} /></div>
              <div className="access-info">
                <label>Mavsum: </label>
                <span>{placeData.meta?.bestSeason || 'Bahor / Kuz'}</span>
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
              <p className="price-note">{copy.pricingNote || "* Narxlar bir kecha uchun ko'rsatilgan"}</p>
            </div>
          </section>
        )}

        <section className="info-section animate-up">
          <div className="section-title">
            <History size={20} color="var(--accent-gold)" />
            <h3>{copy.historicalInfoTitle || t('historical_info')}</h3>
          </div>
          <div className="wiki-card-premium glass-full">
            <p className="description">{placeData.extract}</p>
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
          <div className="comment-composer glass-full">
            <div className="rating-text">
              <h4>{copy.reviewTitle || 'Baholang va fikr qoldiring'}</h4>
              <p>{copy.reviewSubtitle || 'Reyting va izoh birga yuboriladi.'}</p>
            </div>
            <form className="comment-form" onSubmit={handleAddComment}>
              <div className="interactive-stars comment-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= (hoverRating || userRating) ? 'active' : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                  >
                    <Star
                      size={28}
                      fill={star <= (hoverRating || userRating) ? 'var(--accent-gold)' : 'none'}
                      stroke={star <= (hoverRating || userRating) ? 'var(--accent-gold)' : 'var(--text-muted)'}
                    />
                  </button>
                ))}
              </div>
              <div className="comment-input-row">
                <textarea
                  placeholder={currentUser
                    ? (copy.commentPlaceholderAuth || 'Fikringizni yozing...')
                    : (copy.commentPlaceholderGuest || 'Fikr yozish uchun avval tizimga kiring')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!currentUser}
                  rows="3"
                />
                <button type="submit" className="btn-send-comment" disabled={!currentUser}>
                  <Send size={18} />
                </button>
              </div>
            </form>
            {!currentUser && (
              <button className="btn-primary login-to-comment" onClick={() => navigate('/login')}>
                {copy.loginToCommentLabel || 'Kirish va fikr yozish'}
              </button>
            )}
            {showSparkles && <div className="rating-success animate-pop"><Sparkles size={18} /> {copy.ratingSelectedMessage || 'Reyting tanlandi'}</div>}
          </div>
          {commentError && <p style={{ color: '#d14343', marginTop: '10px' }}>{commentError}</p>}
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
                    <span>{formatCommentDate(c.date)}</span>
                  </div>
                </div>
                <p>{c.text}</p>
                {currentUser?.id === c.userId && (
                  <button
                    className="comment-delete-btn"
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    disabled={deletingCommentIds.includes(c.id)}
                    aria-label={deletingCommentIds.includes(c.id) ? 'O‘chirilyapti...' : 'O‘chirish'}
                  >
                    {deletingCommentIds.includes(c.id) ? '...' : <Trash size={16} />}
                  </button>
                )}
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

        .interactive-stars {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
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

        .comment-composer {
            padding: 24px;
            border-radius: 24px;
            margin-bottom: 18px;
        }

        .comment-composer .rating-text {
            margin-bottom: 14px;
        }

        .comment-composer .rating-text h4 {
            margin-bottom: 4px;
            color: var(--text-dark);
        }

        .comment-composer .rating-text p {
            color: var(--text-muted);
            font-size: 14px;
        }

        .comment-stars {
            margin-bottom: 14px;
        }

        .comment-input-row {
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }

        .comment-input-row textarea {
            width: 100%;
            min-height: 92px;
            resize: vertical;
            border: 1px solid var(--glass-border);
            border-radius: 18px;
            padding: 14px 16px;
            background: rgba(255,255,255,0.8);
            color: var(--text-dark);
            font: inherit;
        }

        .comment-input-row textarea:focus {
            outline: none;
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 3px var(--accent-gold-glow);
        }

        .btn-send-comment:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .login-to-comment {
            margin-top: 14px;
        }

        .comment-delete-btn {
            margin-top: 14px;
            padding: 10px 14px;
            border: 1px solid rgba(209, 67, 67, 0.16);
            background: rgba(209, 67, 67, 0.08);
            color: #d14343;
            border-radius: 16px;
            cursor: pointer;
            font-weight: 700;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .comment-delete-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            background: rgba(209, 67, 67, 0.14);
        }

        .comment-delete-btn:disabled {
            opacity: 0.65;
            cursor: not-allowed;
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

            .comment-input-row {
                flex-direction: column;
                align-items: stretch;
            }
        }
      `}</style>
    </div>
  )
}

export default ThisPlacePage
