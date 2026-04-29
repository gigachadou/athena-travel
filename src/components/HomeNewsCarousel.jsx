import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Pause, Play, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../styles/HomeNewsCarousel.css'

const ROTATE_MS = 6500
const IMAGE_LAG_MS = 420

const HomeNewsCarousel = ({ items = [] }) => {
  const navigate = useNavigate()
  const slides = useMemo(() => items.filter(Boolean), [items])
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    setActiveIndex(0)
    setImageIndex(0)
  }, [slides.length])

  useEffect(() => {
    const timer = window.setTimeout(() => setImageIndex(activeIndex), IMAGE_LAG_MS)
    return () => window.clearTimeout(timer)
  }, [activeIndex])

  useEffect(() => {
    if (!isPlaying || slides.length < 2) return undefined
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearInterval(interval)
  }, [isPlaying, slides.length])

  if (!slides.length) return null

  const activeSlide = slides[activeIndex]
  const imageSlide = slides[imageIndex] || activeSlide

  const goTo = (index) => {
    const nextIndex = (index + slides.length) % slides.length
    setActiveIndex(nextIndex)
  }

  const openSlide = () => {
    if (activeSlide.placeId) {
      navigate(`/place/${activeSlide.placeId}`)
    }
  }

  const handleSlideKeyDown = (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && activeSlide.placeId) {
      event.preventDefault()
      openSlide()
    }
  }

  return (
    <section
      className={`home-news-carousel animate-up ${activeSlide.placeId ? 'is-clickable' : ''}`}
      aria-label="News"
      role={activeSlide.placeId ? 'button' : undefined}
      tabIndex={activeSlide.placeId ? 0 : undefined}
      onClick={openSlide}
      onKeyDown={handleSlideKeyDown}
    >
      <div className="home-news-media" aria-hidden="true">
        <img key={imageSlide.id} src={imageSlide.image} alt="" />
      </div>

      <div className="home-news-shade" />

      <div className="home-news-content">
        <div className="home-news-copy" key={activeSlide.id}>
          <span className="home-news-kicker">
            <Sparkles size={16} /> News
          </span>
          <p className="home-news-subtitle">{activeSlide.subtitle}</p>
          <h2>{activeSlide.title}</h2>
          <p className="home-news-description">{activeSlide.description}</p>
          {activeSlide.location && (
            <div className="home-news-location">
              <MapPin size={18} />
              <span>{activeSlide.location}</span>
            </div>
          )}
        </div>

        <div className="home-news-controls" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="news-icon-btn" onClick={() => goTo(activeIndex - 1)} aria-label="Oldingi yangilik">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className="news-icon-btn" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "To'xtatish" : "Davom ettirish"}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button type="button" className="news-icon-btn" onClick={() => goTo(activeIndex + 1)} aria-label="Keyingi yangilik">
            <ChevronRight size={22} />
          </button>

          {activeSlide.placeId && (
            <button type="button" className="news-cta" onClick={openSlide}>
              {activeSlide.ctaLabel}
            </button>
          )}
        </div>
      </div>

      <div className="home-news-strip">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`home-news-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              goTo(index)
            }}
            aria-label={`${index + 1}-yangilik`}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default HomeNewsCarousel
