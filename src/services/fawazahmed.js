// Fuente secundaria para monedas no cubiertas por el BCE (Frankfurter)
// API gratuita sin key, sin límite: https://github.com/fawazahmed0/exchange-api
const CDN = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api'
const FALLBACK = 'https://currency-api.pages.dev'

const dateNDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const fetchDate = async (date, base) => {
  const b = base.toLowerCase()
  const path = `/v1/currencies/${b}.json`
  const primaryUrl = `${CDN}@${date}${path}`
  const fallbackUrl = `https://${date}.currency-api.pages.dev${path}`

  try {
    const res = await fetch(primaryUrl)
    if (res.ok) return res.json()
  } catch {}

  const res = await fetch(fallbackUrl)
  if (!res.ok) throw new Error(`LatAm API no disponible para ${date}`)
  return res.json()
}

// Fetches 7 días en paralelo → rates + changes + sparklineData para los códigos dados
export const fetchSecondaryRates = async (base, codes) => {
  const b = base.toLowerCase()

  // Últimos 7 días en orden ascendente (más antiguo primero, para sparkline)
  const dates = Array.from({ length: 7 }, (_, i) => dateNDaysAgo(6 - i))

  // Todas en paralelo, sin límite de peticiones en esta CDN
  const results = await Promise.allSettled(
    dates.map(date => fetchDate(date, base))
  )

  const sparklineData = {}
  codes.forEach(code => { sparklineData[code] = [] })

  // Construir sparklines con todos los días disponibles
  results.forEach((result, i) => {
    if (result.status !== 'fulfilled') return
    const dayRates = result.value?.[b] ?? {}
    const date = dates[i]
    codes.forEach(code => {
      const r = dayRates[code.toLowerCase()]
      if (r != null) sparklineData[code].push({ date, rate: r })
    })
  })

  // Rates y cambios desde los dos días más recientes con datos
  const successful = results
    .map((r, i) => r.status === 'fulfilled' ? r.value?.[b] : null)
    .filter(Boolean)
    .reverse() // más reciente primero

  const latestRates = successful[0] ?? {}
  const prevRates = successful[1] ?? {}

  const rates = {}
  const changes = {}

  codes.forEach(code => {
    const cl = code.toLowerCase()
    const rToday = latestRates[cl]
    const rPrev = prevRates[cl]
    if (rToday == null) return
    rates[code] = rToday
    // negativo: si la tasa sube, la divisa extranjera se debilitó vs la base
    changes[code] = rPrev ? -((rToday - rPrev) / rPrev) * 100 : 0
  })

  return { rates, changes, sparklineData }
}
