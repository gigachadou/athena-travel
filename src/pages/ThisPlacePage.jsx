import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star,
  Heart,
  MapPin,
  ArrowLeft,
  Send,
  History,
  Landmark,
  Utensils,
  Hotel,
  Trees,
  Info,
  Plane,
  Train,
  Bus,
  Sparkles,
  Smile,
  Trash,
  Camera,
  Clock,
  Users,
  Award,
  CheckCircle,
  Navigation
} from 'lucide-react'
import Loading from '../components/Loading'
import BookingTicket from '../components/BookingTicket'
import { fetchPlacesFromOTM } from '../utils/api'
import { addComment, addFavorite, deleteComment, fetchCommentsByPlaceId, fetchIsFavorite, fetchPlaceAiText, fetchPlaceById, removeFavorite } from '../services/databaseService'
import { useAuth } from '../context/AuthContext'
import "../styles/ThisPlacePage.css"

const ThisPlacePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuth()

  // State management
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
  const [comments, setComments] = useState([])
  const [commentError, setCommentError] = useState('')
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [deletingCommentIds, setDeletingCommentIds] = useState([])
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Categories for nearby places
  const CATEGORIES = [
    { id: 'historical_places', label: t('landmarks', 'Tarixiy joylar'), icon: <Landmark size={20} />, color: '#FF6B6B' },
    { id: 'museums', label: t('museums', 'Muzeylar'), icon: <Info size={20} />, color: '#4ECDC4' },
    { id: 'hotels', label: t('hotels', 'Mehmonxonalar'), icon: <Hotel size={20} />, color: '#45B7D1' },
    { id: 'restaurants', label: t('restaurants', 'Restoranlar'), icon: <Utensils size={20} />, color: '#FFA07A' },
    { id: 'parks', label: t('parks', 'Parklar'), icon: <Trees size={20} />, color: '#98D8C8' },
  ]

  // Load data on component mount and when dependencies change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Fetch place data, comments, and AI text in parallel
        const [place, placeComments, aiText] = await Promise.all([
          fetchPlaceById(id),
          fetchCommentsByPlaceId(id),
          fetchPlaceAiText(id, i18n.language).catch((error) => {
            console.error('Failed to load AI texts:', error)
            return null
          }),
        ])

        setComments(placeComments || [])

        if (place) {
          // Set place data with enhanced structure
          setPlaceData({
            title: place.title,
            extract: aiText?.summary || place.description,
            copy: aiText,
            meta: place,
          })

          // Set gallery images with fallback
          setGalleryImages([
            place.image])

          // Check favorite status for authenticated users
          if (currentUser) {
            const favoriteState = await fetchIsFavorite({ placeId: id, userId: currentUser.id })
            setIsLiked(favoriteState)
          } else {
            setIsLiked(false)
          }
        }

        // Fetch nearby places
        const coords = place ? { lat: place.lat, lon: place.lon } : { lat: 37.22, lon: 67.27 }
        const nearby = await fetchPlacesFromOTM(coords.lat, coords.lon, activeCategory)

        if (nearby && nearby.length > 0) {
          setNearbyPlaces(nearby)
        } else {
          // Fallback data for demo purposes
          const fallbackData = [
            { id: 'historical_places', items: [
              { xid: 'h1', name: 'Eski Jome Masjid', kinds: 'historical', dist: 500 },
              { xid: 'h2', name: 'Arxeologiya Muzeyi', kinds: 'museum', dist: 1200 }
            ]},
            { id: 'museums', items: [{ xid: 'm1', name: 'Termiz muzeyi', kinds: 'museum', dist: 1500 }] },
            { id: 'hotels', items: [
              { xid: 'ht1', name: 'Grand Hotel', kinds: 'hotel', dist: 2500 },
              { xid: 'ht2', name: 'Meridian Hotel', kinds: 'hotel', dist: 3100 }
            ]},
            { id: 'restaurants', items: [
              { xid: 'r1', name: 'Milliy Taomlar', kinds: 'restaurant', dist: 800 },
              { xid: 'r2', name: 'Choyxona', kinds: 'food', dist: 100 }
            ]},
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

  // Navigation handlers
  const handleBookingClick = () => {
    navigate(`/ticket/${id}`)
  }

  const handleBackClick = () => {
    navigate(-1)
  }

  // Comment handlers
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
      setUserRating(0)
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
      setCommentError("Sevimlilarga qo'shish uchun avval tizimga kiring.")
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

  // Utility functions
  const formatCommentDate = (value) => {
    if (!value) return 'Hozir'
    return new Date(value).toLocaleDateString(i18n.language === 'uz' ? 'uz-UZ' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getCategoryColor = (categoryId) => {
    return CATEGORIES.find(cat => cat.id === categoryId)?.color || '#6C5CE7'
  }

  // Loading state
  if (loading) {
    return <Loading fullPage message={t('loading', 'Yuklanmoqda...')} />
  }

  // Error state
  if (!placeData) {
    return (
      <div className="error-state">
        <div className="error-content">
          <MapPin size={64} color="#6C5CE7" />
          <h2>{t('place_not_found', 'Joy topilmadi')}</h2>
          <p>{t('place_not_found_desc', 'Kechirasiz, bu joy haqida ma\'lumot topilmadi.')}</p>
          <button onClick={handleBackClick} className="btn-primary">
            <ArrowLeft size={20} />
            {t('back', 'Orqaga')}
          </button>
        </div>
      </div>
    )
  }

  const copy = placeData?.copy || {}

  return (
    <div className="place-details-page">
      {/* Header */}
      <header className="place-header">
        <div className="header-content">
          <button onClick={handleBackClick} className="back-button">
            <ArrowLeft size={24} />
          </button>

          <div className="header-brand" onClick={() => navigate('/')}>
            <span className="brand-premium">Afina</span>
            <span className="brand-travel">Travel</span>
          </div>

          <div className="header-actions">
            <button
              onClick={handleFavoriteToggle}
              disabled={favoriteBusy}
              className={`favorite-button ${isLiked ? 'liked' : ''}`}
            >
              <Heart size={24} fill={isLiked ? '#FF4757' : 'none'} />
            </button>

            <button className="book-button" onClick={handleBookingClick}>
              <CheckCircle size={20} />
              {t('book_now', 'Band qilish')}
            </button>
          </div>
        </div>
      </header>

    <div className="image-gallery">
  <div className="gallery-container">
    <div className="gallery-item">
      <img src={galleryImages[0]} alt="Main" />
    </div>
  </div>

  <div className="title-section">
    <h1 className="place-title">{placeData.title}</h1>
    <div className="location-info">
      <MapPin size={18} />
      <span>{placeData.meta?.location}</span>
    </div>
  </div>
</div>

      {/* Main Content */}
      <main className="place-content">
        <div className="content-container">
          {/* Title Section */}
          <section className="title-section">
            <div className="title-content">
              <div className="category-badge">
                <Sparkles size={16} />
                <span>{copy.mustVisitLabel || t('must_visit', 'Borish Shart!')}</span>
              </div>

              <h1 className="place-title">{placeData.title}</h1>

              <div className="location-info">
                <MapPin size={20} />
                <span>{placeData.meta?.location || placeData.extract || t('location', 'Joylashuv')}</span>
              </div>
            </div>

            <div className="rating-display">
              <div className="rating-stars">
                <Star size={20} fill="#FFD700" stroke="#FFD700" />
                <span className="rating-value">{Number(placeData.meta?.rating || 0).toFixed(1)}</span>
              </div>
              <span className="rating-count">({placeData.meta?.ratingCount || 0} {t('reviews', 'sharh')})</span>
            </div>
          </section>

          {/* Accessibility Section */}
          <section className="accessibility-section">
            <div className="section-header">
              <Info size={24} />
              <h2>{copy.locationInfoTitle || t('location_info', 'Joylashuv ma\'lumotlari')}</h2>
            </div>

            <div className="accessibility-grid">
              <div className="access-card">
                <div className="access-icon">
                  <Plane size={28} />
                </div>
                <div className="access-content">
                  <label>{t('airport', 'Aeroport')}</label>
                  <span>{placeData.meta?.airportDist || 'N/A'}</span>
                </div>
              </div>

              <div className="access-card">
                <div className="access-icon">
                  <Train size={28} />
                </div>
                <div className="access-content">
                  <label>{t('train', 'Poyezd')}</label>
                  <span>{placeData.meta?.metroDist || '15 km'}</span>
                </div>
              </div>

              <div className="access-card">
                <div className="access-icon">
                  <Bus size={28} />
                </div>
                <div className="access-content">
                  <label>{t('bus', 'Avtobus')}</label>
                  <span>{placeData.meta?.busDist || '2 km'}</span>
                </div>
              </div>

              <div className="access-card">
                <div className="access-icon">
                  <Clock size={28} />
                </div>
                <div className="access-content">
                  <label>{t('best_season', 'Eng yaxshi mavsum')}</label>
                  <span>{placeData.meta?.bestSeason || 'Bahor / Kuz'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section (for hotels) */}
          {placeData.meta?.type === 'hotels' && (
            <section className="pricing-section">
              <div className="section-header">
                <Award size={24} />
                <h2>{t('pricing', 'Narxlar')}</h2>
              </div>

              <div className="pricing-card">
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>{t('per_person', 'Kishi boshiga')}:</span>
                    <span className="price-value">{placeData.meta?.pricePerPerson}</span>
                  </div>
                  <div className="price-row total">
                    <span>{t('total_price', 'Umumiy narx')}:</span>
                    <span className="price-value large">{placeData.meta?.price}</span>
                  </div>
                </div>
                <p className="price-note">{copy.pricingNote || "* Narxlar bir kecha uchun ko'rsatilgan"}</p>
              </div>
            </section>
          )}

          {/* Description Section */}
          <section className="description-section">
            <div className="section-header">
              <History size={24} />
              <h2>{copy.historicalInfoTitle || t('historical_info', 'Tarixiy ma\'lumot')}</h2>
            </div>

            <div className="description-content">
              <p>{placeData.extract}</p>
            </div>
          </section>

          {/* Nearby Places Section */}
          <section className="nearby-section">
            <div className="section-header">
              <Navigation size={24} />
              <h2>{t('nearby_places', 'Yaqin atrofdagi joylar')}</h2>
            </div>

            <div className="category-tabs">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{ '--category-color': cat.color }}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="nearby-list">
              {nearbyPlaces.length > 0 ? (
                nearbyPlaces.map((place, idx) => (
                  <div key={place.xid || idx} className="nearby-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="nearby-content">
                      <h4>{place.name || t('unnamed_place', 'Nomsiz joy')}</h4>
                      <p>{place.kinds?.split(',').slice(0, 2).join(', ').replace(/_/g, ' ') || t('place', 'joy')}</p>
                    </div>
                    <div className="nearby-distance">
                      <span>{(place.dist / 1000).toFixed(1)} km</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <MapPin size={48} />
                  <p>{t('no_nearby_places', 'Yaqin atrofdagi joylar topilmadi')}</p>
                </div>
              )}
            </div>
          </section>

          {/* Comments Section */}
          <section className="comments-section">
            <div className="section-header">
              <Users size={24} />
              <h2>{t('reviews', 'Sharhlar')} <span className="comment-count">({comments.length})</span></h2>
            </div>

            {/* Comment Composer */}
            <div className="comment-composer">
              <div className="composer-header">
                <h3>{copy.reviewTitle || t('leave_review', 'Baholang va fikr qoldiring')}</h3>
                <p>{copy.reviewSubtitle || 'Reyting va izoh birga yuboriladi.'}</p>
              </div>

              <form className="comment-form" onSubmit={handleAddComment}>
                <div className="rating-input">
                  <label>{t('your_rating', 'Sizning bahoyingiz')}:</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-button ${star <= (hoverRating || userRating) ? 'active' : ''}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRate(star)}
                      >
                        <Star size={32} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="comment-input">
                  <textarea
                    placeholder={currentUser
                      ? (copy.commentPlaceholderAuth || 'Fikringizni yozing...')
                      : (copy.commentPlaceholderGuest || 'Fikr yozish uchun avval tizimga kiring')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={!currentUser}
                    rows={4}
                  />
                  <button type="submit" className="send-button" disabled={!currentUser || !comment.trim()}>
                    <Send size={20} />
                  </button>
                </div>
              </form>

              {!currentUser && (
                <button className="login-button" onClick={() => navigate('/login')}>
                  {copy.loginToCommentLabel || t('login_to_comment', 'Kirish va fikr yozish')}
                </button>
              )}

              {showSparkles && (
                <div className="rating-success">
                  <Sparkles size={20} />
                  <span>{copy.ratingSelectedMessage || t('rating_selected', 'Reyting tanlandi')}</span>
                </div>
              )}
            </div>

            {commentError && <div className="error-message">{commentError}</div>}

            {/* Comments List */}
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="user-info">
                      <div className="user-avatar">
                        <Smile size={16} />
                      </div>
                      <div className="user-details">
                        <strong>{comment.user}</strong>
                        <div className="comment-rating">
                          {[...Array(comment.rating)].map((_, i) => (
                            <Star key={i} size={12} fill="#FFD700" stroke="#FFD700" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="comment-meta">
                      <span className="comment-date">{formatCommentDate(comment.date)}</span>
                      {currentUser?.id === comment.userId && (
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentIds.includes(comment.id)}
                        >
                          {deletingCommentIds.includes(comment.id) ? '...' : <Trash size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ThisPlacePage