import { useEffect, useState } from 'react'
import TruckShops from './components/TruckShops'
import News from './components/News'
import { getCompanies, getCompaniesCount } from './api/companies'
import './App.css'

const states = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'],
  ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'],
  ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'],
  ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'],
  ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming']
]

const translations = {
  EN: {
    companies: 'Companies',
    shops: 'ON THE ROAD',
    news: 'News',
    eyebrow: 'TRUCKING INFORMATION PLATFORM',
    heading: 'Find the right trucking company.',
    subtitle: 'Explore trucking companies across all 50 US states.',
    directoryLabel: 'TRUCKING DIRECTORY',
    directoryDescription: 'Find and explore trucking companies in the USA.',
    directory: 'Trucking companies',
    payTitle: 'Average Trucking Company Pay',
    companyDriver: 'Водитель компании',
    ownerOperator: 'Владелец-оператор',
    or: 'ИЛИ',
    signOnBonus: 'Бонус за трудоустройство',
    typicalDeductions: 'Типичные удержания',
    companyDriver: 'Conductor de empresa',
    ownerOperator: 'Propietario-operador',
    or: 'O',
    signOnBonus: 'Bono de contratación',
    typicalDeductions: 'Deducciones habituales',
    companyDriver: 'Company Driver',
    ownerOperator: 'Owner-Operator',
    or: 'OR',
    signOnBonus: 'Sign-on bonus',
    typicalDeductions: 'Typical deductions',
    companyDriver: 'Company Driver',
    ownerOperator: 'Owner Operator',
    bonus: 'New Driver Sign-On Bonus',
    cargo: 'Cargo Insurance',
    physical: 'Physical Damage Insurance',
    ifta: 'IFTA',
    eld: 'ELD',
    perMile: 'per mile',
    gross: 'of gross',
    commission: 'company commission',
    depending: 'Depending on the company and hiring conditions.',
    example: 'Examples only. Actual pay and deductions vary by company and contract.',
    search: 'Search company or city...',
    all: 'All states',
    trucks: 'Trucks',
    fleetSizeLabel: 'Fleet size',
    allFleetSizes: 'All fleet sizes',
    reviewsLabel: 'Driver reviews',
    withReviews: 'With reviews',
    withoutReviews: 'Without reviews',
    allReviews: 'All reviews',
    noReviews: 'No reviews',
    authority: 'FMCSA authority',
    insurance: 'Insurance',
    database: 'DATABASE',
    location: 'Location',
    dot: 'USDOT NUMBER',
    loading: 'Loading companies...',
    error: 'Could not load companies.',
    empty: 'No companies found.',
    shopsTitle: 'Find truck repair shops',
    shopsText: 'Explore truck repair and maintenance services in selected US cities.',
    coming: 'Directory coming soon',
    newsTitle: 'Latest trucking news',
    newsText: 'Industry updates, FMCSA regulations, safety, freight and trucking technology.',
    footer: 'Trucking information in one place.'
  },

  ES: {
    companies: 'Empresas',
    shops: 'ON THE ROAD',
    news: 'Noticias',
    eyebrow: 'PLATAFORMA DE INFORMACIÓN DE TRANSPORTE',
    heading: 'Encuentra la empresa de transporte adecuada.',
    subtitle: 'Explora empresas de transporte en los 50 estados.',
    directoryLabel: 'DIRECTORIO DE EMPRESAS DE TRANSPORTE',
    directoryDescription: 'Busca y descubre empresas de transporte en EE. UU.',
    directory: 'Empresas de transporte',
    payTitle: 'Salarios promedio de las empresas de transporte',
    companyDriver: 'Conductor de empresa',
    ownerOperator: 'Operador propietario',
    bonus: 'Bono para nuevos conductores',
    cargo: 'Seguro de carga',
    physical: 'Seguro de daños físicos',
    ifta: 'IFTA',
    eld: 'ELD',
    perMile: 'por milla',
    gross: 'del ingreso bruto',
    commission: 'comisión de la empresa',
    depending: 'Depende de la empresa y las condiciones de contratación.',
    example: 'Solo ejemplos. El pago y las deducciones reales varían según la empresa y el contrato.',
    search: 'Buscar empresa o ciudad...',
    all: 'Todos los estados',
    trucks: 'Camiones',
    fleetSizeLabel: 'Tamaño de flota',
    allFleetSizes: 'Todos los tamaños',
    reviewsLabel: 'Opiniones de conductores',
    withReviews: 'Con opiniones',
    withoutReviews: 'Sin opiniones',
    allReviews: 'Todas las opiniones',
    noReviews: 'Sin opiniones todavía',
    authority: 'Autoridad FMCSA',
    insurance: 'Seguro',
    database: 'BASE DE DATOS',
    location: 'Ubicación',
    dot: 'NÚMERO USDOT',
    loading: 'Cargando empresas...',
    error: 'No se pudieron cargar las empresas.',
    empty: 'No se encontraron empresas.',
    shopsTitle: 'Encuentra talleres de camiones',
    shopsText: 'Explora servicios de reparación y mantenimiento en ciudades seleccionadas.',
    coming: 'Directorio próximamente',
    newsTitle: 'Últimas noticias del transporte',
    newsText: 'Actualizaciones, regulaciones FMCSA, seguridad, carga y tecnología.',
    footer: 'Información de transporte en un solo lugar.'
  },

  RU: {
    companies: 'Компании',
    shops: 'ON THE ROAD',
    news: 'Новости',
    eyebrow: 'ИНФОРМАЦИОННАЯ ПЛАТФОРМА О ТРАКИНГЕ',
    heading: 'Найдите подходящую траковую компанию.',
    subtitle: 'Изучайте траковые компании во всех 50 штатах США.',
    directoryLabel: 'КАТАЛОГ ТРАКОВЫХ КОМПАНИЙ',
    directoryDescription: 'Изучайте траковые компании в США.',
    directory: 'Траковые компании',
    payTitle: 'Средняя оплата в транспортных компаниях',
    companyDriver: 'Company Driver',
    ownerOperator: 'Owner Operator',
    bonus: 'Бонус для нового водителя',
    cargo: 'Страхование груза',
    physical: 'Страхование физического ущерба',
    ifta: 'IFTA',
    eld: 'ELD',
    perMile: 'за милю',
    gross: 'от валового дохода',
    commission: 'комиссия компании',
    depending: 'Зависит от компании и условий найма.',
    example: 'Это примеры. Реальная оплата и удержания зависят от компании и контракта.',
    search: 'Поиск компании или города...',
    all: 'Все штаты',
    trucks: 'Траки',
    fleetSizeLabel: 'Размер автопарка',
    allFleetSizes: 'Любой размер',
    reviewsLabel: 'Отзывы водителей',
    withReviews: 'С отзывами',
    withoutReviews: 'Без отзывов',
    allReviews: 'Все отзывы',
    noReviews: 'Пока нет отзывов',
    authority: 'Статус FMCSA',
    insurance: 'Страховка',
    database: 'БАЗА ДАННЫХ',
    location: 'Местоположение',
    dot: 'НОМЕР USDOT',
    loading: 'Загрузка компаний...',
    error: 'Не удалось загрузить компании.',
    empty: 'Компании не найдены.',
    shopsTitle: 'Найдите трак-шоп',
    shopsText: 'Каталог ремонта и обслуживания траков в выбранных городах США.',
    coming: 'Каталог скоро появится',
    newsTitle: 'Последние новости тракинга',
    newsText: 'Новости отрасли, правила FMCSA, безопасность, грузоперевозки и технологии.',
    footer: 'Вся информация о тракинге в одном месте.'
  }
}

const shopCities = [
  ['Dallas', 'Texas'],
  ['Atlanta', 'Georgia'],
  ['Chicago', 'Illinois'],
  ['Philadelphia', 'Pennsylvania'],
  ['Columbus', 'Ohio'],
  ['Phoenix', 'Arizona']
]

function App() {
  const [language, setLanguage] = useState('EN')
  const [activeTab, setActiveTab] = useState('companies')
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [selectedState, setSelectedState] = useState('ALL')
  const [fleetSize, setFleetSize] = useState('')
  const [reviewFilter, setReviewFilter] = useState('')
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 200
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const t = translations[language]

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')

    const filters = {
      state: selectedState === 'ALL' ? '' : selectedState,
      search,
      fleetSize,
      reviews: reviewFilter,
    }

    Promise.all([
      getCompanies({
        ...filters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      getCompaniesCount(filters),
    ])
      .then(([companyData, countData]) => {
        if (cancelled) return
        setCompanies(companyData)
        setTotalCompanies(countData.total)
      })
      .catch(err => {
        if (cancelled) return
        console.error(err)
        setError('API connection failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, selectedState, fleetSize, reviewFilter, page])

  const totalPages = Math.ceil(totalCompanies / pageSize)
  const firstCompany = totalCompanies === 0 ? 0 : (page - 1) * pageSize + 1
  const lastCompany = Math.min(page * pageSize, totalCompanies)

  function changeTab(tab) {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <a
            className="logo"
            href="#"
            onClick={() => changeTab('companies')}
          >
            <span className="logo-icon">T</span>
            <span>
              TRUCK<span className="gold">SCOPE</span>
            </span>
          </a>

          <nav className="navigation">
            {['companies', 'news', 'shops'].map(tab => (
              <button
                key={tab}
                className={
                  activeTab === tab ? 'nav-link active' : 'nav-link'
                }
                onClick={() => changeTab(tab)}
              >
                {t[tab]}
              </button>
            ))}
          </nav>

          <div className="languages">
            {['EN', 'ES', 'RU'].map(lang => (
              <button
                key={lang}
                className={
                  language === lang ? 'language selected' : 'language'
                }
                onClick={() => setLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          {activeTab !== 'news' && (
            <>
              <div className="eyebrow">{t.eyebrow}</div>

              <h1>
                
                {activeTab === 'shops' && t.shopsTitle}
              </h1>

              <p>
                {activeTab === 'companies' && t.subtitle}
                {activeTab === 'shops' && t.shopsText}
              </p>

              <div className="hero-line" />
            </>
          )}
        </div>
      </section>

      <main className="main-content">
        {activeTab === 'companies' && (
          <>
            <div className="section-heading">
              <div>
                <span className="section-label">
                  {t.directoryLabel}
                </span>

                <h2>{t.directory}</h2>

                <p>
                  {t.directoryDescription}
                </p>
              </div>

              <div className="count">
                <strong>{totalCompanies.toLocaleString()}</strong>
                <span> companies</span>
              </div>
            </div>

            <section className="pay-summary">
  <h3>{t.payTitle}</h3>

  <div className="pay-columns">
    <div className="pay-group">
      <h4>{t.companyDriver}</h4>
      <div className="pay-grid">
        <div className="pay-item">
          <strong>$0.65–$0.75/mile (team $1)</strong>
        </div>
        <div className="pay-item">
          <strong>{t.or} 30%–33% (team 38%)</strong>
        </div>
        <div className="pay-item">
          <strong>{t.signOnBonus}: $700–$1,000</strong>
        </div>
      </div>
    </div>

    <div className="pay-group">
      <h4>{t.ownerOperator}</h4>
      <div className="pay-grid">
        <div className="pay-item">
          <strong>10% of gross</strong>
        </div>
        <div className="pay-item">
          <strong>Typical deductions: $500–$650/week (IFTA, insurance)</strong>
        </div>
        <div className="pay-item">
          <strong>Dry van / reefer rental: $150–$250/week</strong>
        </div>
      </div>
    </div>
  </div>

  <p className="pay-note">{t.example}</p>
</section>

            <div className="filters">
              <input
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={t.search}
              />

              <select
                value={selectedState}
                onChange={e => {
                  setSelectedState(e.target.value)
                  setPage(1)
                }}
              >
                <option value="ALL">{t.all}</option>

                {states.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={fleetSize}
                aria-label={t.fleetSizeLabel}
                onChange={e => {
                  setFleetSize(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">{t.allFleetSizes}</option>
                <option value="6-10">6–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="200+">200+</option>
              </select>

              <select
                value={reviewFilter}
                aria-label={t.reviewsLabel}
                onChange={e => {
                  setReviewFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">{t.allReviews}</option>
                <option value="WITH">{t.withReviews}</option>
                <option value="WITHOUT">{t.withoutReviews}</option>
              </select>
            </div>

            {loading && (
              <div className="message">
                {t.loading}
              </div>
            )}

            {error && (
              <div className="message error">
                {t.error} — {error}
                <button onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && companies.length === 0 && (
              <div className="message">
                {t.empty}
              </div>
            )}

            <div className="company-list">
              {companies.map(company => (
                <article
                  className="company-card"
                  key={company.id}
                >
                  <div className="company-top">
                    <div className="company-symbol">
                      {company.name?.charAt(0) || '?'}
                    </div>

                    <div className="company-title">
                      <h3>{company.name || 'Unknown company'}</h3>
                      <p>
                        📍 {company.city || '—'}, {company.state || '—'}
                      </p>
                    </div>

                    <span className="demo-tag">
                      {company.data_source === 'FMCSA'
                        ? 'FMCSA'
                        : 'DEMO'}
                    </span>
                  </div>

                  <div className="stats">
                    <div>
                      <span>{t.authority}</span>
                      <strong>
                        {company.authority_status || 'Not verified'}
                      </strong>
                    </div>

                    <div>
                      <span>{t.insurance}</span>
                      <strong>
                        {company.insurance_status || 'Not verified'}
                      </strong>
                    </div>

                    <div>
                      <span>{t.trucks}</span>
                      <strong>
                        {company.truck_count ?? '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="company-info">
                    <div>
                      <span>{t.dot}</span>
                      <strong>
                        {company.usdot_number || '—'}
                      </strong>
                    </div>

                    <div>
                      <span>{t.location}</span>
                      <strong>
                        {company.city || '—'}, {company.state || '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="company-reviews">
                    {Number(company.review_count) > 0 &&
                    company.average_rating !== null &&
                    company.average_rating !== undefined ? (
                      <>
                        <div className="review-stars" aria-label="Company rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              className={`star ${Number(company.average_rating) >= star ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <strong>{Number(company.average_rating).toFixed(1)} / 5</strong>
                        <span className="review-count">
                          ({company.review_count})
                        </span>
                      </>
                    ) : (
                      <span className="no-rating">{t.noReviews}</span>
                    )}
                  </div>

                  <div className="company-bottom">
                    {company.data_source === 'FMCSA'
                      ? 'FMCSA source data — verification required'
                      : 'Demonstration record — not a real carrier'}
                  </div>
                </article>
              ))}
            </div>

            {!loading && !error && totalCompanies > 0 && (
              <div className="pagination">
                <span>
                  Showing {firstCompany.toLocaleString()}–
                  {lastCompany.toLocaleString()} of{' '}
                  {totalCompanies.toLocaleString()} companies
                </span>

                <div className="pagination-buttons">
                  <button
                    onClick={() => setPage(current => Math.max(1, current - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>

                  <span>Page {page} of {totalPages}</span>

                  <button
                    onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'shops' && <TruckShops language={language} />}

        {activeTab === 'news' && <News language={language} />}
      </main>

      <footer className="footer">
        <strong>
          TRUCK<span className="gold">SCOPE</span>
        </strong>

        <span>{t.footer}</span>
        <span>© 2026 TruckScope</span>
      </footer>
    </div>
  )
}

export default App
