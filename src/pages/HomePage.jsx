import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PostCard from '../components/PostCard'
import '../styles/HomePage.css'
import SidebarFilter from '../components/SidebarFilter'
import FlightSearch from '../components/FlightSearch'
import { Sparkles, MapPin, Navigation } from 'lucide-react'
import { SURKHANDARYA_POSTS } from '../data/posts'
import { useGeolocation } from '../hooks/useGeolocation'

// DUMMY_POSTS removed, using SURKHANDARYA_POSTS from data file
const HomePage = () => {
  const { t } = useTranslation()
  const userLoc = useGeolocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    region: '',
    priceRange: 10000000,
    rating: 0,
    categories: [],
    bestSeason: '',
    difficulty: '',
    amenities: []
  })

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const filteredPosts = SURKHANDARYA_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = !filters.region || post.region === filters.region
    const matchesPrice = parseInt(post.price.replace(/,/g, '').replace(' UZS', '')) <= filters.priceRange
    const matchesRating = post.rating >= filters.rating
    
    const catMap = {
        'Mountains': 'nature',
        'Historical': 'historical',
        'Hotels': 'hotels',
        'Restaurants': 'restaurants'
    }
    const mappedCategories = filters.categories.map(c => catMap[c] || c)
    const matchesCategory = filters.categories.length === 0 || mappedCategories.includes(post.type)
    
    const matchesSeason = !filters.bestSeason || post.bestSeason === filters.bestSeason || post.bestSeason === 'All'
    const matchesDifficulty = !filters.difficulty || post.difficulty === filters.difficulty
    const matchesAmenities = filters.amenities.length === 0 || filters.amenities.every(a => post.amenities?.includes(a))

    return matchesSearch && matchesRegion && matchesPrice && matchesRating && matchesCategory && matchesSeason && matchesDifficulty && matchesAmenities
  })

  return (
    <div className="home-page fade-in">
      <div className="container" style={{ paddingTop: '40px' }}>
        <header className="home-hero-compact animate-up">
            <div className="location-auto-badge glass-full animate-pop">
                <Navigation size={14} color="var(--accent-gold)" />
                <span>{userLoc.loading ? 'Joylashuv aniqlanmoqda...' : `${userLoc.city}, ${userLoc.region}`}</span>
            </div>
            <div className="hero-text">
                <h1>Surxondaryoning <span className="text-accent-gold">Afsonalarini</span> kashf eting</h1>
                <p>Termizdan Sangardakgacha - Janub quyoshi ostida <Sparkles size={18} color="var(--accent-gold)" /></p>
            </div>
        </header>

        <section className="search-section-advanced animate-up" style={{ marginBottom: '40px' }}>
           <FlightSearch />
        </section>

        <div className="home-layout-wrapper">
          <SidebarFilter filters={filters} onFilterChange={handleFilterChange} />
          
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
                  <h3>Hech narsa topilmadi</h3>
                  <p>Qidiruv shartlarini o'zgartirib ko'ring</p>
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
