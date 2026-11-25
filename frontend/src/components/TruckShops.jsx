import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
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
  all: 'All truck services',
  repair: 'Truck repair',
  towing: 'Towing',
  oil: 'Oil change',
  tires: 'Tire shops',
  wash: 'Truck wash',
}

const translations = {
  EN: {
    title: 'Find truck services',
    subtitle: 'Explore truck services in selected US cities.',
    city: 'Select city',
    category: 'Service type',
    loading: 'Searching OpenStreetMap...',
    results: 'Locations found',
    empty: 'No locations found in this area.',
    error: 'Could not load map locations. Try again later.',
    address: 'Address not listed',
    open: 'Open in OpenStreetMap',
    note: 'Map data is provided by OpenStreetMap contributors and may be incomplete.',
  },
  ES: {
    title: 'Encuentra servicios para camiones',
    subtitle: 'Explora servicios para camiones en ciudades seleccionadas.',
    city: 'Seleccionar ciudad',
    category: 'Tipo de servicio',
    loading: 'Buscando en OpenStreetMap...',
    results: 'Ubicaciones encontradas',
    empty: 'No se encontraron ubicaciones en esta zona.',
    error: 'No se pudieron cargar las ubicaciones.',
    address: 'Dirección no disponible',
    open: 'Abrir en OpenStreetMap',
    note: 'Los datos son proporcionados por colaboradores de OpenStreetMap y pueden estar incompletos.',
  },
  RU: {
    title: 'Найдите сервис для трака',
    subtitle: 'Ищите трак-сервисы в выбранных городах США.',
    city: 'Выберите город',
    category: 'Тип услуги',
    loading: 'Поиск в OpenStreetMap...',
    results: 'Найдено объектов',
    empty: 'В этом районе объекты не найдены.',
    error: 'Не удалось загрузить объекты карты. Попробуйте позже.',
    address: 'Адрес не указан',
    open: 'Открыть в OpenStreetMap',
    note: 'Данные предоставлены участниками OpenStreetMap и могут быть неполными.',
  },
}

function MapCenter({ city }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([city.lat, city.lon], 12, { duration: 1.2 })
  }, [city, map])

  return null
}

function buildQuery(city, category) {
  const around = `(around:15000,${city.lat},${city.lon})`

  const filters = {
    all: [
      `node["shop"="truck"]${around};`,
      `way["shop"="truck"]${around};`,
      `node["shop"="tyres"]${around};`,
      `way["shop"="tyres"]${around};`,
      `node["shop"="car_repair"]${around};`,
      `way["shop"="car_repair"]${around};`,
      `node["amenity"="car_repair"]${around};`,
      `way["amenity"="car_repair"]${around};`,
      `node["amenity"="vehicle_wash"]${around};`,
      `way["amenity"="vehicle_wash"]${around};`,
      `node["service"="towing"]${around};`,
      `way["service"="towing"]${around};`,
      `node["shop"="car_repair"]["service:vehicle:oil_change"="yes"]${around};`,
      `way["shop"="car_repair"]["service:vehicle:oil_change"="yes"]${around};`,
      `node["name"~"oil change|quick lube|jiffy lube|valvoline",i]${around};`,
      `way["name"~"oil change|quick lube|jiffy lube|valvoline",i]${around};`,
    ],
    repair: [
      `node["shop"="truck"]${around};`,
      `way["shop"="truck"]${around};`,
      `node["shop"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i]${around};`,
      `way["shop"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i]${around};`,
      `node["amenity"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i]${around};`,
      `way["amenity"="car_repair"]["name"~"truck|diesel|semi|heavy.?duty",i]${around};`,
    ],
    tires: [
      `node["shop"="tyres"]${around};`,
      `way["shop"="tyres"]${around};`,
    ],
    towing: [
      `node["service"="towing"]${around};`,
      `way["service"="towing"]${around};`,
    ],
    oil: [
      `node["shop"="car_repair"]["service:vehicle:oil_change"="yes"]${around};`,
      `way["shop"="car_repair"]["service:vehicle:oil_change"="yes"]${around};`,
      `node["name"~"oil change|quick lube|jiffy lube|valvoline",i]${around};`,
      `way["name"~"oil change|quick lube|jiffy lube|valvoline",i]${around};`,
    ],
    wash: [
      `node["amenity"="vehicle_wash"]${around};`,
      `way["amenity"="vehicle_wash"]${around};`,
    ],
  }

  return `[out:json][timeout:25];(${filters[category].join('')});out center tags;`
}

function TruckShops({ language = 'EN' }) {
  const t = translations[language] || translations.EN
  const [cityName, setCityName] = useState('Dallas')
  const [category, setCategory] = useState('all')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(query),
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
              name: tags.name || tags.brand || 'Truck service',
              address,
              lat,
              lon,
              phone: tags.phone || tags['contact:phone'] || '',
              website: tags.website || tags['contact:website'] || '',
            }
          })
          .filter(Boolean)

        setLocations(found)
      } catch (err) {
        if (err.name !== 'AbortError') setError(t.error)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
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
          <span className="section-label">TRUCK SERVICE DIRECTORY</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
      </div>

      <div className="shops-controls">
        <label>
          {t.city}
          <select value={cityName} onChange={e => setCityName(e.target.value)}>
            {cities.map(item => (
              <option key={item.name} value={item.name}>
                {item.name}, {item.state}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t.category}
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {Object.entries(categories).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
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
              pathOptions={{ color: '#d99a27', fillColor: '#f0b43c', fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{item.name}</strong>
                <br />
                {item.address || t.address}
                {item.phone && <><br />{item.phone}</>}
                {item.website && (
                  <>
                    <br />
                    <a href={item.website} target="_blank" rel="noreferrer">Website</a>
                  </>
                )}
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
            {item.phone && <p>{item.phone}</p>}
            {item.website && (
              <a href={item.website} target="_blank" rel="noreferrer">Website</a>
            )}
          </article>
        ))}
      </div>

      <a className="shops-osm-link" href={searchUrl} target="_blank" rel="noreferrer">
        {t.open}
      </a>

      <p className="shops-map-note">{t.note}</p>
    </section>
  )
}

export default TruckShops
