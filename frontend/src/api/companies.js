const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(url) {
  const response = await fetch(url)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`API error ${response.status}: ${message}`)
  }

  return response.json()
}

export async function getCompanies({
  state = '',
  search = '',
  limit = 200,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  if (state) params.set('state', state)
  if (search.trim()) params.set('search', search.trim())

  return request(`${API_URL}/companies?${params}`)
}

export async function getCompaniesCount({
  state = '',
  search = '',
} = {}) {
  const params = new URLSearchParams()

  if (state) params.set('state', state)
  if (search.trim()) params.set('search', search.trim())

  return request(`${API_URL}/companies/count?${params}`)
}
