import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import { Pool } from 'pg'
import { SURKHANDARYA_POSTS } from '../src/data/posts.js'

const PORT = Number(process.env.PORT || 4242)

const required = (key) => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env: ${key}`)
  return value
}

const getClientOrigin = (req) => {
  return process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173'
}

const getBearerToken = (req) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) return null
  return token
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const normalizePhoneDigits = (value) => String(value || '').replace(/[^\d+]/g, '')

const isValidPhone = (value) => {
  const normalized = normalizePhoneDigits(value)
  const digits = normalized.replace(/[^\d]/g, '')
  if (digits.length < 9) return false
  if (normalized.startsWith('+') && digits.length < 10) return false
  return true
}

const parseGuests = (value) => {
  const n = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(n) ? n : null
}

const TICKET_TYPES = new Map([
  ['STANDARD', { label: 'Standart', multiplier: 1 }],
  ['PREMIUM', { label: 'Premium', multiplier: 1.25 }],
  ['VIP', { label: 'VIP', multiplier: 1.6 }],
])

const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || 'uzs').toLowerCase()
const PAYMENT_DECIMALS = Number.parseInt(process.env.PAYMENT_DECIMALS || '0', 10)

const stripe = new Stripe(required('STRIPE_SECRET_KEY'))

const getDatabaseConnectionString = () => {
  return (
    process.env.VITE_RAILWAY_URL ||
    process.env.RAILWAY_URL ||
    process.env.RAILWAY_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  )
}

const dbConnectionString = getDatabaseConnectionString()
if (!dbConnectionString) {
  console.error('Missing database connection string. Set VITE_RAILWAY_URL / RAILWAY_URL / RAILWAY_DATABASE_URL / DATABASE_URL / POSTGRES_URL')
}

const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: { rejectUnauthorized: false },
})

const queryDb = async (text, params = []) => {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res.rows
  } finally {
    client.release()
  }
}

const getAuthedUser = async (req) => {
  const token = getBearerToken(req)
  if (!token) return { user: null, token: null }

  // token is interpreted as user ID for simplicity
  const users = await queryDb('select id, email, username, full_name from users where id = $1', [token])
  return { user: users?.[0] || null, token }
}

const fetchPlacePricing = async (placeId) => {
  const rows = await queryDb('select id, title, location, price, price_per_person from places where id = $1', [placeId])
  const data = rows?.[0]
  if (!data) return null

  const pricePerPerson = Number(data.price_per_person ?? 0)
  const price = Number(data.price ?? 0)
  const basePerPerson = pricePerPerson > 0 ? pricePerPerson : price > 0 ? price : 0

  return {
    id: data.id,
    title: data.title,
    location: data.location || '',
    basePerPerson,
  }
}

const fetchPlaceById = async (placeId) => {
  const rows = await queryDb('select * from places where id = $1', [placeId])
  return rows?.[0] || null
}

const fetchAllPlaces = async () => {
  return await queryDb('select * from places order by created_at desc')
}

const fetchAiText = async (placeId, locale = 'uz') => {
  const rows = await queryDb('select * from place_ai_texts where place_id = $1 and locale = $2 limit 1', [placeId, locale])
  if (rows && rows.length) return rows[0]
  const fallback = await queryDb('select * from place_ai_texts where place_id = $1 order by locale limit 1', [placeId])
  return fallback?.[0] || null
}

const fetchComments = async (placeId) => {
  return await queryDb(
    `select c.*, u.username, u.full_name, u.email from comments c left join users u on u.id = c.user_id where c.place_id = $1 order by c.created_at desc`,
    [placeId]
  )
}

const createComment = async ({ placeId, userId, commentText, rating }) => {
  const rows = await queryDb(
    `insert into comments (place_id, user_id, comment_text, rating) values ($1, $2, $3, $4) returning *`,
    [placeId, userId, commentText, rating]
  )
  return rows?.[0] || null
}

const getFavorite = async ({ placeId, userId }) => {
  const rows = await queryDb('select * from favorites where place_id = $1 and user_id = $2 limit 1', [placeId, userId])
  return rows?.[0] || null
}

const addFavoriteDb = async ({ placeId, userId }) => {
  const rows = await queryDb('insert into favorites (place_id, user_id) values ($1, $2) on conflict (user_id, place_id) do nothing returning *', [placeId, userId])
  return rows?.[0] || null
}

const removeFavoriteDb = async ({ placeId, userId }) => {
  await queryDb('delete from favorites where place_id = $1 and user_id = $2', [placeId, userId])
  return true
}

const fetchUserTicketsDb = async (userId) => {
  return await queryDb('select * from tickets where user_id = $1 order by created_at desc', [userId])
}

const fetchUserTicketByIdDb = async (ticketId, userId) => {
  const rows = await queryDb('select * from tickets where id = $1 and user_id = $2 limit 1', [ticketId, userId])
  return rows?.[0] || null
}

const createTicketDb = async (ticketData) => {
  const keys = Object.keys(ticketData)
  const values = Object.values(ticketData)
  const columns = keys.map((k) => k).join(', ')
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

  const rows = await queryDb(`insert into tickets (${columns}) values (${placeholders}) returning *`, values)
  return rows?.[0] || null
}

const checkUserCredentials = async (email, password) => {
  const rows = await queryDb('select id, email, username, full_name from users where email = $1 and password = $2', [email, password])
  return rows?.[0] || null
}

const createUser = async ({ email, password, username, full_name }) => {
  const rows = await queryDb('insert into users (email, password, username, full_name) values ($1, $2, $3, $4) returning *', [email, password, username, full_name])
  return rows?.[0] || null
}

const getUserByUsername = async (username) => {
  const rows = await queryDb('select id, email, username, full_name from users where username = $1 limit 1', [username])
  return rows?.[0] || null
}

const getUserById = async (id) => {
  const rows = await queryDb('select id, email, username, full_name from users where id = $1 limit 1', [id])
  return rows?.[0] || null
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, full_name } = req.body || {}
  if (!email || !password || !username) return res.status(400).json({ error: 'email, password, username are required' })

  try {
    const existing = await queryDb('select id from users where email = $1 or username = $2', [email, username])
    if (existing?.length) return res.status(409).json({ error: 'User already exists' })

    const user = await createUser({ email, password, username, full_name })
    return res.json({ user })
  } catch (error) {
    console.error('register error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  try {
    const user = await checkUserCredentials(email, password)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    // Simple token for demo use user ID in bearer header
    return res.json({ user, token: user.id })
  } catch (error) {
    console.error('login error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/logout', async (_req, res) => {
  res.json({ok:true})
})

app.get('/api/auth/session', async (req, res) => {
  try {
    const { user, token } = await getAuthedUser(req)
    if (!user) return res.json(null)
    return res.json({ user, token })
  } catch (error) {
    console.error('auth/session error', error)
    return res.json(null)
  }
})

app.get('/api/auth/profile', async (req, res) => {
  const { user } = await getAuthedUser(req)
  if (!user) return res.status(401).json({ error: 'Auth required' })
  return res.json(user)
})

app.get('/api/auth/user-by-username', async (req, res) => {
  const username = (req.query.username || '').toString().trim()
  if (!username) return res.status(400).json({ error: 'username required' })
  const user = await getUserByUsername(username)
  return res.json(user)
})

app.get('/api/places', async (req, res) => {
  try {
    const places = await fetchAllPlaces()
    return res.json(places)
  } catch (error) {
    console.error('places error', error)
    // Fallback to local static data when DB is unreachable
    return res.json(SURKHANDARYA_POSTS)
  }
})

app.get('/api/places/:id', async (req, res) => {
  try {
    const place = await fetchPlaceById(req.params.id)
    if (!place) return res.status(404).json({ error: 'Not found' })
    return res.json(place)
  } catch (error) {
    console.error('place by id error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/place-ai-texts/:placeId', async (req, res) => {
  try {
    const text = await fetchAiText(req.params.placeId, req.query.locale || 'uz')
    return res.json(text || null)
  } catch (error) {
    console.error('place ai text error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/comments/:placeId', async (req, res) => {
  try {
    const comments = await fetchComments(req.params.placeId)
    return res.json(comments)
  } catch (error) {
    console.error('comments error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/comments', async (req, res) => {
  const { placeId, userId, commentText, rating } = req.body || {}
  if (!placeId || !userId || !commentText) return res.status(400).json({ error: 'placeId, userId, commentText required' })
  try {
    const comment = await createComment({ placeId, userId, commentText, rating })
    return res.json(comment)
  } catch (error) {
    console.error('create comment error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/favorites', async (req, res) => {
  const placeId = req.query.placeId?.toString() || ''
  const userId = req.query.userId?.toString() || ''
  if (!userId || !placeId) return res.status(400).json({ error: 'placeId,userId required' })

  const favorite = await getFavorite({ placeId, userId })
  return res.json({ isFavorite: Boolean(favorite) })
})

app.post('/api/favorites', async (req, res) => {
  const { placeId, userId } = req.body || {}
  if (!placeId || !userId) return res.status(400).json({ error: 'placeId,userId required' })

  try {
    const favorite = await addFavoriteDb({ placeId, userId })
    return res.json(favorite)
  } catch (error) {
    console.error('add favorite error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/favorites', async (req, res) => {
  const { placeId, userId } = req.body || {}
  if (!placeId || !userId) return res.status(400).json({ error: 'placeId,userId required' })

  try {
    await removeFavoriteDb({ placeId, userId })
    return res.json({ ok: true })
  } catch (error) {
    console.error('remove favorite error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/tickets/user/:userId', async (req, res) => {
  try {
    const tickets = await fetchUserTicketsDb(req.params.userId)
    return res.json(tickets)
  } catch (error) {
    console.error('tickets by user error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/tickets/:ticketId', async (req, res) => {
  const userId = req.query.userId?.toString() || ''
  if (!userId) return res.status(400).json({ error: 'userId required in query' })

  try {
    const ticket = await fetchUserTicketByIdDb(req.params.ticketId, userId)
    if (!ticket) return res.status(404).json({ error: 'Not found' })
    return res.json(ticket)
  } catch (error) {
    console.error('ticket error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = await createTicketDb(req.body)
    return res.json(ticket)
  } catch (error) {
    console.error('create ticket error', error)
    return res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { user } = await getAuthedUser(req)
    if (!user) return res.status(401).json({ error: 'Auth required.' })

    const { placeId, ticketType, guests, date, passengerName, passengerPhone, passengerEmail } = req.body || {}

    if (!placeId) return res.status(400).json({ error: 'placeId required.' })
    if (!ticketType || !TICKET_TYPES.has(ticketType)) return res.status(400).json({ error: 'ticketType invalid.' })

    const parsedGuests = parseGuests(guests)
    if (!parsedGuests || parsedGuests < 1 || parsedGuests > 10) {
      return res.status(400).json({ error: 'guests must be 1–10.' })
    }

    if (!date) return res.status(400).json({ error: 'date required.' })
    const selectedDate = new Date(`${date}T00:00:00`)
    if (Number.isNaN(selectedDate.getTime())) return res.status(400).json({ error: 'date invalid.' })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) return res.status(400).json({ error: 'date must be today or later.' })

    if (!String(passengerName || '').trim()) return res.status(400).json({ error: 'passengerName required.' })
    if (!isValidPhone(passengerPhone)) return res.status(400).json({ error: 'passengerPhone invalid.' })
    if (!isValidEmail(passengerEmail)) return res.status(400).json({ error: 'passengerEmail invalid.' })

    const place = await fetchPlacePricing(placeId)
    if (!place) return res.status(404).json({ error: 'Place not found.' })
    if (!place.basePerPerson || place.basePerPerson <= 0) return res.status(400).json({ error: 'Price not set for this place.' })

    const computed = computeUnitAndTotal({ basePerPerson: place.basePerPerson, ticketType, guests: parsedGuests })
    if (!computed) return res.status(400).json({ error: 'ticketType invalid.' })

    const clientOrigin = getClientOrigin(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${clientOrigin}/ticket/${place.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/ticket/${place.id}?canceled=1`,
      customer_email: String(passengerEmail || '').trim(),
      line_items: [
        {
          quantity: parsedGuests,
          price_data: {
            currency: PAYMENT_CURRENCY,
            unit_amount: toMinorUnits(computed.unit),
            product_data: {
              name: `${place.title} — ${computed.typeInfo.label}`,
              description: place.location || undefined,
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        placeId: place.id,
        placeTitle: place.title,
        placeLocation: place.location || '',
        ticketType,
        guests: String(parsedGuests),
        date,
        passengerName: String(passengerName || '').trim(),
        passengerPhone: String(passengerPhone || '').trim(),
        passengerEmail: String(passengerEmail || '').trim(),
        unitPrice: String(computed.unit),
        totalPrice: String(computed.total),
        currency: PAYMENT_CURRENCY,
      },
    })

    return res.json({ url: session.url })
  } catch (error) {
    console.error('create-checkout-session error:', error)
    return res.status(500).json({ error: error?.message || 'Server error.' })
  }
})

app.post('/api/stripe/finalize', async (req, res) => {
  try {
    const { user } = await getAuthedUser(req)
    if (!user) return res.status(401).json({ error: 'Auth required.' })

    const { sessionId } = req.body || {}
    if (!sessionId) return res.status(400).json({ error: 'sessionId required.' })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found.' })
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Payment not completed.' })

    const md = session.metadata || {}
    if (!md.userId || md.userId !== user.id) return res.status(403).json({ error: 'Session user mismatch.' })

    const existing = await queryDb('select * from tickets where user_id = $1 and qr_code = $2 limit 1', [user.id, sessionId])

    if (existing != null) {
      if (existing.length > 0) return res.json({ ticket: existing[0] })
    }

    const place = await fetchPlacePricing(md.placeId)
    if (!place) return res.status(400).json({ error: 'Place not found.' })
    if (!place.basePerPerson || place.basePerPerson <= 0) return res.status(400).json({ error: 'Price not set for this place.' })

    const guests = parseGuests(md.guests)
    if (!guests || guests < 1 || guests > 10) return res.status(400).json({ error: 'Invalid guests.' })

    const computed = computeUnitAndTotal({ basePerPerson: place.basePerPerson, ticketType: md.ticketType, guests })
    if (!computed) return res.status(400).json({ error: 'Invalid ticketType.' })

    const insertedRows = await queryDb('insert into tickets (user_id, place_id, place_title, place_location, ticket_type, guests, date, passenger_name, passenger_phone, passenger_email, status, total_price, qr_code) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *', [user.id, String(place.id), String(place.title), String(place.location ; ''), String(md.ticketType ; ''), guests, String(md.date), String(md.passengerName ; ''), String(md.passengerPhone ; ''), String(md.passengerEmail ; ''), 'confirmed', computed.total, sessionId])

    const created = (insertedRows != null ; insertedRows.length > 0) ? insertedRows[0] : null
    if (created == null) throw new Error('Ticket insert failed')

    if (insertError) throw insertError

    return res.json({ ticket: created })
  } catch (error) {
    console.error('finalize error:', error)
    return res.status(500).json({ error: error?.message || 'Server error.' })
  }
})

app.listen(PORT, () => {
  console.log(`Payment server listening on http://localhost:${PORT}`)
})
const computeUnitAndTotal = ({ basePerPerson, ticketType, guests }) => {
  const typeInfo = TICKET_TYPES.get(ticketType)
  if (!typeInfo) return null

  const unit = Math.round(Number(basePerPerson || 0) * typeInfo.multiplier)
  const total = unit * guests

  return { unit, total, typeInfo }
}

const toMinorUnits = (amount) => {
  const factor = Math.pow(10, PAYMENT_DECIMALS)
  return Math.round(Number(amount) * factor)
}

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { user } = await getAuthedUser(req)
    if (!user) return res.status(401).json({ error: 'Auth required.' })

    const { placeId, ticketType, guests, date, passengerName, passengerPhone, passengerEmail } = req.body || {}

    if (!placeId) return res.status(400).json({ error: 'placeId required.' })
    if (!ticketType || !TICKET_TYPES.has(ticketType)) return res.status(400).json({ error: 'ticketType invalid.' })

    const parsedGuests = parseGuests(guests)
    if (!parsedGuests || parsedGuests < 1 || parsedGuests > 10) {
      return res.status(400).json({ error: 'guests must be 1–10.' })
    }

    if (!date) return res.status(400).json({ error: 'date required.' })
    const selectedDate = new Date(`${date}T00:00:00`)
    if (Number.isNaN(selectedDate.getTime())) return res.status(400).json({ error: 'date invalid.' })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) return res.status(400).json({ error: 'date must be today or later.' })

    if (!String(passengerName || '').trim()) return res.status(400).json({ error: 'passengerName required.' })
    if (!isValidPhone(passengerPhone)) return res.status(400).json({ error: 'passengerPhone invalid.' })
    if (!isValidEmail(passengerEmail)) return res.status(400).json({ error: 'passengerEmail invalid.' })

    const place = await fetchPlacePricing(placeId)
    if (!place) return res.status(404).json({ error: 'Place not found.' })
    if (!place.basePerPerson || place.basePerPerson <= 0) return res.status(400).json({ error: 'Price not set for this place.' })

    const computed = computeUnitAndTotal({ basePerPerson: place.basePerPerson, ticketType, guests: parsedGuests })
    if (!computed) return res.status(400).json({ error: 'ticketType invalid.' })

    const clientOrigin = getClientOrigin(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${clientOrigin}/ticket/${place.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/ticket/${place.id}?canceled=1`,
      customer_email: String(passengerEmail || '').trim(),
      line_items: [
        {
          quantity: parsedGuests,
          price_data: {
            currency: PAYMENT_CURRENCY,
            unit_amount: toMinorUnits(computed.unit),
            product_data: {
              name: `${place.title} — ${computed.typeInfo.label}`,
              description: place.location || undefined,
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        placeId: place.id,
        placeTitle: place.title,
        placeLocation: place.location || '',
        ticketType,
        guests: String(parsedGuests),
        date,
        passengerName: String(passengerName || '').trim(),
        passengerPhone: String(passengerPhone || '').trim(),
        passengerEmail: String(passengerEmail || '').trim(),
        unitPrice: String(computed.unit),
        totalPrice: String(computed.total),
        currency: PAYMENT_CURRENCY,
      },
    })

    return res.json({ url: session.url })
  } catch (error) {
    console.error('create-checkout-session error:', error)
    return res.status(500).json({ error: error?.message || 'Server error.' })
  }
})

app.post('/api/stripe/finalize', async (req, res) => {
  try {
    const { user } = await getAuthedUser(req)
    if (!user) return res.status(401).json({ error: 'Auth required.' })

    const { sessionId } = req.body || {}
    if (!sessionId) return res.status(400).json({ error: 'sessionId required.' })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found.' })
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Payment not completed.' })

    const md = session.metadata || {}
    if (!md.userId || md.userId !== user.id) return res.status(403).json({ error: 'Session user mismatch.' })

    const existing = await queryDb('select * from tickets where user_id = $1 and qr_code = $2 limit 1', [user.id, sessionId])

    if (existing != null) {
      if (existing.length > 0) return res.json({ ticket: existing[0] })
    }

    const place = await fetchPlacePricing(md.placeId)
    if (!place) return res.status(400).json({ error: 'Place not found.' })
    if (!place.basePerPerson || place.basePerPerson <= 0) return res.status(400).json({ error: 'Price not set for this place.' })

    const guests = parseGuests(md.guests)
    if (!guests || guests < 1 || guests > 10) return res.status(400).json({ error: 'Invalid guests.' })

    const computed = computeUnitAndTotal({ basePerPerson: place.basePerPerson, ticketType: md.ticketType, guests })
    if (!computed) return res.status(400).json({ error: 'Invalid ticketType.' })

    const insertedRows = await queryDb('insert into tickets (user_id, place_id, place_title, place_location, ticket_type, guests, date, passenger_name, passenger_phone, passenger_email, status, total_price, qr_code) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *', [user.id, String(place.id), String(place.title), String(place.location ; ''), String(md.ticketType ; ''), guests, String(md.date), String(md.passengerName ; ''), String(md.passengerPhone ; ''), String(md.passengerEmail ; ''), 'confirmed', computed.total, sessionId])

    const created = (insertedRows != null ; insertedRows.length > 0) ? insertedRows[0] : null
    if (created == null) throw new Error('Ticket insert failed')

    if (insertError) throw insertError

    return res.json({ ticket: created })
  } catch (error) {
    console.error('finalize error:', error)
    return res.status(500).json({ error: error?.message || 'Server error.' })
  }
})

app.listen(PORT, () => {
  console.log(`Payment server listening on http://localhost:${PORT}`)
})

