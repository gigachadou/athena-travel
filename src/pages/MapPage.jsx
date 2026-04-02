import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapContainer, TileLayer, Marker, Popup, Polyline,
  useMapEvents, Tooltip, useMap, Circle
} from 'react-leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import {
  Compass, Navigation, Search, X, ChevronRight,
  MapPin, Clock, Star, Route, Target, Layers,
  ZoomIn, ZoomOut, Crosshair, AlertCircle, CheckCircle2,
  Info, Map, Landmark, Hotel, Utensils, Car, HeartPulse,
  ShoppingBag, Bus, LayoutGrid, RefreshCw, Globe, Phone,
  Loader, ChevronLeft
} from 'lucide-react'
import Loading from '../components/Loading'
import { useTranslation } from 'react-i18next'
import { fetchPlaces, invalidateCache } from '../utils/overpassService'
import '../styles/MapPage.css'

// ─── Type Config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  landmark:   { color: '#007BFF', bg: '#E3F2FD', label: 'Yodgorlik',    Icon: Landmark    }, // bright blue
  hotel:      { color: '#c300ff', bg: '#f3e5f5', label: 'Mehmonxona',   Icon: Hotel       }, // neon purple
  restaurant: { color: '#ff6200', bg: '#fff3e0', label: 'Restoran',     Icon: Utensils    }, // neon orange
  parking:    { color: '#00d52b', bg: '#dcfce7', label: 'Parkovka',     Icon: Car         }, // neon green
  hospital:   { color: '#ff0044', bg: '#fee2e2', label: 'Shifoxona',    Icon: HeartPulse  }, // neon red
  shopping:   { color: '#ff00a6', bg: '#fce7f3', label: "Do'kon",       Icon: ShoppingBag }, // neon pink
  transport:  { color: '#00c3ff', bg: '#cffafe', label: 'Transport',    Icon: Bus         }, // vivid cyan
  user:       { color: '#ffcc00', bg: '#fef3c7', label: 'Siz',          Icon: Navigation  }, // vivid yellow
}

const CATEGORIES = [
  { id: 'all',        label: 'Barchasi',      Icon: LayoutGrid   },
  { id: 'landmark',   label: 'Yodgorliklar',  Icon: Landmark     },
  { id: 'hotel',      label: 'Mehmonxonalar', Icon: Hotel        },
  { id: 'restaurant', label: 'Restoranlar',   Icon: Utensils     },
  { id: 'parking',    label: 'Parkovkalar',   Icon: Car          },
  { id: 'hospital',   label: 'Shifoxonalar',  Icon: HeartPulse   },
  { id: 'shopping',   label: "Do'konlar",     Icon: ShoppingBag  },
  { id: 'transport',  label: 'Transport',     Icon: Bus          },
]

// ─── Marker Icon Factory ──────────────────────────────────────────────────────
const ICON_CACHE = {}
const getIcon = (type) => {
  if (ICON_CACHE[type]) return ICON_CACHE[type]
  const cfg    = TYPE_CONFIG[type] || TYPE_CONFIG.landmark
  const isUser = type === 'user'
  const size   = isUser ? 50 : 44
  const iconSz = isUser ? 22 : 20
  const svgStr = renderToStaticMarkup(
    React.createElement(cfg.Icon, { size: iconSz, color: 'white', strokeWidth: 3 })
  )
  const html = `
    <div style="
      width:${size}px;height:${size}px;
      background:${cfg.color};
      display:flex;align-items:center;justify-content:center;
      border-radius:${isUser ? '50%' : '50% 50% 50% 0'};
      transform:${isUser ? 'none' : 'rotate(-45deg)'};
      border:4px solid white;
      box-shadow:0 0 25px ${cfg.color}, 0 4px 12px rgba(0,0,0,0.4);
      position:relative;
    ">
      <span style="display:flex;transform:${isUser ? 'none' : 'rotate(45deg)'};">${svgStr}</span>
      ${isUser ? '<span class="user-pulse"></span>' : ''}
    </div>`
  ICON_CACHE[type] = L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, isUser ? size / 2 : size],
    popupAnchor: [0, isUser ? -(size / 2) : -size],
  })
  return ICON_CACHE[type]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcDistance(a, b) {
  const R = 6371
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLon = (b[1] - a[1]) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return (6371 * 2 * Math.asin(Math.sqrt(x))).toFixed(1)
}

const routeColor = (type) => ({
  hotel: '#8e44ad', restaurant: '#e67e22', parking: '#16a34a',
  hospital: '#dc2626', shopping: '#db2777', transport: '#0891b2',
}[type] || '#0047AB')

const getTileUrl = (layer, dark) => {
  if (layer === 'satellite') return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  if (layer === 'topo')      return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  return dark
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
}

const LAYER_LABELS = { streets: "Ko'cha", satellite: 'Satellit', topo: 'Topografik' }

// ─── Sub-components ───────────────────────────────────────────────────────────
const FlyToLocation = ({ position }) => {
  const map = useMap()
  useEffect(() => { if (position) map.flyTo(position, 15, { duration: 1.4 }) }, [position, map])
  return null
}

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]) })
  return null
}

const ZoomControls = () => {
  const map = useMap()
  return (
    <div className="map-zoom-controls">
      <button className="zoom-btn" onClick={() => map.zoomIn()}><ZoomIn   size={17}/></button>
      <button className="zoom-btn" onClick={() => map.zoomOut()}><ZoomOut size={17}/></button>
    </div>
  )
}

const StarRow = ({ rating }) => {
  if (!rating) return <span className="no-rating">Reyting yo'q</span>
  const filled = Math.round(rating)
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} fill={i <= filled ? '#f59e0b' : 'none'} color="#f59e0b" strokeWidth={2} />
      ))}
      <span className="star-num">{rating}</span>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonMarkers = () => null // Markers are on map, we show overlay instead

const LoadingOverlay = () => (
  <Loading message="OpenStreetMap dan ma'lumot yuklanmoqda..." />
)

// ─── Main Component ───────────────────────────────────────────────────────────
const MapPage = () => {
  const navigate = useNavigate()
  const { t }    = useTranslation()

  // Map state
  const [userLocation, setUserLocation] = useState(null)
  const [geoStatus,    setGeoStatus]    = useState('idle')
  const [flyTo,        setFlyTo]        = useState(null)
  // O'zbekiston markazi — (41.38, 63.97), zoom 6 → butun mamlakat ko'rinadi
  const [mapCenter,    setMapCenter]    = useState([41.38, 63.97])
  const [mapLayer,     setMapLayer]     = useState('streets')
  const [isDarkMode,   setIsDarkMode]   = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  )

  // Places state
  const [places,      setPlaces]      = useState([])
  const [fetchStatus, setFetchStatus] = useState('idle') // idle|loading|done|error
  const [fetchedAt,    setFetchedAt]  = useState(null)
  const fetchCenter = useRef(null)  // last coords we fetched for

  // Filter + search
  const [filter,      setFilter]      = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch,  setShowSearch]  = useState(false)

  // Selected + route
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [route,       setRoute]       = useState(null)
  const [routeInfo,   setRouteInfo]   = useState(null)

  // dark mode watcher
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark')
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // ── Geolocation ─────────────────────────────────────────────────────────────
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus('error'); return }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = [coords.latitude, coords.longitude]
        setUserLocation(loc)
        setMapCenter(loc)
        setFlyTo({ pos: loc, id: Date.now() })
        setGeoStatus('success')
        setTimeout(() => setGeoStatus('idle'), 3500)
      },
      () => {
        setGeoStatus('error')
        setTimeout(() => setGeoStatus('idle'), 4000)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => { requestGeo() }, [])

  // ── Fetch Places from Overpass API ──────────────────────────────────────────
  const loadPlaces = useCallback(async () => {
    const allTypes = ['landmark','hotel','restaurant','parking','hospital','shopping','transport']
    setFetchStatus('loading')
    try {
      const results = await fetchPlaces(allTypes)
      setPlaces(results)
      setFetchedAt(new Date())
      setFetchStatus('done')
    } catch (err) {
      console.error('Overpass fetch error:', err)
      setFetchStatus('error')
    }
  }, [])

  // Load once on mount — whole Uzbekistan
  useEffect(() => { loadPlaces() }, [loadPlaces])

  // ── Route Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedLoc) { setRoute(null); setRouteInfo(null); return }
    const origin = userLocation || mapCenter
    const dest   = selectedLoc.coords
    const url    = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`
    const timer  = setTimeout(async () => {
      try {
        const data = await fetch(url).then(r => r.json())
        if (data.routes?.length) {
          const r = data.routes[0]
          setRoute(r.geometry.coordinates.map(c => [c[1], c[0]]))
          setRouteInfo({
            distance: (r.distance / 1000).toFixed(1),
            duration: Math.round(r.duration / 60)
          })
        }
      } catch {
        setRoute([origin, dest])
        setRouteInfo({ distance: calcDistance(origin, dest), duration: '?' })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [selectedLoc, userLocation, mapCenter])

  // ── Filtered locations ──────────────────────────────────────────────────────
  const filtered = places.filter(loc => {
    const okCat    = filter === 'all' || loc.type === filter
    const okSearch = !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    return okCat && okSearch
  })

  const origin = userLocation || mapCenter

  const handleSelect = (loc) => {
    setSelectedLoc(loc)
    setFlyTo({ pos: loc.coords, id: Date.now() })
  }

  const handleClose = () => {
    setSelectedLoc(null)
    setRoute(null)
    setRouteInfo(null)
  }

  const cycleLayer = () =>
    setMapLayer(l => l === 'streets' ? 'satellite' : l === 'satellite' ? 'topo' : 'streets')

  const handleRefresh = () => {
    invalidateCache()
    loadPlaces()
  }

  // Count per category
  const countOf = (type) => places.filter(l => l.type === type).length

  return (
    <div className="map-page fade-in">



      {/* ── Floating Sidebar (Drawer/Card) ─────────────────────────────────── */}
      <div className={`map-sidebar glass ${selectedLoc ? 'open' : ''}`}>
        {selectedLoc ? (() => {
          const cfg     = TYPE_CONFIG[selectedLoc.type]
          const TypeIcon = cfg?.Icon || MapPin
          return (
            <div className="sidebar-inner">
              <button className="sidebar-close" onClick={handleClose}><X size={16} /></button>

              <div className="sb-badge" style={{ background: cfg?.bg, color: cfg?.color }}>
                <TypeIcon size={12} strokeWidth={2.5} /> {cfg?.label}
              </div>

              <h3 className="sb-name">{selectedLoc.name}</h3>
              <p className="sb-desc">{selectedLoc.desc}</p>

              <div className="sb-info-grid">
                <div className="sb-info-item">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span>{selectedLoc.rating ?? 'N/A'}</span>
                </div>
                <div className="sb-info-item">
                  <Clock size={13} />
                  <span>{selectedLoc.open}</span>
                </div>
                {routeInfo && <>
                  <div className="sb-info-item">
                    <Route size={13} />
                    <span>{routeInfo.distance} km</span>
                  </div>
                  <div className="sb-info-item">
                    <Navigation size={13} />
                    <span>~{routeInfo.duration} daq.</span>
                  </div>
                </>}
              </div>

              {/* Extra: website + phone if available */}
              {selectedLoc.website && (
                <a className="sb-link" href={selectedLoc.website} target="_blank" rel="noreferrer">
                  <Globe size={13} /> {selectedLoc.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {selectedLoc.phone && (
                <a className="sb-link" href={`tel:${selectedLoc.phone}`}>
                  <Phone size={13} /> {selectedLoc.phone}
                </a>
              )}

              <div className="sb-coords">
                <MapPin size={11} />
                {selectedLoc.coords[0].toFixed(5)}, {selectedLoc.coords[1].toFixed(5)}
              </div>

              <div className="sb-dist">
                <Route size={13} />
                Sizdan <strong>{calcDistance(origin, selectedLoc.coords)} km</strong> uzoqda
              </div>

              <div className="sb-actions">
                {['landmark','hotel','restaurant'].includes(selectedLoc.type) && (
                  <button className="sb-btn-primary" onClick={() => navigate(`/place/${selectedLoc.id}`)}>
                    <Info size={14} /> Batafsil ko'rish
                  </button>
                )}
                <button
                  className="sb-btn-secondary"
                  onClick={() => setFlyTo({ pos: selectedLoc.coords, id: Date.now() })}
                >
                  <Target size={14} /> Xaritada ko'rsat
                </button>
                <a
                  className="sb-btn-osm"
                  href={`https://www.openstreetmap.org/${selectedLoc.osmType}/${selectedLoc.osmId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Map size={13} /> OSM da ko'rish
                </a>
              </div>

              <div className="sb-source">
                <Map size={11} /> OpenStreetMap
              </div>
            </div>
          )
        })() : (
          <div className="sidebar-placeholder">
            <div className="ph-icon-wrap">
              <Map size={34} strokeWidth={1.5} color="var(--primary-blue)" />
            </div>
            <p className="ph-text">Xaritadan joy tanlang va to'liq ma'lumot oling</p>
            {fetchStatus === 'done' && (
              <div className="ph-stats">
                {CATEGORIES.filter(c => c.id !== 'all').map(({ id, Icon }) => {
                  const cfg = TYPE_CONFIG[id]
                  const cnt = countOf(id)
                  if (!cnt) return null
                  return (
                    <button
                      key={id}
                      className="ph-chip"
                      onClick={() => setFilter(id)}
                      style={{ background: cfg?.bg, color: cfg?.color }}
                    >
                      <Icon size={11} strokeWidth={2.5} /> {cnt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Map Wrapper (Background) ─────────────────────────────────────── */}
      <div className="map-wrapper animate-up">
        <MapContainer
          center={mapCenter}
          zoom={6}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={getTileUrl(mapLayer, isDarkMode)}
          />
          <MapClickHandler onMapClick={pos => setMapCenter(pos)} />
          {flyTo && <FlyToLocation position={flyTo.pos} />}
          <ZoomControls />

          {/* User marker */}
          {userLocation ? (
            <>
              <Circle
                center={userLocation}
                radius={300}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.06, weight: 2, dashArray: '4,7' }}
              />
              <Marker position={userLocation} icon={getIcon('user')}>
                <Popup>
                  <div className="map-popup">
                    <div className="type-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                      <Navigation size={11} strokeWidth={2.5} /> Sizning joylashuvingiz
                    </div>
                    <p className="popup-coords">{userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}</p>
                  </div>
                </Popup>
              </Marker>
            </>
          ) : (
            <Marker position={mapCenter} icon={getIcon('user')}>
              <Popup>
                <div className="map-popup">
                  <div className="type-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    <MapPin size={11} /> Standart joylashuv
                  </div>
                  <p className="popup-coords">GPS aniqlanmadi. GPS tugmasini bosing.</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Location markers from OSM */}
          {filtered.map(loc => {
            const cfg     = TYPE_CONFIG[loc.type]
            const TypeIcon = cfg?.Icon || MapPin
            return (
              <Marker
                key={loc.id}
                position={loc.coords}
                icon={getIcon(loc.type)}
                eventHandlers={{ click: () => handleSelect(loc) }}
              >
                <Tooltip direction="top" offset={[0, -34]} opacity={1} className="custom-tooltip">
                  <div className="map-hover-tip">
                    <div className="tip-tag" style={{ background: cfg?.bg, color: cfg?.color }}>
                      <TypeIcon size={11} strokeWidth={2.5} /> {cfg?.label}
                    </div>
                    <strong className="tip-name">{loc.name}</strong>
                    <StarRow rating={loc.rating} />
                    <div className="tip-dist">
                      <Route size={11} /> {calcDistance(origin, loc.coords)} km
                    </div>
                    <div className="tip-foot">Bosing – batafsil</div>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="map-popup">
                    <div className="type-badge" style={{ background: cfg?.bg, color: cfg?.color }}>
                      <TypeIcon size={11} strokeWidth={2.5} /> {cfg?.label}
                    </div>
                    <h4>{loc.name}</h4>
                    <p className="popup-desc">{loc.desc}</p>
                    <div className="popup-meta">
                      <span><Star size={11} fill={loc.rating ? '#f59e0b' : 'none'} color="#f59e0b" /> {loc.rating ?? '—'}</span>
                      <span><Clock size={11} /> {loc.open}</span>
                    </div>
                    <div className="popup-dist">
                      <Route size={11} /> {calcDistance(origin, loc.coords)} km uzoqda
                    </div>
                    <button className="btn-popup-details" onClick={() => handleSelect(loc)}>
                      Ko'proq <ChevronRight size={13} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Route */}
          {route && selectedLoc && (
            <Polyline
              positions={route}
              color={routeColor(selectedLoc.type)}
              weight={5}
              dashArray="2,10"
              opacity={0.85}
            />
          )}
        </MapContainer>

        {/* Loading overlay */}
        {fetchStatus === 'loading' && <LoadingOverlay />}

        {/* Layer badge */}
        <div className="map-layer-badge">
          <Map size={11} /> {LAYER_LABELS[mapLayer]}
        </div>

        {/* Route pill */}
        {selectedLoc && routeInfo && (
          <div className="route-info-pill">
            <div className="rip-item"><Route size={13} /> {routeInfo.distance} km</div>
            <div className="rip-sep" />
            <div className="rip-item"><Navigation size={13} /> ~{routeInfo.duration} daq.</div>
            <div className="rip-sep" />
            <div className="rip-item" style={{ color: TYPE_CONFIG[selectedLoc.type]?.color }}>
              {React.createElement(TYPE_CONFIG[selectedLoc.type]?.Icon || MapPin, { size: 13, strokeWidth: 2.5 })}
              {selectedLoc.name}
            </div>
            <button className="rip-close" onClick={handleClose}><X size={13} /></button>
          </div>
        )}
      </div>

      {/* ── Top Bar (Floating) ────────────────────────────────────────── */}
      <div className="map-top-bar animate-up" style={{ pointerEvents: 'auto' }}>
        <div className="map-header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="icon-box-map">
            <ChevronLeft size={22} />
          </div>
          <div>
            <h3 className="map-title">Interaktiv Xarita</h3>
            <p className="map-subtitle">
              {fetchStatus === 'loading'
                ? 'Yuklanmoqda...'
                : fetchStatus === 'done'
                  ? <>{filtered.length} joy topildi · <span className="osm-badge">OSM</span></>
                  : fetchStatus === 'error'
                    ? <span className="err-txt">Xato yuz berdi</span>
                    : 'Tayyor'
              }
              {geoStatus === 'success' && <span className="geo-ok"> · GPS ✓</span>}
            </p>
          </div>
        </div>

        <div className="map-header-right">
          {showSearch ? (
            <div className="search-input-wrap">
              <Search size={14} className="search-icon-inline" />
              <input
                autoFocus
                className="map-search-input"
                placeholder="Joy qidiring..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="search-close-btn" onClick={() => { setShowSearch(false); setSearchQuery('') }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button className="map-action-btn" onClick={() => setShowSearch(true)} title="Qidirish">
              <Search size={17} />
            </button>
          )}
          <button
            className="map-action-btn"
            onClick={handleRefresh}
            title="Ma'lumotlarni yangilash"
            disabled={fetchStatus === 'loading'}
          >
            <RefreshCw size={17} className={fetchStatus === 'loading' ? 'spin-slow' : ''} />
          </button>
          <button className="map-action-btn" onClick={cycleLayer} title="Xarita turi">
            <Layers size={17} />
          </button>
          <button
            className={`map-action-btn geo-btn geo-${geoStatus}`}
            onClick={requestGeo}
            title="Mening joylashuvim"
          >
            {geoStatus === 'loading' ? <span className="spinner-mini" /> : <Crosshair size={17} />}
          </button>
        </div>
      </div>

      {/* ── Geo/Fetch Toasts (Centered & Floating) ───────────────────────── */}
      {(geoStatus === 'success' || geoStatus === 'error') && (
        <div className={`geo-toast ${geoStatus === 'error' ? 'geo-toast-error' : ''}`} style={{ pointerEvents: 'auto' }}>
          {geoStatus === 'success'
            ? <><CheckCircle2 size={16} /> {t('location_found') || 'Joylashuv aniqlandi!'}</>
            : <><AlertCircle  size={16} /> {t('location_not_found') || 'GPS aniqlanmadi — standart joy ishlatilmoqda.'}</>
          }
        </div>
      )}
      {fetchStatus === 'error' && (
        <div className="geo-toast geo-toast-error" style={{ pointerEvents: 'auto' }}>
          <AlertCircle size={16} />
          {t('osm_fetch_error') || 'Xaritadan ma\'lumot olinmadi. Internetni tekshiring.'}
          <button className="toast-retry-btn" onClick={handleRefresh}>{t('retry') || 'Qayta'}</button>
        </div>
      )}

      {/* ── Category Filter (Floating) ────────────────────────────────────── */}
      <div className="category-filter animate-up no-scrollbar" style={{ pointerEvents: 'auto' }}>
        {CATEGORIES.map(({ id, label, Icon }) => {
          const cnt = id === 'all' ? places.length : countOf(id)
          return (
            <button
              key={id}
              className={`cat-btn ${filter === id ? 'active' : ''}`}
              onClick={() => setFilter(id)}
            >
              <Icon size={14} strokeWidth={2.5} />
              <span className="cat-label">{label}</span>
              {fetchStatus === 'loading'
                ? <span className="cat-count skeleton-count" />
                : <span className="cat-count">{cnt}</span>
              }
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MapPage
