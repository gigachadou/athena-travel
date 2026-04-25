import { isSupabaseConfigured, supabase, supabaseConfigError } from '../lib/supabase'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200'
const numberFormatter = new Intl.NumberFormat('en-US')
const REQUEST_TIMEOUT_MS = 30000
const FALLBACK_PLACES = [
  {
    id: 'mock_1',
    title: 'Registon maydoni',
    location: 'Samarqand',
    description: "Samarqandning eng mashhur tarixiy majmuasi.",
    image_url: FALLBACK_IMAGE,
    price: 100000,
    price_per_person: 100000,
    type: 'landmark',
    region: 'Samarqand',
    amenities: ['Guide', 'Photo spots'],
    best_season: 'Bahor',
    difficulty: 'Oson',
    duration: '2-3 soat',
    lat: 39.6542,
    lon: 66.9754,
    average_rating: 4.8,
    rating_count: 320,
  },
  {
    id: 'mock_2',
    title: 'Ichan Qalʼa',
    location: 'Xiva',
    description: "UNESCO ro'yxatidagi ochiq osmon ostidagi tarixiy shahar.",
    image_url: FALLBACK_IMAGE,
    price: 120000,
    price_per_person: 120000,
    type: 'landmark',
    region: 'Xorazm',
    amenities: ['Museum', 'Guide'],
    best_season: 'Kuz',
    difficulty: 'Oson',
    duration: '3-4 soat',
    lat: 41.3789,
    lon: 60.3582,
    average_rating: 4.9,
    rating_count: 280,
  },
  {
    id: 'mock_3',
    title: 'Osh Markazi (Besh Qozon)',
    location: 'Toshkent',
    description: "Milliy taomlar bilan mashhur restoran.",
    image_url: FALLBACK_IMAGE,
    price: 80000,
    price_per_person: 80000,
    type: 'restaurant',
    region: 'Toshkent',
    amenities: ['Parking', 'Family friendly'],
    best_season: 'Yil davomida',
    difficulty: 'Oson',
    duration: '1-2 soat',
    lat: 41.3486,
    lon: 69.2866,
    average_rating: 4.7,
    rating_count: 410,
  },
]
let hasLoggedFetchPlacesError = false

// --- YORDAMCHI FUNKSIYALAR ---
const getEmailRedirectTo = () => {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/login`
}

const requireSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(supabaseConfigError)
  }
  return supabase
}

const withRetry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()
      return result
    } catch (error) {
      lastError = error
      
      // Check if error is retryable (network errors, timeouts)
      const isRetryable = 
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Network') ||
        error?.message?.includes('CORS') ||
        error?.message?.includes('ERR_') ||
        error?.code === 'NETWORK_ERROR' ||
        error?.code === 'FETCH_ERROR'
      
      if (!isRetryable || attempt === maxAttempts) {
        throw error
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

const withTimeout = async (promise, message = "Supabase so'rovi juda sekin ishladi.") => {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

const attachSource = (item, source) => ({ ...item, __source: source })

export const formatPrice = (value) => {
  const amount = Number(value ?? 0)
  return `${numberFormatter.format(amount)} UZS`
}

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
  amenities: row.amenities || [],
  bestSeason: row.best_season || '',
  difficulty: row.difficulty || '',
  duration: row.duration || '',
  lat: row.lat,
  lon: row.lon,
  rating: Number(row.average_rating ?? 0),
  ratingCount: Number(row.rating_count ?? 0),
})

export const fetchPlacesForAI = async (locale = 'uz') => {
  const client = requireSupabase()
  const preferredLocale = locale === 'uz' ? 'uz' : 'en'
  const fallbackLocales = preferredLocale === 'uz' ? ['uz', 'en'] : ['en', 'uz']

  const [{ data: places, error: placesError }, { data: aiTexts, error: aiTextsError }] = await Promise.all([
    withRetry(() => 
      withTimeout(
        client.from('places').select('id,title,location,description,image_url,price,price_per_person,type,region,amenities,best_season,difficulty,duration,lat,lon,average_rating,rating_count').order('created_at', { ascending: false })
      )
    ),
    withRetry(() =>
      withTimeout(
        client.from('place_ai_texts').select('place_id,locale,summary,must_visit_label,location_info_title,historical_info_title,pricing_note,review_title,review_subtitle,comment_placeholder_auth,comment_placeholder_guest,login_to_comment_label,rating_selected_message,extra').in('locale', fallbackLocales)
      )
    ),
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

// ─── PLACES (JOYLAR) ───
export const fetchPlaces = async () => {
  try {
    // Network status tekshirish
    if (!navigator.onLine) {
      return FALLBACK_PLACES.map((row) => attachSource(normalizePlace(row), 'mock'))
    }

    const client = requireSupabase()
    
    const { data, error } = await withRetry(
      () => withTimeout(
        client.from('places').select('id,title,location,description,image_url,price,price_per_person,type,region,amenities,best_season,difficulty,duration,lat,lon,average_rating,rating_count').order('created_at', { ascending: false })
      )
    )
    
    if (error) throw error
    console.log('✅ Places yuklandi:', data?.length || 0)
    return (data || []).map((row) => attachSource(normalizePlace(row), 'supabase'))
  } catch (err) {
    if (!hasLoggedFetchPlacesError) {
      const message = err?.message || "Unknown fetchPlaces error"
      const code = err?.code ? ` (code: ${err.code})` : ''
      console.error(`fetchPlaces error: ${message}${code}`)
      if (err && typeof err === 'object') {
        console.debug('fetchPlaces raw error:', err)
      }
      hasLoggedFetchPlacesError = true
    }
    return FALLBACK_PLACES.map((row) => attachSource(normalizePlace(row), 'mock'))
  }
}

export const fetchPlaceById = async (id) => {
  try {
    const client = requireSupabase()
    const { data, error } = await withRetry(
      () => withTimeout(
        client.from('places').select('id,title,location,description,image_url,price,price_per_person,type,region,amenities,best_season,difficulty,duration,lat,lon,average_rating,rating_count').eq('id', id).maybeSingle()
      )
    )
    if (error) throw error
    if (data) return attachSource(normalizePlace(data), 'supabase')
    return null
  } catch (err) {
    console.error('fetchPlaceById error:', err)
    return null
  }
}

export const fetchPlaceAiText = async (placeId, locale = 'uz') => {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const preferredLocale = locale === 'uz' ? 'uz' : 'en'
    const fallbackLocales = preferredLocale === 'uz' ? ['uz', 'en'] : ['en', 'uz']
    const { data, error } = await withTimeout(
      supabase.from('place_ai_texts').select('*').eq('place_id', placeId).in('locale', fallbackLocales)
    )
    if (error) throw error
    if (!data?.length) return null
    const exactMatch = data.find((item) => item.locale === preferredLocale)
    return normalizePlaceAiText(exactMatch || data[0])
  } catch (err) {
    console.error('fetchPlaceAiText error:', err)
    return null
  }
}

export const fetchCommentsByPlaceId = async (placeId) => {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    // Requires a database RPC or complex join. Using RPC as per existing pattern.
    const { data, error } = await withTimeout(
      supabase.rpc('get_comments_with_user_metadata', { p_place_id: placeId })
    )
    if (error) throw error
    return (data || []).map((comment) => ({
      id: comment.id,
      user: comment.full_name || 'Foydalanuvchi',
      avatar: comment.avatar_url || null,
      text: comment.comment_text || '',
      rating: Number(comment.rating ?? 0),
      date: comment.created_at,
      userId: comment.user_id,
    }))
  } catch (err) {
    console.error('fetchCommentsByPlaceId error:', err)
    return []
  }
}

export const addComment = async ({ placeId, userId, commentText, rating }) => {
  const client = requireSupabase()
  const { data, error } = await client.from('comments').insert({
    place_id: placeId,
    user_id: userId,
    comment_text: commentText,
    rating,
  }).select('id').single()
  if (error) throw error
  return data
}

export const deleteComment = async (commentId) => {
  const client = requireSupabase()
  const { error } = await client.from('comments').delete().eq('id', commentId)
  if (error) throw error
}

// ─── FAVORITES (SEVIMLILAR) ───
export const fetchIsFavorite = async ({ placeId, userId }) => {
  if (!userId || !isSupabaseConfigured || !supabase) return false
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) return false
    return Boolean(data)
  } catch {
    return false
  }
}

export const addFavorite = async ({ placeId, userId }) => {
  const client = requireSupabase()
  const { error } = await client.from('favorites').insert({ place_id: placeId, user_id: userId })
  if (error) throw error
}

export const removeFavorite = async ({ placeId, userId }) => {
  const client = requireSupabase()
  const { error } = await client.from('favorites').delete().eq('place_id', placeId).eq('user_id', userId)
  if (error) throw error
}

export const fetchUserFavorites = async (userId) => {
  if (!userId || !isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('favorites')
        .select('*, places(*)')
        .eq('user_id', userId)
    )

    if (error) throw error
    if (!data) return []

    return data
      .filter(item => item.places)
      .map(item => normalizePlace(Array.isArray(item.places) ? item.places[0] : item.places))
  } catch (err) {
    console.error('fetchUserFavorites error:', err)
    return []
  }
}

// ─── AUTH & PROFILE (PROFIL) ───
export const getCurrentSession = async () => {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export const fetchProfileFromDB = async (userId) => {
  if (!userId || !isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    if (error.code !== 'PGRST116') { // Ignore 'JSON object requested, but no rows returned'
      console.warn('DB Profile fetch note:', error.message || error);
    }
    return null
  }
  return data
}

export const fetchProfile = async (userId) => {
  if (!userId || !isSupabaseConfigured || !supabase) return null
  try {
    const client = requireSupabase()
    const dbProfile = await withRetry(() => fetchProfileFromDB(userId))
    const { data: { user }, error: authError } = await withRetry(() => client.auth.getUser())

    if (authError || !user) return dbProfile

    return {
      id: user.id,
      email: user.email || '',
      username: dbProfile?.username || user.user_metadata?.username || '',
      full_name: dbProfile?.full_name || user.user_metadata?.full_name || '',
      avatar_url: dbProfile?.avatar_url || user.user_metadata?.avatar_url || '',
    }
  } catch (err) {
    console.error('fetchProfile error:', err)
    return null
  }
}

export const updateProfile = async (userId, updates) => {
  const client = requireSupabase()

  const { data: authData, error: authError } = await client.auth.updateUser({
    data: {
      username: updates.username,
      full_name: updates.full_name,
      avatar_url: updates.avatar_url,
    },
  })
  if (authError) throw authError

  const { error: profileError } = await client.from('profiles').upsert({
    id: userId,
    username: updates.username ?? '',
    full_name: updates.full_name ?? '',
    avatar_url: updates.avatar_url ?? '',
    updated_at: new Date().toISOString(),
  })

  if (profileError) throw profileError

  return {
    id: authData.user.id,
    email: authData.user.email || '',
    ...updates
  }
}

export const signUpWithPassword = async ({ email, password, username, fullName }) => {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
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
  const client = requireSupabase()
  let email = identifier

  if (!identifier.includes('@')) {
    const { data: profile, error } = await client
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .maybeSingle()

    if (error || !profile?.email) {
      throw new Error("Username topilmadi.")
    }
    email = profile.email
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const resendSignupConfirmation = async (email) => {
  const client = requireSupabase()
  const { error } = await client.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: getEmailRedirectTo() },
  })
  if (error) throw error
}

export const verifyOTP = async ({ email, token, type }) => {
  const client = requireSupabase()
  const { data, error } = await client.auth.verifyOtp({
    email,
    token,
    type: type || 'signup',
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

// ─── TRANSIT (TRANSPORT) ───
export const fetchTransitSchedules = async () => {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase.from('transit_schedules').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ─── TICKETS (CHIPTALAR) ───
export const fetchUserTickets = async (userId) => {
  if (!userId || !isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase.from('tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const fetchUserTicketById = async ({ ticketId, userId }) => {
  if (!ticketId || !userId || !isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase.from('tickets').select('*').eq('id', ticketId).eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export const createTicketInDB = async (ticketData) => {
  const client = requireSupabase()
  const { data, error } = await client.from('tickets').insert([{ ...ticketData, status: 'checking' }]).select().single()
  if (error) throw error
  return data
}

// --- SERVICES (GID & TRANSPORT) ---
export const fetchTourGuides = async () => {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('tour_guides')
        .select('id,name,phone,languages,region,description,hourly_rate,rating,available,photo_url,created_at')
        .eq('available', true)
        .order('rating', { ascending: false })
    )
    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name || 'Gid',
      phone: row.phone || '',
      languages: row.languages || [],
      region: row.region || '',
      description: row.description || '',
      hourlyRate: Number(row.hourly_rate ?? 0),
      rating: Number(row.rating ?? 0),
      photoUrl: row.photo_url || null,
      createdAt: row.created_at,
    }))
  } catch (err) {
    console.error('fetchTourGuides error:', err)
    return []
  }
}

export const fetchTransportProviders = async () => {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('transport_providers')
        .select('id,driver_name,phone,vehicle_make,vehicle_model,license_plate,capacity,service_area,fare_per_km,description,available,photo_url,created_at')
        .eq('available', true)
        .order('created_at', { ascending: false })
    )
    if (error) throw error

    return (data || []).map((row) => ({
      id: row.id,
      driverName: row.driver_name || 'Haydovchi',
      phone: row.phone || '',
      vehicleMake: row.vehicle_make || '',
      vehicleModel: row.vehicle_model || '',
      licensePlate: row.license_plate || '',
      capacity: Number(row.capacity ?? 4),
      serviceArea: row.service_area || '',
      farePerKm: Number(row.fare_per_km ?? 0),
      description: row.description || '',
      photoUrl: row.photo_url || null,
      createdAt: row.created_at,
    }))
  } catch (err) {
    console.error('fetchTransportProviders error:', err)
    return []
  }
}
