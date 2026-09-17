const BASE = 'https://api.frankfurter.dev/v1'

const dateNDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const today = () => new Date().toISOString().split('T')[0]

export const fetchLatestRates = async (base = 'USD') => {
  const res = await fetch(`${BASE}/latest?from=${base}`)
  if (!res.ok) throw new Error('Error al obtener tasas')
  return res.json()
}

export const fetchHistoricalRange = async (daysBack, base = 'USD', currencies = []) => {
  const startDate = dateNDaysAgo(daysBack)
  const to = currencies.length ? `&to=${currencies.join(',')}` : ''
  const res = await fetch(`${BASE}/${startDate}..${today()}?from=${base}${to}`)
  if (!res.ok) throw new Error('Error al obtener historial')
  return res.json()
}

export const fetchPeriodData = async (daysBack, base = 'USD', currency) => {
  const startDate = dateNDaysAgo(daysBack)
  const res = await fetch(`${BASE}/${startDate}..${today()}?from=${base}&to=${currency}`)
  if (!res.ok) throw new Error('Error al obtener período')
  return res.json()
}
