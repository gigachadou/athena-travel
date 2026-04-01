const CATEGORY_MAP = {
  Mountains: 'nature',
  Historical: 'historical',
  Hotels: 'hotels',
  Restaurants: 'restaurants',
}

export const filterPlaces = (places, searchTerm, filters) =>
  places.filter((place) => {
    const term = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !term ||
      place.title.toLowerCase().includes(term) ||
      place.location.toLowerCase().includes(term)

    const matchesRegion = !filters.region || place.region === filters.region
    const matchesPrice = Number(place.priceValue ?? 0) <= filters.priceRange
    const matchesRating = Number(place.rating ?? 0) >= filters.rating
    const mappedCategories = filters.categories.map((category) => CATEGORY_MAP[category] || category)
    const matchesCategory =
      filters.categories.length === 0 || mappedCategories.includes(place.type)
    const matchesSeason =
      !filters.bestSeason ||
      place.bestSeason === filters.bestSeason ||
      place.bestSeason === 'All'
    const matchesDifficulty =
      !filters.difficulty || place.difficulty === filters.difficulty
    const matchesAmenities =
      filters.amenities.length === 0 ||
      filters.amenities.every((amenity) => place.amenities?.includes(amenity))

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
