import { Filter, Star, MapPin, Trash2, Mountain, Landmark, Hotel, Utensils, Coins, Sun, Snowflake, Leaf, Thermometer, Wifi, Car, Compass, UserCheck, ShieldCheck, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './SidebarFilter.css'

const SidebarFilter = ({ filters, onFilterChange }) => {
  const { t } = useTranslation()

  const CATEGORY_ICONS = {
    'Mountains': <Mountain size={16} />,
    'Historical': <Landmark size={16} />,
    'Hotels': <Hotel size={16} />,
    'Restaurants': <Utensils size={16} />
  }

  const handleCategoryToggle = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    onFilterChange({ categories: newCategories })
  }

  const handlePriceChange = (e) => {
    onFilterChange({ priceRange: parseInt(e.target.value) })
  }

  const handleRatingSelect = (rating) => {
    onFilterChange({ rating: filters.rating === rating ? 0 : rating })
  }

  const handleRegionChange = (e) => {
    onFilterChange({ region: e.target.value })
  }

  const handleAmenityToggle = (amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity]
    onFilterChange({ amenities: newAmenities })
  }

  const resetFilters = () => {
    onFilterChange({
      region: '',
      priceRange: 10000000,
      rating: 0,
      categories: [],
      bestSeason: '',
      difficulty: '',
      amenities: []
    })
  }

  const SEASON_ICONS = {
    'Spring': <Leaf size={16} color="#4ADE80" />,
    'Summer': <Sun size={16} color="#FBBF24" />,
    'Autumn': <Thermometer size={16} color="#FB923C" />,
    'Winter': <Snowflake size={16} color="#60A5FA" />
  }

  return (
    <aside className="sidebar-filter glass-full animate-up">
      <div className="sidebar-header">
        <div className="title-group">
            <Filter size={20} className="filter-icon" color="var(--accent-gold)" />
            <h3>{t('filters', 'Filtrlar')}</h3>
        </div>
        <button className="reset-btn" onClick={resetFilters}>
            <Trash2 size={14} />
            <span>{t('reset', 'Tozalash')}</span>
        </button>
      </div>

      <div className="filter-group">
        <label>
            <MapPin size={16} color="var(--accent-gold)" />
            {t('location', 'Hudud')}
        </label>
        <div className="filter-input-wrapper">
            <select value={filters.region} onChange={handleRegionChange}>
                <option value="">{t('select_region', 'Barcha hududlar')}</option>
                <option value="tashkent">Toshkent</option>
                <option value="samarkand">Samarqand</option>
                <option value="bukhara">Buxoro</option>
                <option value="khiva">Xiva</option>
                <option value="jizzakh">Jizzax</option>
                <option value="karakalpakstan">Qoraqalpog'iston</option>
            </select>
            <ChevronDown size={18} className="select-arrow" />
        </div>
      </div>

      <div className="filter-group">
        <label>
            <Coins size={16} color="var(--accent-gold)" />
            {t('price_range', 'Maksimal narx')}
        </label>
        <div className="price-display">
            {filters.priceRange.toLocaleString()} <span>UZS</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="10000000" 
            step="100000" 
            className="price-slider-red" 
            value={filters.priceRange}
            onChange={handlePriceChange}
        />
      </div>

      <div className="filter-group">
        <label>
            <Star size={16} color="var(--accent-gold)" />
            {t('min_rating', 'Minimal reyting')}
        </label>
        <div className="rating-options">
            {[5, 4, 3].map((star) => (
                <button 
                    key={star} 
                    className={`rating-btn-red ${filters.rating === star ? 'active' : ''}`}
                    onClick={() => handleRatingSelect(star)}
                >
                    {star} <Star size={14} fill={filters.rating >= star ? "var(--accent-gold)" : "none"} color={filters.rating >= star ? "var(--accent-gold)" : "currentColor"} />
                </button>
            ))}
        </div>
      </div>

      <div className="filter-group">
        <label>
            <Filter size={16} color="var(--accent-gold)" />
            {t('categories', 'Kategoriyalar')}
        </label>
        <div className="checkbox-list">
            {[
                { id: 'Mountains', label: 'Tog\'lar' },
                { id: 'Historical', label: 'Tarixiy' },
                { id: 'Hotels', label: 'Mehmonxonalar' },
                { id: 'Restaurants', label: 'Restoranlar' }
            ].map((cat) => (
                <label key={cat.id} className="checkbox-item-premium">
                    <input 
                        type="checkbox" 
                        checked={filters.categories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                    />
                    <div className={`check-card glass ${filters.categories.includes(cat.id) ? 'active' : ''}`}>
                        {CATEGORY_ICONS[cat.id]}
                        <span className="label-text">{cat.label}</span>
                    </div>
                </label>
            ))}
        </div>
      </div>
      
      <div className="filter-group">
        <label>
            <Compass size={16} color="var(--accent-gold)" />
            {t('best_season', 'Eng yaxshi fasl')}
        </label>
        <div className="season-options">
            {[
                { id: 'Spring', label: 'Bahor' },
                { id: 'Summer', label: 'Yoz' },
                { id: 'Autumn', label: 'Kuz' },
                { id: 'Winter', label: 'Qish' }
            ].map((season) => (
                <button 
                    key={season.id} 
                    className={`season-btn ${filters.bestSeason === season.id ? 'active' : ''}`}
                    onClick={() => onFilterChange({ bestSeason: filters.bestSeason === season.id ? '' : season.id })}
                >
                    {SEASON_ICONS[season.id]}
                    <span>{season.label}</span>
                </button>
            ))}
        </div>
      </div>

      <div className="filter-group">
        <label>
            <UserCheck size={16} color="var(--accent-gold)" />
            {t('difficulty', 'Qiyinchilik')}
        </label>
        <div className="difficulty-wrapper">
            {[
                { id: 'Easy', label: 'Oson' },
                { id: 'Medium', label: 'O\'rtacha' },
                { id: 'Hard', label: 'Qiyin' }
            ].map((diff) => (
                <button 
                    key={diff.id} 
                    className={`diff-btn ${filters.difficulty === diff.id ? 'active' : ''}`}
                    onClick={() => onFilterChange({ difficulty: filters.difficulty === diff.id ? '' : diff.id })}
                >
                    {diff.label}
                </button>
            ))}
        </div>
      </div>

      <div className="filter-group">
        <label>
            <ShieldCheck size={16} color="var(--accent-gold)" />
            {t('amenities', 'Qulayliklar')}
        </label>
        <div className="amenities-grid">
            {[
                { id: 'WiFi', label: 'Wi-Fi', icon: <Wifi size={14} /> },
                { id: 'Parking', label: 'Turargoh', icon: <Car size={14} /> },
                { id: 'Food', label: 'Taomlar', icon: <Utensils size={14} /> },
                { id: 'Guide', label: 'Gid', icon: <Compass size={14} /> }
            ].map((item) => (
                <button 
                    key={item.id} 
                    className={`amenity-chip ${filters.amenities.includes(item.id) ? 'active' : ''}`}
                    onClick={() => handleAmenityToggle(item.id)}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
      </div>
    </aside>
  )
}

export default SidebarFilter
