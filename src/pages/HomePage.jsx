import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PostCard from '../components/PostCard'
import '../styles/HomePage.css'
import SidebarFilter from '../components/SidebarFilter'
import FlightSearch from '../components/FlightSearch'
import { Sparkles, MapPin, Navigation } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import Loading from '../components/Loading'
import { fetchPlaces } from '../services/databaseService'
import { createDefaultFilters, deriveFilterOptions, filterPlaces } from '../utils/placeFilters'

const HomePage = () => {
  const { t } = useTranslation()
  const userLoc = useGeolocation()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataSource, setDataSource] = useState('supabase')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(createDefaultFilters())

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  useEffect(() => {
    const loadPlaces = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await fetchPlaces()
        setPlaces(data)
        setFilters(createDefaultFilters(Math.max(...data.map((place) => place.priceValue), 0)))
      } catch (err) {
        console.error('Failed to load places:', err)
        setError("Joylarni yuklab bo'lmadi.")
      } finally {
        setLoading(false)
      }
    }

    loadPlaces()
  }, [])

  const filteredPosts = filterPlaces(places, searchTerm, filters)
  const filterOptions = deriveFilterOptions(places)
  const defaultFilters = createDefaultFilters(filterOptions.maxPrice)

  if (loading) {
    return <Loading fullPage message={t('loading')} />
  }

  return (
    <div className="home-page fade-in">
      <div className="container" style={{ paddingTop: '40px' }}>
        <header className="home-hero-compact animate-up">
            <div className="location-auto-badge glass-full animate-pop">
                <Navigation size={14} color="var(--accent-gold)" />
                <span>{userLoc.loading ? 'Joylashuv aniqlanmoqda...' : `${userLoc.city}, ${userLoc.region}`}</span>
            </div>
            <div className="hero-text">
                <h1>O'zbekistonni <span className="text-accent-gold">qayta kashf eting</span></h1>
                <p>Yurtimiz bo'ylab unutilmas sayohatni rejalashtiring <Sparkles size={18} color="var(--accent-gold)" /></p>
            </div>
        </header>

        <section className="search-section-advanced animate-up" style={{ marginBottom: '40px' }}>
           <FlightSearch />
        </section>

        {dataSource === 'mock' && (
          <div className="glass" style={{ padding: '14px 18px', borderRadius: '18px', marginBottom: '20px', color: '#9a3412', background: 'rgba(251, 191, 36, 0.14)', border: '1px solid rgba(251, 191, 36, 0.35)' }}>
            Jonli Supabase ma'lumotlari o'rniga vaqtincha local mock data ko'rsatilmoqda.
          </div>
        )}

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
            </section>
          </main>
        </div>
      </div>

      <style>{`
        .home-hero-compact {
          margin-bottom: 40px;
          text-align: left;
        }
        .text-accent-gold {
          color: var(--accent-gold);
          text-shadow: 0 0 15px var(--accent-gold-glow);
        }
        .home-layout-wrapper {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 30px;
        }
        .search-section {
          margin-bottom: 30px;
        }
        .search-bar-premium {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px 30px;
          border-radius: 24px;
          border: 2px solid transparent;
          transition: var(--transition);
        }
        .search-bar-premium:focus-within {
          border-color: var(--accent-gold);
          box-shadow: 0 0 30px var(--accent-gold-glow);
        }
        .search-bar-premium input {
          width: 100%;
          border: none;
          background: none;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-dark);
        }
        .search-bar-premium input:focus {
          outline: none;
        }
        .empty-state-card {
          padding: 50px;
          text-align: center;
          border-radius: 24px;
          margin-top: 40px;
        }
        
        .location-auto-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 20px;
          border: 1px solid var(--accent-gold-glow);
        }
        
        @media (max-width: 1024px) {
          .home-layout-wrapper {
            grid-template-columns: 1fr;
          }
          .sidebar-filter {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage
