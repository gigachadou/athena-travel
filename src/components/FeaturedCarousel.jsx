import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../styles/FeaturedCarousel.css'
import BookingTicket from './BookingTicket'

const FeaturedCarousel = ({ items = [] }) => {
  const { t } = useTranslation()
  const scrollRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const autoPlayDelay = 5000 // 5 seconds
  const navigate = useNavigate()

  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            const nextIndex = (activeIndex + 1) % items.length
            scrollToIndex(nextIndex)
            return 0
          }
          return prev + (100 / (autoPlayDelay / 100))
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPaused, activeIndex, items.length])

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
      
      const newIndex = Math.round(scrollLeft / clientWidth)
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex)
        setProgress(0)
      }
    }
  }

  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      const clientWidth = scrollRef.current.clientWidth
      scrollRef.current.scrollTo({
        left: index * clientWidth,
        behavior: 'smooth'
      })
      setActiveIndex(index)
      setProgress(0)
    }
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current
      const nextIndex = direction === 'left' 
        ? Math.max(0, activeIndex - 1)
        : Math.min(items.length - 1, activeIndex + 1)
      scrollToIndex(nextIndex)
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', handleScroll)
      return () => el.removeEventListener('scroll', handleScroll)
    }
  }, [activeIndex])

  if (!items.length) return null

  return (
    <div 
      className="featured-carousel-wrapper animate-up"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="carousel-header">
        <div className="title-area">
          <h2>{t('premium_selection')}</h2>
          <p>{t('quality_comfort')}</p>
        </div>
        <div className="carousel-nav-btns hide-mobile">
          <button 
            className={`nav-btn ${!showLeftArrow ? 'disabled' : ''}`} 
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            className={`nav-btn ${!showRightArrow ? 'disabled' : ''}`} 
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="carousel-container no-scrollbar" ref={scrollRef}>
        {items.map((item) => (
          <div key={item.id} className="carousel-item" onClick={() => navigate(`/place/${item.id}`)}>
            <div className="featured-card">
              <div className="featured-image-wrapper">
                <img src={item.image} alt={item.title} className="featured-image" />
                <div className="featured-overlay">
                    <div className="top-tags">
                        <div className="featured-badge glass">
                            <Star size={14} fill="#ffb400" stroke="#ffb400" />
                            <span>{item.rating}</span>
                        </div>
                        <button className="btn-favorite-circle glass" onClick={(e) => { e.stopPropagation(); /* handle like */ }}>
                            <Heart size={20} />
                        </button>
                    </div>
                    <div className="featured-details glass">
                        <div className="featured-text">
                            <h3>{item.title}</h3>
                            <p>{item.location}</p>
                        </div>
                        <div className="featured-actions">
                            <div className="featured-price">
                                <span className="amount">{item.price}</span>
                                <span className="unit">/ {t('per_day')}</span>
                            </div>
                            <button 
                                className="btn-book-now" 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSelectedTicket(item); 
                                }}
                            >
                                {t('book_now')}
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTicket && (
        <BookingTicket 
            place={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
        />
      )}

      <div className="carousel-progress-container">
        <div className="carousel-progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="carousel-dots">
        {items.map((_, idx) => (
          <div 
            key={idx} 
            className={`dot ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => scrollToIndex(idx)}
          />
        ))}
      </div>
    </div>
  )
}

export default FeaturedCarousel
