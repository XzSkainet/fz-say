import { useState, useEffect, useCallback } from 'react'
import { fetchLatestRates, fetchHistoricalRange } from '../services/frankfurter'
import { CURRENCIES } from '../data/currencies'

const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 horas — la API del BCE actualiza solo 1 vez/día

const saveCache = (base, data) => {
  try {
    sessionStorage.setItem(`fzsay-${base}`, JSON.stringify({ ...data, ts: Date.now() }))
  } catch {}
}

const loadCache = (base) => {
  try {
    const raw = sessionStorage.getItem(`fzsay-${base}`)
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

  const targetCodes = CURRENCIES.map(c => c.code).filter(c => c !== base)

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
      const [latestData, historyData] = await Promise.all([
        fetchLatestRates(base),
        fetchHistoricalRange(30, base, targetCodes),
      ])

      const newRates = latestData.rates
      const newLastUpdated = latestData.date
      const sortedDates = Object.keys(historyData.rates).sort()

      const sparkData = {}
      targetCodes.forEach(code => {
        sparkData[code] = sortedDates
          .map(date => ({ date, rate: historyData.rates[date]?.[code] ?? null }))
          .filter(d => d.rate !== null)
      })

      const changesObj = {}
      if (sortedDates.length >= 2) {
        const last = sortedDates[sortedDates.length - 1]
        const prev = sortedDates[sortedDates.length - 2]
        targetCodes.forEach(code => {
          const rLast = historyData.rates[last]?.[code]
          const rPrev = historyData.rates[prev]?.[code]
          changesObj[code] = rLast && rPrev ? -((rLast - rPrev) / rPrev) * 100 : 0
        })
      }

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
