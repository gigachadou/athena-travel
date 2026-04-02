import React, { useEffect, useState } from 'react'
import { Search as SearchIcon, Filter, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PostCard from '../components/PostCard'
import SidebarFilter from '../components/SidebarFilter'
import '../styles/SearchPage.css'
import Loading from '../components/Loading'
import { fetchPlaces } from '../services/databaseService'
import { createDefaultFilters, deriveFilterOptions, filterPlaces, hasActiveFilters } from '../utils/placeFilters'

const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dataSource, setDataSource] = useState('supabase')
  const [filters, setFilters] = useState(createDefaultFilters())
  const { t } = useTranslation()

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
        setDataSource(data[0]?.__source || 'supabase')
        if (data[0]?.__source === 'mock') {
          setError("Supabase ulanmayapti, hozircha mock data ko'rsatilmoqda.")
        }
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

  const filteredPosts = filterPlaces(places, query, filters)
  const filterOptions = deriveFilterOptions(places)
  const defaultFilters = createDefaultFilters(filterOptions.maxPrice)

  if (loading) {
    return <Loading fullPage message={t('loading')} />
  }

  return (
    <div className="search-page fade-in">
      <div className="search-bar-container animate-up">
        <div className="search-input-wrapper glass">
          <SearchIcon className="search-icon" size={22} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <X className="clear-icon" size={20} onClick={() => setQuery('')} />}
        </div>
        <button 
          className={`btn-filter glass ${isFilterOpen ? 'active' : ''}`} 
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter size={20} />
          {hasActiveFilters(filters, defaultFilters) && (
            <span className="filter-badge"></span>
          )}
        </button>
      </div>

      {isFilterOpen && (
        <div className="filter-overlay-mobile fade-in" onClick={() => setIsFilterOpen(false)}>
           <div className="filter-drawer glass animate-up" onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                  <h3>{t('filters')}</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="btn-close-drawer">
                    <X size={24} />
                  </button>
              </div>
              <div className="drawer-body">
                <SidebarFilter
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  options={filterOptions}
                  defaultFilters={defaultFilters}
                />
              </div>
              <div className="drawer-footer">
                  <button className="btn-apply-filters btn-accent" onClick={() => setIsFilterOpen(false)}>
                      {t('save', 'Saqlash')}
                  </button>
              </div>
           </div>
        </div>
      )}

      <div className="search-results">
        {dataSource === 'mock' && (
          <div className="glass animate-up" style={{ padding: '14px 18px', borderRadius: '18px', marginBottom: '20px', color: '#9a3412', background: 'rgba(251, 191, 36, 0.14)', border: '1px solid rgba(251, 191, 36, 0.35)' }}>
            Jonli Supabase ma'lumotlari o'rniga vaqtincha local mock data ko'rsatilmoqda.
          </div>
        )}
        <div className="results-header animate-up">
          <h3>{t('results_found')} <span className="results-count">({filteredPosts.length})</span></h3>
        </div>
        <div className="responsive-grid">
          {filteredPosts.map((post, idx) => (
            <div className="animate-up" key={post.id} style={{ animationDelay: `${idx * 0.1}s` }}>
              <PostCard item={post} />
            </div>
          ))}
        </div>
        {filteredPosts.length === 0 && (
          <div className="empty-state-search glass animate-up">
             <h3>{error || t('no_results')}</h3>
             <p>{error ? "Supabase ma'lumotlarini tekshirib ko'ring." : "Qidiruv parametrlarini o'zgartirib ko'ring"}</p>
          </div>
        )}
      </div>

      <style>{`
        .search-page {
          padding-bottom: 40px;
        }
        .search-bar-container {
          display: flex;
          gap: 15px;
          margin-bottom: 40px;
          position: sticky;
          top: 90px;
          z-index: 100;
          background: var(--bg-color);
          padding: 15px 0;
        }
        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 10px 25px;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .search-input-wrapper:focus-within {
          border-color: var(--accent-gold);
          box-shadow: 0 10px 30px var(--accent-gold-glow);
        }
        .search-input-wrapper input {
          flex: 1;
          background: none;
          border: none;
          padding: 12px 15px;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-dark);
        }
        .search-icon { color: var(--accent-gold); }
        .clear-icon { color: var(--text-muted); cursor: pointer; }
        
        .btn-filter {
          width: 58px;
          height: 58px;
          color: var(--text-dark);
          border-radius: 20px;
          border: 1px solid var(--glass-border);
          transition: var(--transition);
        }
        .btn-filter:hover {
            border-color: var(--accent-gold);
            color: var(--accent-gold);
            box-shadow: 0 0 20px var(--accent-gold-glow);
        }
        
        .btn-filter.active {
          background: var(--accent-gold-glow);
          border-color: var(--accent-gold);
          color: var(--accent-gold);
        }
        .filter-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: var(--accent-gold);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-gold);
        }

        /* Filter Drawer */
        .filter-overlay-mobile {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }
        .filter-drawer {
          width: 350px;
          height: 100%;
          background: var(--bg-dark);
          box-shadow: -10px 0 30px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .drawer-header {
          padding: 20px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
        }
        .drawer-header h3 { font-size: 1.4rem; font-weight: 800; color: var(--accent-gold); }
        .btn-close-drawer {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-close-drawer:hover { color: var(--accent-gold); }
        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .drawer-footer {
          padding: 20px 25px;
          border-top: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.02);
        }
        .btn-apply-filters {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
        }
        
        .empty-state-search {
          padding: 60px 40px;
          text-align: center;
          border-radius: 24px;
          margin-top: 20px;
        }
        .empty-state-search h3 { margin-bottom: 10px; color: var(--text-dark); }
        .empty-state-search p { color: var(--text-muted); }

        .results-header { margin-bottom: 25px; }
        .results-header h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-dark); }
        .results-count { color: var(--text-muted); font-size: 0.9rem; margin-left: 5px; }
        
        @media (max-width: 640px) {
            .search-bar-container { top: 75px; gap: 10px; padding: 10px 0; }
            .btn-filter { width: 50px; height: 50px; }
            .filter-drawer { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default SearchPage
