import { useState, useEffect, useCallback } from 'react'
import { fetchLatestRates, fetchHistoricalRange } from '../services/frankfurter'
import { fetchSecondaryRates } from '../services/fawazahmed'
import { CURRENCIES } from '../data/currencies'

const CACHE_TTL = 4 * 60 * 60 * 1000
const CACHE_VERSION = 'v2' // incrementar si cambia el formato del caché

const PRIMARY_CODES = CURRENCIES.filter(c => !c.secondary).map(c => c.code)
const SECONDARY_CODES = CURRENCIES.filter(c => c.secondary).map(c => c.code)

const cacheKey = (base) => `fzsay-${CACHE_VERSION}-${base}`

const saveCache = (base, data) => {
  try {
    sessionStorage.setItem(cacheKey(base), JSON.stringify({ ...data, ts: Date.now() }))
  } catch {}
}

const loadCache = (base) => {
  try {
    const raw = sessionStorage.getItem(cacheKey(base))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.ts > CACHE_TTL) return null
    return parsed
  } catch { return null }
}

export const useCurrencyData = (base = 'USD') => {
  const [rates, setRates] = useState({})
  const [changes, setChanges] = useState({})
  const [sparklineData, setSparklineData] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const primaryCodes = PRIMARY_CODES.filter(c => c !== base)

  const fetchData = useCallback(async () => {
    const cached = loadCache(base)
    if (cached) {
      setRates(cached.rates)
      setChanges(cached.changes)
      setSparklineData(cached.sparklineData)
      setLastUpdated(cached.lastUpdated)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Ambas fuentes en paralelo — si la secundaria falla no rompe nada
      const [latestData, historyData, secondaryData] = await Promise.all([
        fetchLatestRates(base),
        fetchHistoricalRange(30, base, primaryCodes),
        SECONDARY_CODES.length > 0
          ? fetchSecondaryRates(base, SECONDARY_CODES).catch(() => ({ rates: {}, changes: {}, sparklineData: {} }))
          : Promise.resolve({ rates: {}, changes: {}, sparklineData: {} }),
      ])

      const newRates = { ...latestData.rates, ...secondaryData.rates }
      const newLastUpdated = latestData.date
      const sortedDates = Object.keys(historyData.rates).sort()

      // Sparklines primarios (30 días)
      const sparkData = {}
      primaryCodes.forEach(code => {
        sparkData[code] = sortedDates
          .map(date => ({ date, rate: historyData.rates[date]?.[code] ?? null }))
          .filter(d => d.rate !== null)
      })

      // Merge sparklines secundarios (7 días)
      Object.assign(sparkData, secondaryData.sparklineData)

      // Cambios diarios primarios
      const changesObj = {}
      if (sortedDates.length >= 2) {
        const last = sortedDates[sortedDates.length - 1]
        const prev = sortedDates[sortedDates.length - 2]
        primaryCodes.forEach(code => {
          const rLast = historyData.rates[last]?.[code]
          const rPrev = historyData.rates[prev]?.[code]
          changesObj[code] = rLast && rPrev ? -((rLast - rPrev) / rPrev) * 100 : 0
        })
      }

      // Merge cambios secundarios
      Object.assign(changesObj, secondaryData.changes)

      setRates(newRates)
      setChanges(changesObj)
      setSparklineData(sparkData)
      setLastUpdated(newLastUpdated)
      saveCache(base, { rates: newRates, changes: changesObj, sparklineData: sparkData, lastUpdated: newLastUpdated })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, CACHE_TTL)
    return () => clearInterval(interval)
  }, [fetchData])

  return { rates, changes, sparklineData, lastUpdated, loading, error, refetch: fetchData }
}
