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
import Hero from '../components/Hero'

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

  return (
    <div className="home-page">
      <Hero />
      {/* Rest of the content */}
      <div className="container mx-auto px-4 py-8">
        {/* Existing content */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <SidebarFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions}
              defaultFilters={defaultFilters}
            />
          </div>
          <div className="lg:w-3/4">
            <FlightSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              userLoc={userLoc}
            />
            {loading ? (
              <Loading />
            ) : error ? (
              <div className="text-center text-red-500 mt-8">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                {filteredPosts.map((place) => (
                  <PostCard key={place.id} item={place} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage