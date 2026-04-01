import { Filter, Star, MapPin, Trash2, Mountain, Landmark, Hotel, Utensils, Coins, Sun, Snowflake, Leaf, Thermometer, Wifi, Car, Compass, UserCheck, ShieldCheck, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './SidebarFilter.css'

const ICON_MAP = {
  mountain: Mountain,
  landmark: Landmark,
  hotel: Hotel,
  utensils: Utensils,
  sun: Sun,
  snowflake: Snowflake,
  leaf: Leaf,
  thermometer: Thermometer,
  wifi: Wifi,
  car: Car,
  compass: Compass,
  filter: Filter,
}

const SidebarFilter = ({ filters, onFilterChange, options, defaultFilters }) => {
  const { t } = useTranslation()

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
    onFilterChange(defaultFilters)
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
                {options.regions.map((region) => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
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
            max={Math.max(options.maxPrice, 0)}
            step={Math.max(Math.ceil(options.maxPrice / 20 / 1000) * 1000, 1000)}
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
            {options.categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Filter
                return (
                <label key={cat.value} className="checkbox-item-premium">
                    <input 
                        type="checkbox" 
                        checked={filters.categories.includes(cat.value)}
                        onChange={() => handleCategoryToggle(cat.value)}
                    />
                    <div className={`check-card glass ${filters.categories.includes(cat.value) ? 'active' : ''}`}>
                        <Icon size={16} />
                        <span className="label-text">{cat.label}</span>
                    </div>
                </label>
            )})}
        </div>
      </div>
      
      <div className="filter-group">
        <label>
            <Compass size={16} color="var(--accent-gold)" />
            {t('best_season', 'Eng yaxshi fasl')}
        </label>
        <div className="season-options">
            {options.seasons.map((season) => {
                const Icon = ICON_MAP[season.icon] || Compass
                return (
                <button 
                    key={season.value} 
                    className={`season-btn ${filters.bestSeason === season.value ? 'active' : ''}`}
                    onClick={() => onFilterChange({ bestSeason: filters.bestSeason === season.value ? '' : season.value })}
                >
                    <Icon size={16} />
                    <span>{season.label}</span>
                </button>
            )})}
        </div>
      </div>

      <div className="filter-group">
        <label>
            <UserCheck size={16} color="var(--accent-gold)" />
            {t('difficulty', 'Qiyinchilik')}
        </label>
        <div className="difficulty-wrapper">
            {options.difficulties.map((diff) => (
                <button 
                    key={diff.value} 
                    className={`diff-btn ${filters.difficulty === diff.value ? 'active' : ''}`}
                    onClick={() => onFilterChange({ difficulty: filters.difficulty === diff.value ? '' : diff.value })}
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
            {options.amenities.map((item) => {
                const iconKey = item.value.toLowerCase().includes('wifi')
                  ? 'wifi'
                  : item.value.toLowerCase().includes('parking')
                    ? 'car'
                    : item.value.toLowerCase().includes('food') || item.value.toLowerCase().includes('breakfast') || item.value.toLowerCase().includes('fish')
                      ? 'utensils'
                      : 'compass'
                const Icon = ICON_MAP[iconKey] || Compass
                return (
                <button 
                    key={item.value} 
                    className={`amenity-chip ${filters.amenities.includes(item.value) ? 'active' : ''}`}
                    onClick={() => handleAmenityToggle(item.value)}
                >
                    <Icon size={14} />
                    <span>{item.label}</span>
                </button>
            )})}
        </div>
      </div>
    </aside>
  )
}

export default SidebarFilter
