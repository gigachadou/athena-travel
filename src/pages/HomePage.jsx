import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PostCard from '../components/PostCard'
import '../styles/HomePage.css'
import SidebarFilter from '../components/SidebarFilter'
import HomeNewsCarousel from '../components/HomeNewsCarousel'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { fetchHomeNews, fetchPersonalizedPlaces } from '../services/databaseService'
import { createDefaultFilters, deriveFilterOptions, filterPlaces } from '../utils/placeFilters'

const PLACES_PAGE_SIZE = 8

const HomePage = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [places, setPlaces] = useState([])
  const [newsItems, setNewsItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(createDefaultFilters())
  const loadMoreRef = useRef(null)
  const maxPriceRef = useRef(0)

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  useEffect(() => {
    const loadPlaces = async () => {
      setLoading(true)
      setError('')

      try {
        const placeResult = await fetchPersonalizedPlaces({ userId: user?.id, pageSize: PLACES_PAGE_SIZE })
        const firstPlaces = placeResult.places || []
        const maxPrice = Math.max(0, ...firstPlaces.map((place) => place.priceValue || 0))

        maxPriceRef.current = maxPrice
        setPlaces(firstPlaces)
        setHasMore(placeResult.hasMore)
        setFilters(createDefaultFilters(maxPrice))
      } catch (err) {
        console.error('Failed to load places:', err)
        setError("Joylarni yuklab bo'lmadi.")
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    loadPlaces()
  }, [user?.id])

  useEffect(() => {
    let active = true

    fetchHomeNews()
      .then((news) => {
        if (active) setNewsItems(news)
      })
      .catch((err) => {
        console.error('Failed to load home news:', err)
        if (active) setNewsItems([])
      })

    return () => {
      active = false
    }
  }, [])

  const loadMorePlaces = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const result = await fetchPersonalizedPlaces({
        userId: user?.id,
        pageSize: PLACES_PAGE_SIZE,
        excludeIds: places.map((place) => place.id),
      })

      const nextPlaces = result.places || []
      const known = new Set(places.map((place) => String(place.id)))
      const merged = [...places, ...nextPlaces.filter((place) => !known.has(String(place.id)))]
      const nextMaxPrice = Math.max(0, ...merged.map((place) => place.priceValue || 0))

      setPlaces(merged)
      setFilters((currentFilters) => {
        const wasAtMax = Number(currentFilters.priceRange || 0) >= Number(maxPriceRef.current || 0)
        maxPriceRef.current = nextMaxPrice
        return wasAtMax ? { ...currentFilters, priceRange: nextMaxPrice } : currentFilters
      })
      setHasMore(Boolean(result.hasMore && nextPlaces.length))
    } catch (err) {
      console.error('Failed to load more places:', err)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loading, loadingMore, places, user?.id])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return undefined

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMorePlaces()
      }
    }, { rootMargin: '500px 0px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [loadMorePlaces])

  const filteredPosts = filterPlaces(places, '', filters)
  const filterOptions = deriveFilterOptions(places)
  const defaultFilters = createDefaultFilters(filterOptions.maxPrice)

  if (loading) {
    return <Loading fullPage message={t('loading')} />
  }

  return (
    <div className="home-page fade-in">
      <div className="home-news-shell">
        <HomeNewsCarousel items={newsItems} />
      </div>

      <div className="container home-feed-container">
        <div className="home-layout-wrapper">
          <SidebarFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            options={filterOptions}
            defaultFilters={defaultFilters}
          />
          
          <main className="main-content">
            <section className="posts-section animate-up">
              <div className="section-header">
                <h2>{t('featured')} ({filteredPosts.length})</h2>
              </div>
              <div className="responsive-grid">
                {filteredPosts.map((post, index) => (
                  <div key={post.id} className="animate-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <PostCard item={post} />
                  </div>
                ))}
              </div>
              {filteredPosts.length === 0 && (
                <div className="empty-state-card glass">
                  <h3>{error || 'Hech narsa topilmadi'}</h3>
                  <p>{error ? "Supabase ma'lumotlarini tekshirib ko'ring." : "Qidiruv shartlarini o'zgartirib ko'ring"}</p>
                </div>
              )}
              <div ref={loadMoreRef} className="home-load-more">
                {loadingMore && <Loading message="Yana joylar yuklanmoqda..." />}
                {!hasMore && places.length > 0 && <span>Barcha mos joylar ko'rsatildi</span>}
              </div>
            </section>
          </main>
        </div>
      </div>

      <style>{`
        .home-news-shell {
          width: calc(100vw - 48px);
          margin-left: calc(50% - 50vw + 24px);
          padding-top: 28px;
        }
        .home-feed-container {
          padding-top: 8px;
        }
        .home-layout-wrapper {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 30px;
        }
        .empty-state-card {
          padding: 50px;
          text-align: center;
          border-radius: 24px;
          margin-top: 40px;
        }
        .home-load-more {
          min-height: 86px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-weight: 800;
          font-size: 13px;
        }

        @media (max-width: 1024px) {
          .home-layout-wrapper {
            grid-template-columns: 1fr;
          }
          .sidebar-filter {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .home-news-shell {
            width: calc(100vw - 24px);
            margin-left: calc(50% - 50vw + 12px);
            padding-top: 14px;
          }
          .home-feed-container {
            padding-left: 0;
            padding-right: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage
