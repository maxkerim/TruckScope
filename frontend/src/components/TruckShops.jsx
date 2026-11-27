import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './TruckShops.css'

const cities = [
  { name: 'Dallas', state: 'Texas', lat: 32.7767, lon: -96.7970 },
  { name: 'Atlanta', state: 'Georgia', lat: 33.7490, lon: -84.3880 },
  { name: 'Chicago', state: 'Illinois', lat: 41.8781, lon: -87.6298 },
  { name: 'Philadelphia', state: 'Pennsylvania', lat: 39.9526, lon: -75.1652 },
  { name: 'Columbus', state: 'Ohio', lat: 39.9612, lon: -82.9988 },
  { name: 'Phoenix', state: 'Arizona', lat: 33.4484, lon: -112.0740 },
]


const states = [
  { name: 'Alabama', code: 'US-AL', lat: 32.8067, lon: -86.7911 },
  { name: 'Alaska', code: 'US-AK', lat: 61.3707, lon: -152.4044 },
  { name: 'Arizona', code: 'US-AZ', lat: 33.7298, lon: -111.4312 },
  { name: 'Arkansas', code: 'US-AR', lat: 34.9697, lon: -92.3731 },
  { name: 'California', code: 'US-CA', lat: 36.1162, lon: -119.6816 },
  { name: 'Colorado', code: 'US-CO', lat: 39.0598, lon: -105.3111 },
  { name: 'Connecticut', code: 'US-CT', lat: 41.5978, lon: -72.7554 },
  { name: 'Delaware', code: 'US-DE', lat: 39.3185, lon: -75.5071 },
  { name: 'Florida', code: 'US-FL', lat: 27.7663, lon: -81.6868 },
  { name: 'Georgia', code: 'US-GA', lat: 33.0406, lon: -83.6431 },
  { name: 'Hawaii', code: 'US-HI', lat: 21.0943, lon: -157.4983 },
  { name: 'Idaho', code: 'US-ID', lat: 44.2405, lon: -114.4788 },
  { name: 'Illinois', code: 'US-IL', lat: 40.3495, lon: -88.9861 },
  { name: 'Indiana', code: 'US-IN', lat: 39.8494, lon: -86.2583 },
  { name: 'Iowa', code: 'US-IA', lat: 42.0115, lon: -93.2105 },
  { name: 'Kansas', code: 'US-KS', lat: 38.5266, lon: -96.7265 },
  { name: 'Kentucky', code: 'US-KY', lat: 37.6681, lon: -84.6701 },
  { name: 'Louisiana', code: 'US-LA', lat: 31.1695, lon: -91.8678 },
  { name: 'Maine', code: 'US-ME', lat: 44.6939, lon: -69.3819 },
  { name: 'Maryland', code: 'US-MD', lat: 39.0639, lon: -76.8021 },
  { name: 'Massachusetts', code: 'US-MA', lat: 42.2302, lon: -71.5301 },
  { name: 'Michigan', code: 'US-MI', lat: 43.3266, lon: -84.5361 },
  { name: 'Minnesota', code: 'US-MN', lat: 45.6945, lon: -93.9002 },
  { name: 'Mississippi', code: 'US-MS', lat: 32.7416, lon: -89.6787 },
  { name: 'Missouri', code: 'US-MO', lat: 38.4561, lon: -92.2884 },
  { name: 'Montana', code: 'US-MT', lat: 46.9219, lon: -110.4544 },
  { name: 'Nebraska', code: 'US-NE', lat: 41.1254, lon: -98.2681 },
  { name: 'Nevada', code: 'US-NV', lat: 38.3135, lon: -117.0554 },
  { name: 'New Hampshire', code: 'US-NH', lat: 43.4525, lon: -71.5639 },
  { name: 'New Jersey', code: 'US-NJ', lat: 40.2989, lon: -74.5210 },
  { name: 'New Mexico', code: 'US-NM', lat: 34.8405, lon: -106.2485 },
  { name: 'New York', code: 'US-NY', lat: 42.1657, lon: -74.9481 },
  { name: 'North Carolina', code: 'US-NC', lat: 35.6301, lon: -79.8064 },
  { name: 'North Dakota', code: 'US-ND', lat: 47.5289, lon: -99.7840 },
  { name: 'Ohio', code: 'US-OH', lat: 40.3888, lon: -82.7649 },
  { name: 'Oklahoma', code: 'US-OK', lat: 35.5653, lon: -96.9289 },
  { name: 'Oregon', code: 'US-OR', lat: 44.5720, lon: -122.0709 },
  { name: 'Pennsylvania', code: 'US-PA', lat: 40.5908, lon: -77.2098 },
  { name: 'Rhode Island', code: 'US-RI', lat: 41.6809, lon: -71.5118 },
  { name: 'South Carolina', code: 'US-SC', lat: 33.8569, lon: -80.9450 },
  { name: 'South Dakota', code: 'US-SD', lat: 44.2998, lon: -99.4388 },
  { name: 'Tennessee', code: 'US-TN', lat: 35.7478, lon: -86.6923 },
  { name: 'Texas', code: 'US-TX', lat: 31.0545, lon: -97.5635 },
  { name: 'Utah', code: 'US-UT', lat: 40.1500, lon: -111.8624 },
  { name: 'Vermont', code: 'US-VT', lat: 44.0459, lon: -72.7107 },
  { name: 'Virginia', code: 'US-VA', lat: 37.7693, lon: -78.1700 },
  { name: 'Washington', code: 'US-WA', lat: 47.4009, lon: -121.4905 },
  { name: 'West Virginia', code: 'US-WV', lat: 38.4912, lon: -80.9545 },
  { name: 'Wisconsin', code: 'US-WI', lat: 44.2685, lon: -89.6165 },
  { name: 'Wyoming', code: 'US-WY', lat: 42.7560, lon: -107.3025 },
]

const categories = {
  all: 'All services',
  repair: 'Truck Repair',
  tires: 'Tire Shop',
  towing: 'Towing',
  oil: 'Oil Change / Lube',
  parking: 'Truck Stop / Parking',
  fuel: 'Fuel / Diesel',
  wash: 'Truck Wash',
  parts: 'Parts Store',
  scales: 'Weigh Stations & CAT Scale',
  inspection: 'DOT Inspection',
}

const categoryIcons = {
  all: '📍',
  repair: '🔧',
  tires: '🛞',
  towing: '🚛',
  oil: '🛢️',
  parking: '🅿️',
  fuel: '⛽',
  wash: '🚿',
  parts: '📦',
  scales: '⚖️',
  inspection: '📋',
}

const translations = {
  EN: {
    title: 'Find truck services',
    subtitle: 'Find truck services, parking, fuel and roadside facilities.',
    city: 'Select city',
    category: 'Service type',
    loading: 'Searching OpenStreetMap...',
    results: 'Locations found',
    empty: 'No locations found in this area.',
    error: 'Could not load map locations. Try again later.',
    address: 'Address not listed',
    open: 'View search on OpenStreetMap',
    directions: 'Directions',
    phone: 'Phone',
    note: 'Map data is provided by OpenStreetMap contributors and may be incomplete. Always confirm services before visiting.',
    directory: 'ON THE ROAD DIRECTORY',
    categories,
  },
  ES: {
    title: 'Encuentra servicios para camiones',
    subtitle: 'Encuentra servicios, estacionamientos, combustible y asistencia en carretera.',
    city: 'Seleccionar ciudad',
    category: 'Tipo de servicio',
    loading: 'Buscando en OpenStreetMap...',
    results: 'Ubicaciones encontradas',
    empty: 'No se encontraron ubicaciones en esta zona.',
    error: 'No se pudieron cargar las ubicaciones. Inténtalo más tarde.',
    address: 'Dirección no disponible',
    open: 'Ver búsqueda en OpenStreetMap',
    directions: 'Cómo llegar',
    phone: 'Teléfono',
    note: 'Los datos son proporcionados por colaboradores de OpenStreetMap y pueden estar incompletos. Confirma los servicios antes de visitar.',
    directory: 'DIRECTORIO ON THE ROAD',
    categories: {
      all: 'Todos los servicios',
      repair: 'Reparación de camiones',
      tires: 'Neumáticos para camiones',
      towing: 'Grúa para camiones',
      oil: 'Cambio de aceite / Lubricación',
      parking: 'Paradas y estacionamiento',
      fuel: 'Combustible / Diésel',
      wash: 'Lavado de camiones',
      parts: 'Repuestos',
      scales: 'Básculas para camiones',
      inspection: 'Inspección DOT',
    },
  },
  RU: {
    title: 'Найдите сервисы для траков',
    subtitle: 'Сервисы, парковки, дизель и помощь на дорогах США.',
    city: 'Выберите город',
    category: 'Тип услуги',
    loading: 'Поиск в OpenStreetMap...',
    results: 'Найдено объектов',
    empty: 'В этом районе объекты не найдены.',
    error: 'Не удалось загрузить объекты карты. Попробуйте позже.',
    address: 'Адрес не указан',
    open: 'Открыть поиск в OpenStreetMap',
    directions: 'Маршрут',
    phone: 'Телефон',
    note: 'Данные предоставлены участниками OpenStreetMap и могут быть неполными. Перед поездкой уточняйте наличие услуг.',
    directory: 'КАТАЛОГ ON THE ROAD',
    categories: {
      all: 'Все услуги',
      repair: 'Ремонт траков',
      tires: 'Грузовые шины',
      towing: 'Эвакуация траков',
      oil: 'Замена масла / ТО',
      parking: 'Truck Stop / Парковка',
      fuel: 'Топливо / Дизель',
      wash: 'Мойка траков',
      parts: 'Запчасти',
      scales: 'Грузовые весы',
      inspection: 'DOT-инспекция',
    },
  },
}



const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const INITIAL_CENTER = [32.7767, -96.7970]
const INITIAL_ZOOM = 7

function makeBoundsQuery(bounds, category) {
  const box = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`

  const filters = {
    scales: [
      `nwr(${box})["highway"="weigh_station"];`,
      `nwr(${box})["amenity"="weighbridge"];`,
      `nwr(${box})["man_made"="weighbridge"];`,
      `nwr(${box})["brand"~"CAT Scale",i];`,
      `nwr(${box})["operator"~"CAT Scale",i];`,
      `nwr(${box})["name"~"CAT Scale",i];`,
    ],
    repair: [
      `nwr(${box})["shop"="truck"];`,
      `nwr(${box})["shop"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i];`,
      `nwr(${box})["amenity"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i];`,
    ],
    tires: [
      `nwr(${box})["shop"="tyres"];`,
      `nwr(${box})["name"~"truck tire|commercial tire",i];`,
    ],
    towing: [
      `nwr(${box})["name"~"heavy.?duty towing|truck towing",i];`,
      `nwr(${box})["service"="towing"];`,
    ],
    oil: [
      `nwr(${box})["shop"="car_repair"]["service:vehicle:oil_change"="yes"];`,
      `nwr(${box})["name"~"oil change|quick lube|jiffy lube|valvoline",i];`,
    ],
    parking: [
      `nwr(${box})["amenity"="parking"]["hgv"~"yes|designated|permissive"];`,
      `nwr(${box})["amenity"="parking"]["name"~"truck|trailer|semi",i];`,
      `nwr(${box})["highway"="services"];`,
      `nwr(${box})["amenity"="fuel"]["hgv"~"yes|designated|permissive"];`,
      `nwr(${box})["name"~"truck stop|travel center|travel centre|pilot|flying j|loves|love's|ta travel|petro",i];`,
    ],
    fuel: [
      `nwr(${box})["amenity"="fuel"]["fuel:diesel"="yes"];`,
      `nwr(${box})["amenity"="fuel"]["hgv"~"yes|designated|permissive"];`,
      `nwr(${box})["amenity"="fuel"]["name"~"diesel|truck stop|travel center|pilot|flying j|loves|love's|petro",i];`,
    ],
    wash: [
      `nwr(${box})["amenity"="vehicle_wash"];`,
      `nwr(${box})["name"~"truck wash|truck and trailer wash",i];`,
    ],
    parts: [
      `nwr(${box})["shop"="truck"];`,
      `nwr(${box})["shop"="car_parts"]["name"~"truck|fleet|diesel|commercial",i];`,
      `nwr(${box})["name"~"truck parts|fleetpride|truck pro",i];`,
    ],
    inspection: [
      `nwr(${box})["amenity"="vehicle_inspection"];`,
      `nwr(${box})["service:vehicle:inspection"="yes"];`,
      `nwr(${box})["name"~"DOT inspection|truck inspection|vehicle inspection|inspection station",i];`,
    ],
  }

  const selected = category === 'all'
    ? Object.values(filters).flat()
    : filters[category] || []

  return `[out:json][timeout:45];(${selected.join('')});out center tags;`
}

function MapViewport({ onChange }) {
  const map = useMap()

  const update = useCallback(() => {
    const b = map.getBounds()
    onChange({
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
      zoom: map.getZoom(),
    })
  }, [map, onChange])

  useMapEvents({
    moveend: update,
    zoomend: update,
  })

  useEffect(() => {
    const timer = setTimeout(update, 250)
    return () => clearTimeout(timer)
  }, [update])

  return null
}

function MapFocus({ cityName, activeTab }) {
  const map = useMap()
  const lastCity = useRef('')

  useEffect(() => {
    if (activeTab !== 'services' || lastCity.current === cityName) return

    const city = cities.find(item => item.name === cityName)
    if (!city) return

    lastCity.current = cityName
    map.flyTo([city.lat, city.lon], 10, { duration: 0.8 })
  }, [map, cityName, activeTab])

  return null
}

function markerIcon(location, count = 1) {
  if (count > 1) {
    return L.divIcon({
      className: 'ts-cluster-wrapper',
      html: `<div class="ts-cluster">${count}</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })
  }

  const symbol = location.category === 'scales' ? '⚖' :
    location.type === 'weather' ? '⚠' : '●'

  const className = location.type === 'weather'
    ? 'ts-map-pin ts-weather-pin'
    : location.category === 'scales'
      ? 'ts-map-pin ts-scale-pin'
      : 'ts-map-pin ts-service-pin'

  return L.divIcon({
    className: 'ts-pin-wrapper',
    html: `<div class="${className}">${symbol}</div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 30],
  })
}

function ClusteredLocations({ locations }) {
  const map = useMap()

  const groups = useMemo(() => {
    const buckets = new Map()
    const zoom = map.getZoom()

    for (const item of locations) {
      const point = map.project([item.lat, item.lon], zoom)
      const cellX = Math.floor(point.x / 64)
      const cellY = Math.floor(point.y / 64)
      const key = `${cellX}:${cellY}`

      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(item)
    }

    return [...buckets.values()].map(items => {
      if (items.length === 1) {
        return { id: items[0].id, items, lat: items[0].lat, lon: items[0].lon }
      }

      return {
        id: `cluster-${items.map(item => item.id).join('-')}`,
        items,
        lat: items.reduce((sum, item) => sum + item.lat, 0) / items.length,
        lon: items.reduce((sum, item) => sum + item.lon, 0) / items.length,
      }
    })
  }, [locations, map, map.getZoom()])

  return groups.map(group => {
    const clustered = group.items.length > 1
    const item = group.items[0]

    return (
      <Marker
        key={group.id}
        position={[group.lat, group.lon]}
        icon={markerIcon(item, group.items.length)}
        eventHandlers={clustered ? {
          click: () => map.setView(
            [group.lat, group.lon],
            Math.min(map.getZoom() + 2, 17),
            { animate: true }
          ),
        } : undefined}
      >
        {!clustered && (
          <Popup>
            <strong>{item.name}</strong>
            <br />
            {item.address || 'Address not listed'}
            {item.area && <p>{item.area}</p>}
            {item.phone && <p>Phone: {item.phone}</p>}
            {item.website && (
              <p><a href={item.website} target="_blank" rel="noreferrer">Website</a></p>
            )}
            {item.description && <p>{item.description}</p>}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              Directions
            </a>
          </Popup>
        )}
        {clustered && (
          <Popup>
            <strong>{group.items.length} locations</strong>
            <p>Zoom in to see individual places.</p>
          </Popup>
        )}
      </Marker>
    )
  })
}

function TruckShops({ language = 'EN' }) {
  const t = translations[language] || translations.EN
  const [cityName, setCityName] = useState('Dallas')
  const [category, setCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('weather')
  const [viewport, setViewport] = useState(null)
  const [locations, setLocations] = useState([])
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const cache = useRef(new Map())
  const weatherLoaded = useRef(false)
  const requestId = useRef(0)

  const city = cities.find(item => item.name === cityName) || cities[0]

  const handleViewport = useCallback(bounds => {
    setViewport(bounds)
  }, [])

  const visibleWeather = useMemo(() => {
    if (!viewport) return weatherAlerts

    return weatherAlerts.filter(item =>
      item.lat != null &&
      item.lon != null &&
      item.lat >= viewport.south &&
      item.lat <= viewport.north &&
      item.lon >= viewport.west &&
      item.lon <= viewport.east
    )
  }, [weatherAlerts, viewport])

  useEffect(() => {
    if (activeTab !== 'weather' || weatherLoaded.current) return

    const controller = new AbortController()

    async function loadWeather() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API}/api/road/alerts?hours=48&limit=200`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Weather service unavailable')

        const data = await response.json()
        const alerts = (data.alerts || [])
          .filter(item => item.lat != null && item.lon != null)
          .map(item => ({
            ...item,
            id: item.id,
            name: item.event || 'Weather alert',
            category: 'weather',
            type: 'weather',
            address: item.area || '',
          }))

        setWeatherAlerts(alerts)
        weatherLoaded.current = true
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (err) {
        if (err.name !== 'AbortError') setError(t.error)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadWeather()
    return () => controller.abort()
  }, [activeTab, t.error])

  useEffect(() => {
    if (!viewport || activeTab === 'weather') return

    const controller = new AbortController()
    const currentRequest = ++requestId.current
    const selectedCategory = activeTab === 'scales' ? 'scales' : category

    const rounded = [
      viewport.south, viewport.west, viewport.north, viewport.east,
    ].map(value => value.toFixed(2)).join(':')

    const cacheKey = `${selectedCategory}:${rounded}`

    if (cache.has(cacheKey)) {
      setLocations(cache.get(cacheKey))
      setLoading(false)
      setError('')
      return () => controller.abort()
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const query = makeBoundsQuery(viewport, selectedCategory)
        const response = await fetch(`${API}/api/road/overpass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Map data unavailable')

        const data = await response.json()
        const found = (data.elements || []).map(item => {
          const tags = item.tags || {}
          const lat = item.lat ?? item.center?.lat
          const lon = item.lon ?? item.center?.lon
          if (lat == null || lon == null) return null

          return {
            id: `${item.type}-${item.id}`,
            name: tags.name || tags.brand || tags.operator ||
              (selectedCategory === 'scales' ? 'Unnamed weigh station / scale' : 'Truck service'),
            address: item.address || tags.truckscope_address || [
              tags['addr:full'],
              [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
              tags['addr:city'],
              tags['addr:state'],
              tags['addr:postcode'],
            ].filter(Boolean).join(', '),
            category: item.category || tags.truckscope_category || selectedCategory,
            lat,
            lon,
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || '',
            type: 'place',
          }
        }).filter(Boolean)

        if (currentRequest !== requestId.current) return

        const unique = [...new Map(found.map(item => [item.id, item])).values()]
        cache.set(cacheKey, unique)
        if (cache.size > 80) cache.delete(cache.keys().next().value)

        setLocations(unique)
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (err) {
        if (err.name !== 'AbortError' && currentRequest === requestId.current) {
          setError(t.error)
        }
      } finally {
        if (!controller.signal.aborted && currentRequest === requestId.current) {
          setLoading(false)
        }
      }
    }, 450)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [viewport, activeTab, category, t.error])

  const displayed = activeTab === 'weather' ? visibleWeather : locations

  const searchText = activeTab === 'weather'
    ? 'Weather alerts'
    : activeTab === 'scales'
      ? 'Weigh Stations & CAT Scale'
      : t.categories[category] || 'Truck services'

  const osmUrl = viewport
    ? `https://www.openstreetmap.org/#map=${Math.max(4, Math.round(viewport.zoom))}/${(viewport.south + viewport.north) / 2}/${(viewport.west + viewport.east) / 2}`
    : 'https://www.openstreetmap.org/'

  return (
    <section className="directory-section truck-shops-page">
      <div className="on-road-tabs" role="tablist" aria-label="On the Road map layers">
        <button type="button" role="tab" aria-selected={activeTab === 'weather'}
          className={activeTab === 'weather' ? 'active' : ''}
          onClick={() => setActiveTab('weather')}>
          🌪️ {language === 'RU' ? 'Погода и дороги' : language === 'ES' ? 'Clima y carreteras' : 'Weather & Roads'}
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'services'}
          className={activeTab === 'services' ? 'active' : ''}
          onClick={() => setActiveTab('services')}>
          🔧 {language === 'RU' ? 'Сервис и ремонт' : language === 'ES' ? 'Servicio y reparación' : 'Service & Repair'}
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'scales'}
          className={activeTab === 'scales' ? 'active' : ''}
          onClick={() => setActiveTab('scales')}>
          ⚖️ {language === 'RU' ? 'Весовые' : language === 'ES' ? 'Básculas' : 'Weigh Stations & CAT Scale'}
        </button>
      </div>

      <div className="section-heading">
        <div>
          <span className="section-label">{t.directory}</span>
          <h2>{searchText}</h2>
          <p>
            {activeTab === 'weather'
              ? 'Active National Weather Service alerts across the visible map area.'
              : activeTab === 'scales'
                ? 'Explore weigh stations and CAT Scale locations across the United States.'
                : 'Find truck repair and roadside services around the map.'}
          </p>
        </div>
      </div>

      <div className="shops-controls">
        {activeTab === 'services' && (
          <>
            <label>
              {t.city}
              <select value={cityName} onChange={event => setCityName(event.target.value)}>
                {cities.map(item => (
                  <option key={item.name} value={item.name}>{item.name}, {item.state}</option>
                ))}
              </select>
            </label>
            <label>
              {t.category}
              <select value={category} onChange={event => setCategory(event.target.value)}>
                {Object.entries(t.categories)
                  .filter(([key]) => key !== 'scales')
                  .map(([key, value]) => (
                    <option key={key} value={key}>{categoryIcons[key]} {value}</option>
                  ))}
              </select>
            </label>
          </>
        )}
        <div className="map-live-status">
          <span className={loading ? 'map-status-dot loading' : 'map-status-dot'} />
          {loading
            ? (language === 'RU' ? 'Загрузка объектов...' : 'Loading map data...')
            : (language === 'RU' ? 'Карта готова' : 'Map ready')}
        </div>
      </div>

      <div className="shops-map">
        <MapContainer
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          minZoom={3}
          maxZoom={18}
          scrollWheelZoom
          preferCanvas
        >
          <MapViewport onChange={handleViewport} />
          <MapFocus cityName={cityName} activeTab={activeTab} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            updateWhenIdle
            keepBuffer={2}
          />
          <ClusteredLocations locations={displayed} />
        </MapContainer>
        {loading && <div className="map-loading-overlay">Loading locations…</div>}
      </div>

      <div className="shops-results-heading">
        <strong>{t.results}: {displayed.length}</strong>
        <span>{lastUpdated ? `Updated ${lastUpdated}` : ''}</span>
      </div>

      {error && <div className="shops-message error">{error}</div>}
      {!loading && !error && displayed.length === 0 && (
        <div className="shops-message">{t.empty}</div>
      )}

      <div className="shops-results">
        {displayed.slice(0, 30).map(item => (
          <article className="shop-result-card" key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.address || item.area || t.address}</p>
            {item.phone && <p>{t.phone}: {item.phone}</p>}
            {item.website && <a href={item.website} target="_blank" rel="noreferrer">Website</a>}
            {item.description && <p>{item.description.slice(0, 220)}</p>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`}
              target="_blank" rel="noreferrer">{t.directions}</a>
          </article>
        ))}
      </div>

      {displayed.length > 30 && (
        <p className="shops-map-note">
          Showing 30 of {displayed.length} results in the list. All locations remain available on the map.
        </p>
      )}

      <a className="shops-osm-link" href={osmUrl} target="_blank" rel="noreferrer">
        {t.open}
      </a>
      <p className="shops-map-note">{t.note}</p>
    </section>
  )
}

export default TruckShops
