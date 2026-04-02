import { isSupabaseConfigured, supabase, supabaseConfigError } from '../lib/supabase'
import { SURKHANDARYA_POSTS } from '../data/posts'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200'

const numberFormatter = new Intl.NumberFormat('en-US')
const REQUEST_TIMEOUT_MS = 8000

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

const attachSource = (item, source) => ({
  ...item,
  __source: source,
})

const buildMockPlaces = () =>
  SURKHANDARYA_POSTS.map((post) =>
    attachSource(
      {
        ...post,
        priceValue: Number(post.price.toString().replace(/[^0-9]/g, '')) || 0,
      },
      'mock'
    )
  )

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
    const client = requireSupabase()
    const { data, error } = await withTimeout(
      client
        .from('places')
        .select('*')
        .order('created_at', { ascending: false }),
      "Supabase'dan joylarni olish juda sekin ishladi."
    )

    if (error) throw error
    return (data || []).map((row) => attachSource(normalizePlace(row), 'supabase'))
  } catch (err) {
    console.warn('Supabase fetch xatosi, mock data ishlatilmoqda:', err)
    return buildMockPlaces()
  }
}

export const fetchPlaceById = async (id) => {
  try {
    const client = requireSupabase()
    const { data, error } = await withTimeout(
      client
        .from('places')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
      "Supabase'dan joy ma'lumotini olish juda sekin ishladi."
    )

    if (error) throw error
    if (data) return attachSource(normalizePlace(data), 'supabase')
  } catch (err) {
    console.warn('Supabase fetch xatosi, mock data ishlatilmoqda:', err)
  }

  const mockPlace = SURKHANDARYA_POSTS.find(p => p.id === id)
  if (mockPlace) {
    return attachSource(
      {
        ...mockPlace,
        priceValue: Number(mockPlace.price.toString().replace(/[^0-9]/g, '')) || 0,
      },
      'mock'
    )
  }
  return null
}

export const fetchPlaceAiText = async (placeId, locale = 'uz') => {
  if (!isSupabaseConfigured || !supabase) return null

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
  const client = requireSupabase()
  const preferredLocale = locale === 'uz' ? 'uz' : 'en'
  const fallbackLocales = preferredLocale === 'uz' ? ['uz', 'en'] : ['en', 'uz']

  const [{ data: places, error: placesError }, { data: aiTexts, error: aiTextsError }] = await Promise.all([
    client
      .from('places')
      .select('*')
      .order('created_at', { ascending: false }),
    client
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
  if (!isSupabaseConfigured || !supabase) return []

  const { data, error } = await supabase.rpc('get_comments_with_user_metadata', {
    p_place_id: placeId,
  })

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
}

export const addComment = async ({ placeId, userId, commentText, rating }) => {
  const client = requireSupabase()
  const { data, error } = await client
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
  if (!userId || !isSupabaseConfigured || !supabase) return false

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
  const client = requireSupabase()
  const { error } = await client.from('favorites').insert({
    place_id: placeId,
    user_id: userId,
  })

  if (error) throw error
}

export const removeFavorite = async ({ placeId, userId }) => {
  const client = requireSupabase()
  const { error } = await client
    .from('favorites')
    .delete()
    .eq('place_id', placeId)
    .eq('user_id', userId)

  if (error) throw error
}

export const getCurrentSession = async () => {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

const normalizeAuthUserProfile = (user) => {
  if (!user) return null

  return {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || '',
    full_name: user.user_metadata?.full_name || '',
    avatar_url: user.user_metadata?.avatar_url || '',
  }
}

const isNetworkFetchError = (error) =>
  error instanceof TypeError && error.message === 'Failed to fetch'

const isEmailNotConfirmedError = (error) =>
  typeof error?.message === 'string' && error.message.toLowerCase().includes('email not confirmed')

const createEmailNotConfirmedError = (email) => {
  const authError = new Error("Email tasdiqlanmagan. Pochtangizdagi havolani bosing yoki tasdiqlash xabarini qayta yuboring.")
  authError.code = 'email_not_confirmed'
  authError.email = email
  return authError
}

export const fetchProfileByUsername = async (username) => {
  const cleanedUsername = username?.trim()
  if (!cleanedUsername) return null

  const client = requireSupabase()
  const { data, error } = await client.rpc('find_user_by_username', {
    input_username: cleanedUsername,
  })

  if (error) throw error
  return data?.[0] || null
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

export const resendSignupConfirmation = async (email) => {
  const normalizedEmail = email?.trim()
  if (!normalizedEmail) {
    throw new Error('Tasdiqlash xabarini yuborish uchun email kerak.')
  }

  const client = requireSupabase()
  const { error } = await client.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: getEmailRedirectTo(),
    },
  })

  if (error) throw error
}

export const signInWithPassword = async ({ identifier, password }) => {
  let email = identifier.trim()

  if (!email.includes('@')) {
    let profile

    try {
      profile = await fetchProfileByUsername(email)
    } catch (error) {
      if (isNetworkFetchError(error)) {
        throw new Error("Username orqali kirish hozir ishlamayapti. Iltimos, email orqali kiring.")
      }

      throw error
    }

    if (!profile?.email) {
      throw new Error('Username topilmadi.')
    }
    email = profile.email
  }

  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (isEmailNotConfirmedError(error)) {
      throw createEmailNotConfirmedError(email)
    }

    throw error
  }

  return data
}

export const signOut = async () => {
  if (!isSupabaseConfigured || !supabase) return

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const fetchProfile = async (userId) => {
  if (!userId) return null
  if (!isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase.auth.getUser()

  if (error) throw error
  if (data.user?.id !== userId) return null

  return normalizeAuthUserProfile(data.user)
}

export const updateProfile = async (userId, updates) => {
  const client = requireSupabase()
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError) throw authError
  if (authData.user?.id !== userId) {
    throw new Error('Authenticated user required.')
  }

  const { data, error } = await client.auth.updateUser({
    data: {
      ...authData.user.user_metadata,
      username: updates.username ?? '',
      full_name: updates.full_name ?? '',
      avatar_url: updates.avatar_url ?? '',
    },
  })

  if (error) throw error
  return normalizeAuthUserProfile(data.user)
}

export const fetchUserTickets = async (userId) => {
  if (!userId || !isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const fetchUserTicketById = async ({ ticketId, userId }) => {
  if (!ticketId || !userId || !isSupabaseConfigured || !supabase) return null

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const createTicketInDB = async (ticketData) => {
  const client = requireSupabase()
  
  // Real ticket ID generation: AF-XXXXXX
  const realTicketId = `AF-${Math.floor(Math.random() * 900000 + 100000)}`
  
  const payload = {
    ...ticketData,
    ticket_id: realTicketId,
    status: ticketData.status || 'checking'
  }
  
  const { data, error } = await client
    .from('tickets')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return data
}
