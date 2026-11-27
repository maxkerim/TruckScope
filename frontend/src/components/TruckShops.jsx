import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet'
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
  scales: 'Weigh Scales',
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

function MapCenter({ city }) {
  const map = useMap()

  function findNearby() {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser')
      return
    }

    setLocationStatus('Getting your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNearbyPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
        setLocationStatus('Searching near your location')
      },
      () => {
        setNearbyPosition(null)
        setLocationStatus('Location permission denied. Searching selected city.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  useEffect(() => {
    map.flyTo([city.lat, city.lon], 12, { duration: 1.2 })
  }, [city, map])

  return null
}

function buildQuery(city, category, nearbyPosition = null) {
  const center = nearbyPosition || city
  const around = `(around:20000,${center.lat},${center.lon})`

  const filters = {
    repair: [
      `nwr["shop"="truck"]${around};`,
      `nwr["shop"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i]${around};`,
      `nwr["amenity"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i]${around};`,
    ],
    tires: [
      `nwr["shop"="tyres"]${around};`,
      `nwr["name"~"truck tire|commercial tire",i]${around};`,
    ],
    towing: [
      `nwr["service"="towing"]${around};`,
      `nwr["amenity"="towing"]${around};`,
      `nwr["name"~"heavy.?duty towing|truck towing",i]${around};`,
    ],
    oil: [
      `nwr["shop"="car_repair"]["service:vehicle:oil_change"="yes"]${around};`,
      `nwr["name"~"oil change|quick lube|jiffy lube|valvoline",i]${around};`,
    ],
    parking: [
      `nwr["amenity"="parking"]["hgv"~"yes|designated|permissive"]${around};`,
      `nwr["amenity"="parking"]["name"~"truck|trailer|semi",i]${around};`,
      `nwr["highway"="services"]${around};`,
      `nwr["amenity"="fuel"]["hgv"~"yes|designated|permissive"]${around};`,
      `nwr["name"~"truck stop|travel center|travel centre|pilot|flying j|loves|love's|ta travel|petro",i]${around};`,
    ],
    fuel: [
      `nwr["amenity"="fuel"]["fuel:diesel"="yes"]${around};`,
      `nwr["amenity"="fuel"]["hgv"~"yes|designated|permissive"]${around};`,
      `nwr["amenity"="fuel"]["name"~"diesel|truck stop|travel center|pilot|flying j|loves|love's|petro|\\bta\\b",i]${around};`,
    ],
    wash: [
      `nwr["amenity"="vehicle_wash"]${around};`,
      `nwr["name"~"truck wash|truck and trailer wash",i]${around};`,
    ],
    parts: [
      `nwr["shop"="truck"]${around};`,
      `nwr["shop"="car_parts"]["name"~"truck|fleet|diesel|commercial",i]${around};`,
      `nwr["name"~"truck parts|fleetpride|napa|truck pro",i]${around};`,
    ],
    scales: [
      `nwr["amenity"="weighbridge"]${around};`,
      `nwr["man_made"="weighbridge"]${around};`,
      `nwr["name"~"weigh station|weigh scales|cat scale|truck scale|certified scale",i]${around};`,
    ],
    inspection: [
      `nwr["amenity"="vehicle_inspection"]${around};`,
      `nwr["service:vehicle:inspection"="yes"]${around};`,
      `nwr["name"~"DOT inspection|truck inspection|vehicle inspection|inspection station",i]${around};`,
    ],
  }

  const allFilters = Object.values(filters).flat()
  const selectedFilters = category === 'all'
    ? allFilters
    : filters[category] || []

  return `[out:json][timeout:45];(${selectedFilters.join('')});out center tags;`
}

function TruckShops({ language = 'EN' }) {
  const t = translations[language] || translations.EN
  const [cityName, setCityName] = useState('Dallas')
  const [category, setCategory] = useState('all')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nearbyPosition, setNearbyPosition] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')

  const city = cities.find(item => item.name === cityName) || cities[0]

  useEffect(() => {
    const controller = new AbortController()

    async function loadLocations() {
      setLoading(true)
      setError('')
      setLocations([])

      try {
        const query = buildQuery(city, category)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/road/overpass`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          throw new Error('OpenStreetMap service unavailable')
        }

        const data = await response.json()

        const found = (data.elements || [])
          .map(item => {
            const tags = item.tags || {}
            const lat = item.lat ?? item.center?.lat
            const lon = item.lon ?? item.center?.lon

            if (lat == null || lon == null) return null

            const address = [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:city'],
              tags['addr:state'],
            ].filter(Boolean).join(', ')

            return {
              id: `${item.type}-${item.id}`,
              name: tags.name || tags.brand || tags.operator || 'Truck service',
              address,
              lat,
              lon,
              phone: tags.phone || tags['contact:phone'] || '',
              website: tags.website || tags['contact:website'] || '',
            }
          })
          .filter(Boolean)

        const unique = [...new Map(found.map(item => [item.id, item])).values()]
        setLocations(unique)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(t.error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadLocations()
    return () => controller.abort()
  }, [city, category, t.error])

  const searchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
    `${categories[category]} near ${city.name}, ${city.state}, USA`
  )}`

  return (
    <section className="directory-section truck-shops-page">
      <div className="section-heading">
        <div>
          <span className="section-label">{t.directory}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="shops-controls">
        <label>
          {t.city}
          <select
            value={cityName}
            onChange={e => setCityName(e.target.value)}
          >
            {cities.map(item => (
              <option key={item.name} value={item.name}>
                {item.name}, {item.state}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t.category}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {Object.entries(t.categories).map(([key, value]) => (
              <option key={key} value={key}>
                {categoryIcons[key]} {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="shops-map">
        <MapContainer
          center={[city.lat, city.lon]}
          zoom={12}
          scrollWheelZoom={true}
        >
          <MapCenter city={city} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {locations.map(item => (
            <CircleMarker
              key={item.id}
              center={[item.lat, item.lon]}
              radius={8}
              pathOptions={{
                color: '#d99a27',
                fillColor: '#f0b43c',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <strong>{item.name}</strong>
                <br />
                {item.address || t.address}
                {item.phone && (
                  <>
                    <br />
                    {t.phone}: {item.phone}
                  </>
                )}
                {item.website && (
                  <>
                    <br />
                    <a href={item.website} target="_blank" rel="noreferrer">
                      Website
                    </a>
                  </>
                )}
                <br />
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.directions}
                </a>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="shops-results-heading">
        <strong>{t.results}: {locations.length}</strong>
        {loading && <span>{t.loading}</span>}
      </div>

      {error && <div className="shops-message error">{error}</div>}

      {!loading && !error && locations.length === 0 && (
        <div className="shops-message">{t.empty}</div>
      )}

      <div className="shops-results">
        {locations.map(item => (
          <article className="shop-result-card" key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.address || t.address}</p>
            {item.phone && <p>{t.phone}: {item.phone}</p>}
            {item.website && (
              <a href={item.website} target="_blank" rel="noreferrer">
                Website
              </a>
            )}
            <br />
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              {t.directions}
            </a>
          </article>
        ))}
      </div>

      <a
        className="shops-osm-link"
        href={searchUrl}
        target="_blank"
        rel="noreferrer"
      >
        {t.open}
      </a>

      <p className="shops-map-note">{t.note}</p>
    </section>
  )
}

export default TruckShops
