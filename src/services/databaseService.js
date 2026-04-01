import { supabase } from '../lib/supabase'
import { SURKHANDARYA_POSTS } from '../data/posts'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200'

const numberFormatter = new Intl.NumberFormat('en-US')

export const formatPrice = (value) => {
  const amount = Number(value ?? 0)
  return `${numberFormatter.format(amount)} UZS`
}

export const normalizePlace = (row) => ({
  id: row.id,
  title: row.title,
  location: row.location || 'Nomaʼlum joy',
  description: row.description || '',
  image: row.image_url || FALLBACK_IMAGE,
  price: formatPrice(row.price),
  priceValue: Number(row.price ?? 0),
  pricePerPerson: formatPrice(row.price_per_person),
  type: row.type,
  region: row.region || '',
  airportDist: row.airport_dist || 'N/A',
  metroDist: row.metro_dist || 'N/A',
  busDist: row.bus_dist || 'N/A',
  amenities: row.amenities || [],
  bestSeason: row.best_season || '',
  difficulty: row.difficulty || '',
  duration: row.duration || '',
  lat: row.lat,
  lon: row.lon,
  rating: Number(row.average_rating ?? 0),
  ratingCount: Number(row.rating_count ?? 0),
})

export const normalizePlaceAiText = (row) => {
  if (!row) return null

  return {
    locale: row.locale || 'uz',
    summary: row.summary || '',
    mustVisitLabel: row.must_visit_label || '',
    locationInfoTitle: row.location_info_title || '',
    historicalInfoTitle: row.historical_info_title || '',
    pricingNote: row.pricing_note || '',
    reviewTitle: row.review_title || '',
    reviewSubtitle: row.review_subtitle || '',
    commentPlaceholderAuth: row.comment_placeholder_auth || '',
    commentPlaceholderGuest: row.comment_placeholder_guest || '',
    loginToCommentLabel: row.login_to_comment_label || '',
    ratingSelectedMessage: row.rating_selected_message || '',
    extra: row.extra || {},
  }
}

export const fetchPlaces = async () => {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(normalizePlace)
  } catch (err) {
    console.warn("Supabase fetch xatosi, mock data ishlatilmoqda:", err.message)
    return SURKHANDARYA_POSTS.map(post => ({
      ...post,
      priceValue: Number(post.price.toString().replace(/[^0-9]/g, '')) || 0
    }))
  }
}

export const fetchPlaceById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (data) return normalizePlace(data)
  } catch (err) {
    console.warn("Supabase fetch xatosi, mock data ishlatilmoqda:", err.message)
  }

  const mockPlace = SURKHANDARYA_POSTS.find(p => p.id === id)
  if (mockPlace) {
    return {
      ...mockPlace,
      priceValue: Number(mockPlace.price.toString().replace(/[^0-9]/g, '')) || 0
    }
  }
  return null
}

export const fetchPlaceAiText = async (placeId, locale = 'uz') => {
  const preferredLocale = locale === 'uz' ? 'uz' : 'en'
  const fallbackLocales = preferredLocale === 'uz' ? ['uz', 'en'] : ['en', 'uz']

  const { data, error } = await supabase
    .from('place_ai_texts')
    .select('*')
    .eq('place_id', placeId)
    .in('locale', fallbackLocales)

  if (error) throw error
  if (!data?.length) return null

  const exactMatch = data.find((item) => item.locale === preferredLocale)
  return normalizePlaceAiText(exactMatch || data[0])
}

export const fetchPlacesForAI = async (locale = 'uz') => {
  const preferredLocale = locale === 'uz' ? 'uz' : 'en'
  const fallbackLocales = preferredLocale === 'uz' ? ['uz', 'en'] : ['en', 'uz']

  const [{ data: places, error: placesError }, { data: aiTexts, error: aiTextsError }] = await Promise.all([
    supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('place_ai_texts')
      .select('*')
      .in('locale', fallbackLocales),
  ])

  if (placesError) throw placesError
  if (aiTextsError) throw aiTextsError

  const aiTextsByPlaceId = new Map()

  for (const row of aiTexts || []) {
    const existing = aiTextsByPlaceId.get(row.place_id)
    if (!existing || row.locale === preferredLocale) {
      aiTextsByPlaceId.set(row.place_id, row)
    }
  }

  return (places || []).map((placeRow) => {
    const place = normalizePlace(placeRow)
    const aiText = normalizePlaceAiText(aiTextsByPlaceId.get(place.id))

    return {
      ...place,
      aiText,
      aiSummary: aiText?.summary || place.description || '',
    }
  })
}

export const fetchCommentsByPlaceId = async (placeId) => {
  const { data, error } = await supabase
    .from('comments')
    .select('id, comment_text, rating, created_at, user_id, profiles(full_name, avatar_url)')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((comment) => ({
    id: comment.id,
    user: comment.profiles?.full_name || 'Foydalanuvchi',
    avatar: comment.profiles?.avatar_url || null,
    text: comment.comment_text || '',
    rating: Number(comment.rating ?? 0),
    date: comment.created_at,
    userId: comment.user_id,
  }))
}

export const addComment = async ({ placeId, userId, commentText, rating }) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      place_id: placeId,
      user_id: userId,
      comment_text: commentText,
      rating,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export const fetchIsFavorite = async ({ placeId, userId }) => {
  if (!userId) return false

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('place_id', placeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export const addFavorite = async ({ placeId, userId }) => {
  const { error } = await supabase.from('favorites').insert({
    place_id: placeId,
    user_id: userId,
  })

  if (error) throw error
}

export const removeFavorite = async ({ placeId, userId }) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('place_id', placeId)
    .eq('user_id', userId)

  if (error) throw error
}

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export const ensureProfile = async ({ userId, username, fullName, email, avatarUrl }) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        username: username || null,
        full_name: fullName || null,
        email: email || null,
        avatar_url: avatarUrl || null,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const fetchProfileByUsername = async (username) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle()

  if (error) throw error
  return data
}

export const signUpWithPassword = async ({ email, password, username, fullName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
      },
    },
  })

  if (error) throw error
  return data
}

export const signInWithPassword = async ({ identifier, password }) => {
  let email = identifier.trim()

  if (!email.includes('@')) {
    const profile = await fetchProfileByUsername(email)
    if (!profile?.email) {
      throw new Error('Username topilmadi.')
    }
    email = profile.email
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const fetchProfile = async (userId) => {
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        ...updates,
      },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export const fetchUserTickets = async (userId) => {
  if (!userId) return []
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createTicketInDB = async (ticketData) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticketData])
    .select()
    .single()

  if (error) throw error
  return data
}
