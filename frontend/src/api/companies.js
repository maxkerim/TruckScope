const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(url) {
  const response = await fetch(url)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`API error ${response.status}: ${message}`)
  }

  return response.json()
}

function buildParams({ state = '', search = '', fleetSize = '', reviews = '', limit, offset } = {}) {
  const params = new URLSearchParams()

  if (limit !== undefined) params.set('limit', String(limit))
  if (offset !== undefined) params.set('offset', String(offset))
  if (state) params.set('state', state)
  if (search.trim()) params.set('search', search.trim())
  if (fleetSize) params.set('fleet_size', fleetSize)
  if (reviews) params.set('reviews', reviews)

  return params
}

export async function getCompanies(filters = {}) {
  const params = buildParams(filters)
  return request(`${API_URL}/companies?${params}`)
}

export async function getCompaniesCount(filters = {}) {
  const params = buildParams(filters)
  return request(`${API_URL}/companies/count?${params}`)
}
