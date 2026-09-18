// Fuente secundaria para monedas no cubiertas por el BCE (Frankfurter)
// API gratuita sin key, sin límite: https://github.com/fawazahmed0/exchange-api
const CDN = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api'

const dateNDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const fetchDate = async (date, base) => {
  const b = base.toLowerCase()
  const path = `/v1/currencies/${b}.json`

  try {
    const res = await fetch(`${CDN}@${date}${path}`)
    if (res.ok) return res.json()
  } catch {}

  // pages.dev fallback solo para fechas históricas (bloquea CORS desde github.io para fechas recientes)
  if (date !== 'latest') {
    try {
      const res = await fetch(`https://${date}.currency-api.pages.dev${path}`)
      if (res.ok) return res.json()
    } catch {}
  }

  throw new Error(`LatAm API no disponible para ${date}`)
}

// Fetches 7 días en paralelo → rates + changes + sparklineData para los códigos dados
export const fetchSecondaryRates = async (base, codes) => {
  const b = base.toLowerCase()

  // Últimos 7 días en orden ascendente (más antiguo primero, para sparkline)
  // 'latest' para hoy: evita 404 en CDN cuando el paquete aún no se publicó el día actual
  const dates = Array.from({ length: 7 }, (_, i) => i < 6 ? dateNDaysAgo(6 - i) : 'latest')

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
    const date = result.value?.date ?? dates[i]
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
