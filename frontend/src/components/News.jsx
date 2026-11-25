import { useEffect, useMemo, useState } from 'react'
import './News.css'

const categories = [
  { id: 'all', icon: '📰', labels: ['Latest News', 'Últimas noticias', 'Последние новости'] },
  { id: 'drivers', icon: '🚛', labels: ['Truck Drivers', 'Conductores', 'Водители'] },
  { id: 'regulations', icon: '📋', labels: ['FMCSA & Regulations', 'FMCSA y regulaciones', 'FMCSA и правила'] },
  { id: 'safety', icon: '🛡️', labels: ['Safety & Accidents', 'Seguridad y accidentes', 'Безопасность и аварии'] },
  { id: 'freight', icon: '📦', labels: ['Freight Market', 'Mercado de carga', 'Рынок грузоперевозок'] },
  { id: 'technology', icon: '⚙️', labels: ['Technology', 'Tecnología', 'Технологии'] },
  { id: 'fuel', icon: '⛽', labels: ['Fuel & Roads', 'Combustible y carreteras', 'Топливо и дороги'] },
]

const words = {
  EN: {
    title: 'Latest Trucking News',
    description: 'The latest news and updates from the US trucking industry.',
    search: 'Search news...',
    loading: 'Loading latest news...',
    empty: 'No articles found in this category.',
    error: 'News are temporarily unavailable. Please try again.',
    retry: 'Retry',
    read: 'Read original article',
    updated: 'Live RSS news',
    source: 'Source',
  },
  ES: {
    title: 'Últimas noticias del transporte',
    description: 'Noticias y novedades del sector del transporte en Estados Unidos.',
    search: 'Buscar noticias...',
    loading: 'Cargando noticias...',
    empty: 'No hay artículos en esta categoría.',
    error: 'Las noticias no están disponibles temporalmente.',
    retry: 'Reintentar',
    read: 'Leer artículo original',
    updated: 'Noticias RSS en vivo',
    source: 'Fuente',
  },
  RU: {
    title: 'Последние новости тракинга',
    description: 'Свежие новости и события американской транспортной отрасли.',
    search: 'Поиск новостей...',
    loading: 'Загружаем последние новости...',
    empty: 'В этой категории пока нет публикаций.',
    error: 'Новости временно недоступны. Попробуйте ещё раз.',
    retry: 'Повторить',
    read: 'Читать оригинал',
    updated: 'Новости из RSS',
    source: 'Источник',
  },
}

function formatDate(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const locale = language === 'RU' ? 'ru-RU' : language === 'ES' ? 'es-ES' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function News({ language = 'EN' }) {
  const [category, setCategory] = useState('all')
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const t = words[language] || words.EN
  const categoryIndex = ['EN', 'ES', 'RU'].indexOf(language)

  async function loadNews() {
    setLoading(true)
    setError(false)

    try {
      const response = await fetch(
        `/api/news?category=${encodeURIComponent(category)}&limit=15&language=${encodeURIComponent(language)}`
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setArticles(Array.isArray(data.articles) ? data.articles : [])
    } catch (err) {
      console.error('News API error:', err)
      setError(true)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [category, language])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return articles
    return articles.filter(article =>
      `${article.title} ${article.summary} ${article.source}`
        .toLowerCase()
        .includes(term)
    )
  }, [articles, search])

  return (
    <section className="directory-section news-page">
      <div className="section-heading news-heading">
        <div>
          <span className="section-label">TRUCKSCOPE NEWS</span>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>
        <span className="news-live"><span />{t.updated}</span>
      </div>

      <div className="news-category-list">
        {categories.map(item => (
          <button
            key={item.id}
            className={category === item.id ? 'news-category active' : 'news-category'}
            onClick={() => setCategory(item.id)}
          >
            <span>{item.icon}</span>
            {item.labels[Math.max(0, categoryIndex)]}
          </button>
        ))}
      </div>

      <div className="news-toolbar">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={t.search}
          aria-label={t.search}
        />
        <span>{filtered.length} {t.source === 'Источник' ? 'статей' : language === 'ES' ? 'artículos' : 'articles'}</span>
      </div>

      {loading && <div className="news-message">{t.loading}</div>}

      {error && !loading && (
        <div className="news-message news-error">
          {t.error}
          <button onClick={loadNews}>{t.retry}</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="news-message">{t.empty}</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="news-grid">
          {filtered.map((article, index) => (
            <article className="news-card" key={`${article.link}-${index}`}>
              <div className="news-card-top">
                <span className="news-source">{article.source}</span>
                <time>{formatDate(article.published, language)}</time>
              </div>
              <h3>{article.title}</h3>
              {article.summary && <p>{article.summary}</p>}
              <a href={article.link} target="_blank" rel="noopener noreferrer">
                {t.read} <span>↗</span>
              </a>
            </article>
          ))}
        </div>
      )}

      <div className="news-disclaimer">
        Articles are provided by their original publishers. TruckScope links to external sources.
      </div>
    </section>
  )
}
