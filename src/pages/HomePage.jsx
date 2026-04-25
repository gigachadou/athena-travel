import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PostCard from '../components/PostCard'
import '../styles/HomePage.css'
import SidebarFilter from '../components/SidebarFilter'
import FlightSearch from '../components/FlightSearch'
import { Sparkles, Navigation, Filter, X } from 'lucide-react'
import { useGeolocation } from '../hooks/useGeolocation'
import Loading from '../components/Loading'
import { fetchPlaces } from '../services/databaseService'
import { createDefaultFilters, deriveFilterOptions, filterPlaces, hasActiveFilters } from '../utils/placeFilters'

const HomePage = () => {
  const { t } = useTranslation()
  const userLoc = useGeolocation()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataSource, setDataSource] = useState('supabase')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(createDefaultFilters())
  const [isFilterOpen, setIsFilterOpen] = useState(false)

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
                <button
                  className={`home-filter-toggle glass ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter size={18} />
                  <span>{t('filters', 'Filtrlar')}</span>
                  {hasActiveFilters(filters, defaultFilters) && <span className="home-filter-badge"></span>}
                </button>
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

        {isFilterOpen && (
          <div className="home-filter-overlay fade-in" onClick={() => setIsFilterOpen(false)}>
            <div className="home-filter-drawer glass animate-up" onClick={(e) => e.stopPropagation()}>
              <div className="home-filter-drawer-header">
                <h3>{t('filters', 'Filtrlar')}</h3>
                <button className="home-filter-close" onClick={() => setIsFilterOpen(false)}>
                  <X size={22} />
                </button>
              </div>
              <div className="home-filter-drawer-body">
                <SidebarFilter
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  options={filterOptions}
                  defaultFilters={defaultFilters}
                />
              </div>
              <div className="home-filter-drawer-footer">
                <button className="btn-accent home-filter-apply" onClick={() => setIsFilterOpen(false)}>
                  {t('save', 'Saqlash')}
                </button>
              </div>
            </div>
          </div>
        )}
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
        .home-filter-toggle {
          display: none;
          position: relative;
          padding: 12px 16px;
          border-radius: 16px;
          color: var(--text-dark);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-sm);
        }
        .home-filter-toggle.active {
          border-color: var(--accent-gold);
          color: var(--accent-gold);
        }
        .home-filter-badge {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-gold);
          box-shadow: 0 0 12px var(--accent-gold-glow);
        }
        .home-filter-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1200;
          display: flex;
          justify-content: flex-end;
        }
        .home-filter-drawer {
          width: min(420px, 100%);
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border: none;
          box-shadow: -12px 0 40px rgba(0, 0, 0, 0.18);
        }
        .home-filter-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--glass-border);
        }
        .home-filter-drawer-header h3 {
          font-size: 1.2rem;
          font-weight: 800;
        }
        .home-filter-close {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          color: var(--text-dark);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--glass-border);
        }
        .home-filter-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
        }
        .home-filter-drawer-body .sidebar-filter {
          display: block;
          position: static;
          max-height: none;
          margin-bottom: 0;
          padding: 20px;
        }
        .home-filter-drawer-footer {
          padding: 16px 20px 20px;
          border-top: 1px solid var(--glass-border);
        }
        .home-filter-apply {
          width: 100%;
          justify-content: center;
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
          .home-filter-toggle {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }
        }
        @media (max-width: 640px) {
          .home-hero-compact {
            margin-bottom: 28px;
          }
          .section-header {
            gap: 12px;
            align-items: flex-start;
          }
          .hero-text h1 {
            font-size: 1.9rem;
            line-height: 1.08;
          }
          .hero-text p {
            font-size: 0.95rem;
          }
          .home-filter-toggle {
            width: 100%;
            justify-content: center;
          }
          .home-filter-drawer {
            width: 100%;
          }
          .home-filter-drawer-body {
            padding: 14px;
          }
          .home-filter-drawer-body .sidebar-filter {
            padding: 16px;
            border-radius: 24px;
          }
          .empty-state-card {
            padding: 32px 20px;
            margin-top: 28px;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage
