const CATEGORY_META = {
  nature: { label: 'Tabiat', icon: 'mountain' },
  historical: { label: 'Tarixiy', icon: 'landmark' },
  hotels: { label: 'Mehmonxonalar', icon: 'hotel' },
  restaurants: { label: 'Restoranlar', icon: 'utensils' },
}

const REGION_LABELS = {
  termez: 'Termiz',
  boysun: 'Boysun',
  sariosiyo: 'Sariosiyo',
  sherobod: 'Sherobod',
  uzun: 'Uzun',
  denov: 'Denov',
  angor: 'Angor',
  jarqorgon: "Jarqo'rg'on",
}

const SEASON_META = {
  Spring: { label: 'Bahor', icon: 'leaf' },
  Summer: { label: 'Yoz', icon: 'sun' },
  Autumn: { label: 'Kuz', icon: 'thermometer' },
  Winter: { label: 'Qish', icon: 'snowflake' },
  'All Season': { label: 'Barcha fasl', icon: 'compass' },
}

const DIFFICULTY_LABELS = {
  Easy: 'Oson',
  Medium: "O'rtacha",
  Hard: 'Qiyin',
}

const PREFERRED_CATEGORY_ORDER = ['nature', 'historical', 'hotels', 'restaurants']
const PREFERRED_REGION_ORDER = ['termez', 'boysun', 'sariosiyo', 'sherobod', 'uzun', 'denov', 'angor', 'jarqorgon']
const PREFERRED_SEASON_ORDER = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Season']
const PREFERRED_DIFFICULTY_ORDER = ['Easy', 'Medium', 'Hard']

const toTitleCase = (value = '') =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const buildSortedOptions = (values, preferredOrder, mapper) => {
  const uniqueValues = [...new Set(values.filter(Boolean))]
  return uniqueValues
    .sort((left, right) => {
      const leftIndex = preferredOrder.indexOf(left)
      const rightIndex = preferredOrder.indexOf(right)

      if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex
      if (leftIndex !== -1) return -1
      if (rightIndex !== -1) return 1
      return left.localeCompare(right)
    })
    .map(mapper)
}

export const getMaxPrice = (places = []) =>
  Math.max(...places.map((place) => Number(place.priceValue ?? 0)), 0)

export const createDefaultFilters = (maxPrice = 0) => ({
  region: '',
  priceRange: maxPrice,
  rating: 0,
  categories: [],
  bestSeason: '',
  difficulty: '',
  amenities: [],
})

export const hasActiveFilters = (filters, defaultFilters) =>
  Object.entries(filters).some(([key, value]) => {
    const defaultValue = defaultFilters[key]
    if (Array.isArray(value)) return value.length > 0
    return value !== defaultValue
  })

export const deriveFilterOptions = (places = []) => {
  const maxPrice = getMaxPrice(places)

  return {
    maxPrice,
    regions: buildSortedOptions(
      places.map((place) => place.region),
      PREFERRED_REGION_ORDER,
      (value) => ({ value, label: REGION_LABELS[value] || toTitleCase(value) })
    ),
    categories: buildSortedOptions(
      places.map((place) => place.type),
      PREFERRED_CATEGORY_ORDER,
      (value) => ({
        value,
        label: CATEGORY_META[value]?.label || toTitleCase(value),
        icon: CATEGORY_META[value]?.icon || 'filter',
      })
    ),
    seasons: buildSortedOptions(
      places.map((place) => place.bestSeason),
      PREFERRED_SEASON_ORDER,
      (value) => ({
        value,
        label: SEASON_META[value]?.label || toTitleCase(value),
        icon: SEASON_META[value]?.icon || 'compass',
      })
    ),
    difficulties: buildSortedOptions(
      places.map((place) => place.difficulty),
      PREFERRED_DIFFICULTY_ORDER,
      (value) => ({ value, label: DIFFICULTY_LABELS[value] || toTitleCase(value) })
    ),
    amenities: buildSortedOptions(
      places.flatMap((place) => place.amenities || []),
      [],
      (value) => ({ value, label: value })
    ),
  }
}

export const filterPlaces = (places, searchTerm, filters) =>
  places.filter((place) => {
    const term = searchTerm.trim().toLowerCase()
    const normalizedAmenities = (place.amenities || []).map((amenity) => amenity.toLowerCase())
    const normalizedSeason = (place.bestSeason || '').toLowerCase()
    const matchesSearch =
      !term ||
      place.title.toLowerCase().includes(term) ||
      place.location.toLowerCase().includes(term) ||
      place.description.toLowerCase().includes(term) ||
      place.region.toLowerCase().includes(term)

    const matchesRegion = !filters.region || place.region === filters.region
    const matchesPrice = Number(place.priceValue ?? 0) <= Number(filters.priceRange ?? 0)
    const matchesRating = Number(place.rating ?? 0) >= Number(filters.rating ?? 0)
    const matchesCategory =
      filters.categories.length === 0 || filters.categories.includes(place.type)
    const matchesSeason =
      !filters.bestSeason ||
      normalizedSeason === filters.bestSeason.toLowerCase() ||
      normalizedSeason === 'all season'
    const matchesDifficulty =
      !filters.difficulty || place.difficulty === filters.difficulty
    const matchesAmenities =
      filters.amenities.length === 0 ||
      filters.amenities.every((amenity) => normalizedAmenities.includes(amenity.toLowerCase()))

    return (
      matchesSearch &&
      matchesRegion &&
      matchesPrice &&
      matchesRating &&
      matchesCategory &&
      matchesSeason &&
      matchesDifficulty &&
      matchesAmenities
    )
  })
