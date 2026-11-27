import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './RoadAlerts.css'

const translations = {
  EN: {
    last24: '24 hours',
    last48: '48 hours',
    loading: 'Loading weather alerts...',
    empty: 'No active matching weather alerts found.',
    error: 'Weather alerts are temporarily unavailable.',
    map: 'Weather alert map',
    list: 'Latest warnings',
    area: 'Affected area',
    severity: 'Severity',
    issued: 'Issued',
    expires: 'Expires',
    instructions: 'Instructions for drivers',
    description: 'Details',
    source: 'National Weather Service',
    details: 'Official alert',
    noLocation: 'Map coordinates are not available for this alert.',
    count: 'alerts',
    unknown: 'Not specified',
  },
  ES: {
    last24: '24 horas',
    last48: '48 horas',
    loading: 'Cargando alertas meteorológicas...',
    empty: 'No se encontraron alertas activas.',
    error: 'Las alertas meteorológicas no están disponibles temporalmente.',
    map: 'Mapa de alertas',
    list: 'Avisos recientes',
    area: 'Zona afectada',
    severity: 'Gravedad',
    issued: 'Publicado',
    expires: 'Expira',
    instructions: 'Instrucciones para conductores',
    description: 'Detalles',
    source: 'National Weather Service',
    details: 'Aviso oficial',
    noLocation: 'No hay coordenadas disponibles para esta alerta.',
    count: 'alertas',
    unknown: 'No especificado',
  },
  RU: {
    last24: '24 часа',
    last48: '48 часов',
    loading: 'Загружаем погодные предупреждения...',
    empty: 'Активных предупреждений за этот период нет.',
    error: 'Сервис погодных предупреждений временно недоступен.',
    map: 'Карта предупреждений',
    list: 'Последние предупреждения',
    area: 'Зона действия',
    severity: 'Уровень опасности',
    issued: 'Опубликовано',
    expires: 'Действует до',
    instructions: 'Инструкции водителям',
    description: 'Подробности',
    source: 'National Weather Service',
    details: 'Официальное предупреждение',
    noLocation: 'Координаты для этого предупреждения не предоставлены.',
    count: 'предупреждений',
    unknown: 'Не указано',
  },
}

function markerColor(severity) {
  const value = String(severity || '').toLowerCase()
  if (value === 'extreme' || value === 'severe') return '#dc2626'
  if (value === 'moderate') return '#f97316'
  if (value === 'minor') return '#eab308'
  return '#64748b'
}

function formatDate(value, fallback) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString()
}

export default function RoadAlerts({ language = 'EN' }) {
  const t = translations[language] || translations.EN
  const [hours, setHours] = useState(24)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadAlerts() {
      setLoading(true)
      setError('')

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(
          `${apiUrl}/api/road/alerts?hours=${hours}&limit=200`,
          { signal: controller.signal },
        )

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        setAlerts(Array.isArray(data.alerts) ? data.alerts : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(t.error)
          setAlerts([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadAlerts()
    return () => controller.abort()
  }, [hours, t.error])

  const mappedAlerts = useMemo(
    () => alerts.filter(item =>
      item.lat !== null &&
      item.lon !== null &&
      item.lat !== undefined &&
      item.lon !== undefined &&
      Number.isFinite(Number(item.lat)) &&
      Number.isFinite(Number(item.lon)),
    ),
    [alerts],
  )

  return (
    <section className="road-alerts-section">
      <div className="road-alerts-toolbar">
        <div className="road-alerts-period">
          <button
            type="button"
            className={hours === 24 ? 'active' : ''}
            aria-pressed={hours === 24}
            onClick={() => setHours(24)}
          >
            {t.last24}
          </button>
          <button
            type="button"
            className={hours === 48 ? 'active' : ''}
            aria-pressed={hours === 48}
            onClick={() => setHours(48)}
          >
            {t.last48}
          </button>
        </div>
        <span className="road-alerts-count">
          {alerts.length} {t.count}
        </span>
      </div>

      <div className="road-alerts-section-title">
        <h3>{t.map}</h3>
        <span>{mappedAlerts.length} {t.count}</span>
      </div>

      <MapContainer
        className="road-alerts-map"
        center={[39, -98]}
        zoom={4}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappedAlerts.map(item => (
          <CircleMarker
            key={item.id}
            center={[Number(item.lat), Number(item.lon)]}
            radius={8}
            pathOptions={{
              color: markerColor(item.severity),
              fillColor: markerColor(item.severity),
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div className="road-alert-popup">
                <strong>{item.title || item.event}</strong>
                <p>{item.area || t.unknown}</p>
                <p>{t.severity}: {item.severity || t.unknown}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {t.details}
                  </a>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="road-alerts-section-title road-alerts-list-title">
        <h3>{t.list}</h3>
        <span>{alerts.length} {t.count}</span>
      </div>

      {loading && <p className="road-alerts-message">{t.loading}</p>}
      {!loading && error && (
        <p className="road-alerts-message road-alerts-error">{error}</p>
      )}
      {!loading && !error && alerts.length === 0 && (
        <p className="road-alerts-message">{t.empty}</p>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="road-alerts-list">
          {alerts.map(item => (
            <article className="road-alert-card" key={item.id}>
              <div
                className="road-alert-severity"
                style={{ backgroundColor: markerColor(item.severity) }}
              />
              <div className="road-alert-card-body">
                <div className="road-alert-card-heading">
                  <h4>{item.title || item.event}</h4>
                  <span className="road-alert-severity-label">
                    {item.severity || t.unknown}
                  </span>
                </div>

                <p><strong>{t.area}:</strong> {item.area || t.unknown}</p>
                <p><strong>{t.issued}:</strong> {formatDate(item.sent, t.unknown)}</p>
                {item.expires && (
                  <p><strong>{t.expires}:</strong> {formatDate(item.expires, t.unknown)}</p>
                )}

                {item.description && (
                  <details className="road-alert-details">
                    <summary>{t.description}</summary>
                    <p>{item.description}</p>
                  </details>
                )}

                {item.instruction && (
                  <div className="road-alert-instructions">
                    <strong>{t.instructions}</strong>
                    <p>{item.instruction}</p>
                  </div>
                )}

                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {t.details}
                  </a>
                )}

                {(item.lat == null || item.lon == null) && (
                  <small>{t.noLocation}</small>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="road-alerts-source">
        <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">
          {t.source}
        </a>
      </p>
    </section>
  )
}
