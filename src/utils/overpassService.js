/**
 * Overpass API (OpenStreetMap) service
 * Butun O'zbekiston bo'yicha joy ma'lumotlarini oladi.
 * API key talab qilmaydi – bepul va cheksiz.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// O'zbekiston bounding box: (south, west, north, east)
const UZ_BBOX = '37.18,56.00,45.52,73.22'

// Per-category result limits
const LIMITS = {
  landmark:   600,
  hotel:      500,
  restaurant: 500,
  parking:    400,
  hospital:   400,
  shopping:   400,
  transport:  400,
}

// ─── Overpass queries (bounding box, whole Uzbekistan) ────────────────────────
const QUERIES = {
  landmark: `node["tourism"~"attraction|museum|viewpoint|monument|theme_park"](${UZ_BBOX});`,
  hotel: `node["tourism"~"hotel|hostel|guest_house|motel|resort"](${UZ_BBOX});`,
  restaurant: `node["amenity"~"restaurant|cafe|fast_food|bar"](${UZ_BBOX});`,
  parking: `node["amenity"="parking"](${UZ_BBOX});`,
  hospital: `node["amenity"~"hospital|clinic|pharmacy"](${UZ_BBOX});`,
  shopping: `node["shop"~"mall|supermarket|department_store|convenience"](${UZ_BBOX});`,
  transport: `node["aeroway"~"aerodrome|terminal"](${UZ_BBOX}); node["railway"~"station"](${UZ_BBOX});`,
}

// ─── Fallback Data if Overpass API times out/fails ────────────────────────────
const FALLBACK_PLACES = [
  // Tashkent
  { id: 'fb_1', osmId: 1, osmType: 'node', type: 'landmark', name: 'Amir Temur maydoni', coords: [41.3111, 69.2797], desc: 'Diqqatga sazovor joy', open: '24/7' },
  { id: 'fb_2', osmId: 2, osmType: 'node', type: 'landmark', name: 'Chorsu bozori', coords: [41.3265, 69.2366], desc: 'Tarixiy bozor', open: '08:00-18:00' },
  { id: 'fb_3', osmId: 3, osmType: 'node', type: 'landmark', name: 'Hazrati Imom majmuasi', coords: [41.3385, 69.2396], desc: 'Tarixiy obida', open: '09:00-17:00' },
  { id: 'fb_4', osmId: 4, osmType: 'node', type: 'transport', name: 'Toshkent xalqaro aeroporti', coords: [41.2573, 69.2818], desc: 'Transport markazi', open: '24/7' },
  { id: 'fb_5', osmId: 5, osmType: 'node', type: 'transport', name: 'Toshkent Shimoliy vokzali', coords: [41.2936, 69.2882], desc: 'Transport markazi', open: '24/7' },
  { id: 'fb_6', osmId: 6, osmType: 'node', type: 'hotel', name: 'Hilton Tashkent City', coords: [41.3129, 69.2484], desc: 'Mehmonxona', open: '24/7' },
  { id: 'fb_7', osmId: 7, osmType: 'node', type: 'restaurant', name: 'Osh Markazi (Besh Qozon)', coords: [41.3486, 69.2866], desc: 'Ovqatlanish joyi', open: '10:00-22:00' },
  { id: 'fb_8', osmId: 8, osmType: 'node', type: 'shopping', name: 'Samarqand Darvoza', coords: [41.3218, 69.2291], desc: 'Savdo markazi', open: '10:00-22:00' },
  { id: 'fb_9', osmId: 9, osmType: 'node', type: 'hospital', name: 'Akfa Medline', coords: [41.3414, 69.2086], desc: 'Tibbiy muassasa', open: '24/7' },
  { id: 'fb_10', osmId: 10, osmType: 'node', type: 'parking', name: 'Tashkent City Parkovka', coords: [41.3155, 69.2505], desc: 'Avtomobil to\'xtoqxonasi', open: '24/7' },

  // Samarkand
  { id: 'fb_11', osmId: 11, osmType: 'node', type: 'landmark', name: 'Registon maydoni', coords: [39.6542, 66.9754], desc: 'Tarixiy obida', open: '08:00-19:00' },
  { id: 'fb_12', osmId: 12, osmType: 'node', type: 'landmark', name: 'Go\'ri Amir maqbarasi', coords: [39.6481, 66.9691], desc: 'Tarixiy obida', open: '08:00-19:00' },
  { id: 'fb_13', osmId: 13, osmType: 'node', type: 'landmark', name: 'Shohizinda', coords: [39.6644, 66.9839], desc: 'Tarixiy obida', open: '08:00-19:00' },
  { id: 'fb_14', osmId: 14, osmType: 'node', type: 'transport', name: 'Samarqand xalqaro aeroporti', coords: [39.7000, 66.9833], desc: 'Transport markazi', open: '24/7' },
  { id: 'fb_15', osmId: 15, osmType: 'node', type: 'hotel', name: 'Movenpick Samarkand', coords: [39.6534, 66.9535], desc: 'Yashash joyi', open: '24/7' },

  // Bukhara
  { id: 'fb_16', osmId: 16, osmType: 'node', type: 'landmark', name: 'Minorai Kalon', coords: [39.7758, 64.4150], desc: 'Tarixiy obida', open: '08:00-20:00' },
  { id: 'fb_17', osmId: 17, osmType: 'node', type: 'landmark', name: 'Ark qal\'asi', coords: [39.7778, 64.4116], desc: 'Tarixiy obida', open: '09:00-18:00' },
  { id: 'fb_18', osmId: 18, osmType: 'node', type: 'hotel', name: 'Sahid Zarafshon', coords: [39.7613, 64.4262], desc: 'Yashash joyi', open: '24/7' },

  // Khiva
  { id: 'fb_19', osmId: 19, osmType: 'node', type: 'landmark', name: 'Ichan Qal\'a', coords: [41.3789, 60.3582], desc: 'Tarixiy obida', open: '08:00-18:00' },
  { id: 'fb_20', osmId: 20, osmType: 'node', type: 'landmark', name: 'Kalta Minor', coords: [41.3773, 60.3592], desc: 'Tarixiy obida', open: '24/7' },

  // Fergana Valley (Namangan, Fergana, Andijan)
  { id: 'fb_21', osmId: 21, osmType: 'node', type: 'landmark', name: 'Xudoyorxon O\'rdasi', coords: [40.5283, 70.9419], desc: 'Tarixiy obida', open: '09:00-17:00' },
  { id: 'fb_22', osmId: 22, osmType: 'node', type: 'park', name: 'Bobur nomidagi istirohat bog\'i', coords: [40.7630, 72.3551], desc: 'Istirohat bog\'i', open: '08:00-22:00' },
  { id: 'fb_23', osmId: 23, osmType: 'node', type: 'hospital', name: 'Farg\'ona viloyati kasalxonasi', coords: [40.3833, 71.7833], desc: 'Tibbiy muassasa', open: '24/7' },

  // Surkhandarya (Termez)
  { id: 'fb_24', osmId: 24, osmType: 'node', type: 'landmark', name: 'Al-Hakim at-Termiziy maqbarasi', coords: [37.2606, 67.2023], desc: 'Tarixiy obida', open: '08:00-18:00' },
  { id: 'fb_25', osmId: 25, osmType: 'node', type: 'landmark', name: 'Qoratepa', coords: [37.2831, 67.1852], desc: 'Arxeologik obida', open: '09:00-17:00' },

  // Navoi & Jizzakh & Sirdaryo & Qashqadaryo
  { id: 'fb_26', osmId: 26, osmType: 'node', type: 'landmark', name: 'Chashma majmuasi (Nurota)', coords: [40.5621, 65.6881], desc: 'Tarixiy obida', open: '08:00-18:00' },
  { id: 'fb_27', osmId: 27, osmType: 'node', type: 'restaurant', name: 'Jizzax Somsa markazi', coords: [40.1158, 67.8422], desc: 'Ovqatlanish joyi', open: '08:00-22:00' },
  { id: 'fb_28', osmId: 28, osmType: 'node', type: 'landmark', name: 'Oqsaroy maqbarasi (Shahrisabz)', coords: [39.0583, 66.8286], desc: 'Tarixiy obida', open: '09:00-18:00' },
  { id: 'fb_29', osmId: 29, osmType: 'node', type: 'transport', name: 'Qarshi vokzali', coords: [38.8523, 65.7950], desc: 'Transport markazi', open: '24/7' },
  
  // Nukus / Karakalpakstan
  { id: 'fb_30', osmId: 30, osmType: 'node', type: 'landmark', name: 'Savitskiy nomidagi muzey', coords: [42.4645, 59.6063], desc: 'Muzey', open: '09:00-18:00' },
  { id: 'fb_31', osmId: 31, osmType: 'node', type: 'landmark', name: 'Mizdaxqon majmuasi', coords: [42.3986, 59.3872], desc: 'Tarixiy obida', open: '09:00-18:00' }
]

/** Build Overpass QL query for given types */
function buildQuery(types) {
  // Build union of all type queries, with per-type output limits
  const parts = types.map(t => {
    const limit = LIMITS[t] || 200
    return `
[out:json][timeout:30];
(
${QUERIES[t] || ''}
);
out center ${limit};
    `.trim()
  })

  // Merge into a single request using union (all types together)
  const unionBody = types
    .map(t => (QUERIES[t] || '').trim())
    .join('\n')

  const totalLimit = types.reduce((s, t) => s + (LIMITS[t] || 200), 0)

  return `[out:json][timeout:30];\n(\n${unionBody}\n);\nout center ${totalLimit};`
}

/** Normalize a raw Overpass element */
function normalizeElement(el, type) {
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon
  if (!lat || !lon) return null

  const tags = el.tags || {}
  const name =
    tags['name:uz'] || tags['name:latin'] || tags.name ||
    tags['name:ru']  || tags['name:en']
  if (!name) return null

  // Build description
  const descParts = []
  if (tags.cuisine)      descParts.push(tags.cuisine.replace(/;/g, ', '))
  if (tags.stars)        descParts.push(`${tags.stars}★`)
  if (tags.rooms)        descParts.push(`${tags.rooms} xona`)
  if (tags.capacity)     descParts.push(`Sig'im: ${tags.capacity}`)
  if (tags.operator)     descParts.push(tags.operator)
  if (tags.description)  descParts.push(tags.description)
  if (tags.fee === 'yes')  descParts.unshift('Pullik')
  else if (tags.fee === 'no') descParts.unshift('Bepul')

  const desc = descParts.join(' · ') || typeDefaultDesc(type)

  return {
    id:      `osm_${el.type}_${el.id}`,
    osmId:   el.id,
    osmType: el.type,
    type,
    name,
    coords:  [lat, lon],
    rating:  null,
    desc,
    open:    tags.opening_hours || '–',
    website: tags.website || tags['contact:website'] || null,
    phone:   tags.phone   || tags['contact:phone']   || null,
    tags,
  }
}

function typeDefaultDesc(type) {
  return ({
    landmark:   "Diqqatga sazovor joy",
    hotel:      "Yashash joyi",
    restaurant: "Ovqatlanish joyi",
    parking:    "Avtomobil to'xtoqxonasi",
    hospital:   "Tibbiy muassasa",
    shopping:   "Savdo markazi",
    transport:  "Transport markazi",
  })[type] || ''
}

/** Guess internal type from OSM tags */
function guessType(tags = {}) {
  const { amenity='', tourism='', shop='', historic='', railway='', aeroway='', public_transport='' } = tags
  if (/hotel|hostel|guest_house|motel|resort|apartment/.test(tourism))           return 'hotel'
  if (/attraction|museum|artwork|viewpoint|monument|theme_park|gallery|zoo/.test(tourism)) return 'landmark'
  if (/monument|ruins|castle|memorial|archaeological_site|fort|mosque|palace/.test(historic)) return 'landmark'
  if (/restaurant|cafe|fast_food|food_court|bar/.test(amenity))                   return 'restaurant'
  if (amenity === 'parking')                                                        return 'parking'
  if (/hospital|clinic|doctors|pharmacy|dentist|health_centre/.test(amenity))     return 'hospital'
  if (/mall|supermarket|department_store|marketplace|convenience|clothes|electronics/.test(shop) || amenity === 'marketplace') return 'shopping'
  if (/station|halt/.test(railway) || /aerodrome|terminal/.test(aeroway) || amenity === 'bus_station' || public_transport === 'station') return 'transport'
  return 'landmark'
}

// ─── In-memory cache (15 min TTL for whole-country data) ─────────────────────
let globalCache = null
let globalCacheTs = 0
const CACHE_TTL = 15 * 60 * 1000
const WARN_COOLDOWN_MS = 60 * 1000
let lastWarnMessage = ''
let lastWarnAt = 0

function warnWithCooldown(message) {
  const now = Date.now()
  if (message === lastWarnMessage && now - lastWarnAt < WARN_COOLDOWN_MS) return
  lastWarnMessage = message
  lastWarnAt = now
  console.warn(message)
}

/**
 * Fetch real places for all of Uzbekistan from Overpass API
 * @param {string[]} types
 * @returns {Promise<object[]>}
 */
export async function fetchPlaces(types) {
  // Return cache if fresh
  if (globalCache && Date.now() - globalCacheTs < CACHE_TTL) {
    return globalCache.filter(l => types.includes(l.type))
  }

  const allTypes = ['landmark','hotel','restaurant','parking','hospital','shopping','transport']
  const query    = buildQuery(allTypes)
  const body     = new URLSearchParams({ data: query })

  try {
    const res = await fetch(OVERPASS_URL, { 
      method: 'POST', 
      body,
      // Abort after 15 seconds for heavy Uzbekistan-wide queries
      signal: AbortSignal.timeout(15000)
    })
    
    if (!res.ok) {
      warnWithCooldown(`Overpass HTTP ${res.status} error. Using fallback data.`)
      return filterFallback(types);
    }

    const json     = await res.json()
    const elements = json.elements || []

    // Normalize + deduplicate
    const seen    = new Set()
    const results = []

    for (const el of elements) {
      const type = guessType(el.tags)
      const loc  = normalizeElement(el, type)
      if (!loc) continue

      const key = `${type}|${loc.name.toLowerCase().slice(0, 40)}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(loc)
    }

    if (results.length === 0) {
      return filterFallback(types);
    }

    // Cache everything
    globalCache   = results
    globalCacheTs = Date.now()

    return results.filter(l => types.includes(l.type))
  } catch (error) {
    warnWithCooldown(`Overpass fetch failed (${error.name}). Using fallback data.`)
    return filterFallback(types);
  }
}

function filterFallback(types) {
  return FALLBACK_PLACES.filter(l => types.includes(l.type))
}

/** Invalidate cache (called from UI refresh button) */
export function invalidateCache() {
  globalCache   = null
  globalCacheTs = 0
}
