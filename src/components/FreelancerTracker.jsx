import { useState, useRef, useEffect } from 'react'
import { CURRENCIES } from '../data/currencies'
import { fetchPeriodData } from '../services/frankfurter'
import { getCurrencyName } from '../i18n'
import CurrencySelect from './CurrencySelect'

const formatMoney = (v, decimals = 2) => {
  if (!v || isNaN(v)) return '—'
  return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const SNAPSHOTS = [
  { label: 'Hoy', offset: 0 },
  { label: 'Hace 3 meses', offset: 90 },
  { label: 'Hace 6 meses', offset: 180 },
  { label: 'Hace 12 meses', offset: 365 },
]

export default function FreelancerTracker({ baseCurrency, rates }) {
  const [income, setIncome] = useState('3000')
  const [incomeCurrency, setIncomeCurrency] = useState(() => baseCurrency === 'USD' ? 'EUR' : 'USD')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const cache = useRef({})

  useEffect(() => {
    if (incomeCurrency === baseCurrency) {
      setIncomeCurrency(baseCurrency === 'USD' ? 'EUR' : 'USD')
      setResults(null)
    }
  }, [baseCurrency])

  const selectableCurrencies = CURRENCIES.filter(c => c.code !== baseCurrency)
  const isSecondary = CURRENCIES.find(c => c.code === incomeCurrency)?.secondary ?? false

  const calculate = async () => {
    const amount = parseFloat(income)
    if (!amount || incomeCurrency === baseCurrency) return

    setLoading(true)

    try {
      if (isSecondary) {
        const currentRate = rates[incomeCurrency]
        if (!currentRate) { setResults(null); return }
        const valueInBase = amount / currentRate
        setResults({ snapshots: [{ label: 'Hoy', offset: 0, rate: currentRate, valueInBase }], currency: incomeCurrency, amount, secondaryOnly: true })
        return
      }

      const key = `${incomeCurrency}-${baseCurrency}-365`
      let historical
      if (cache.current[key]) {
        historical = cache.current[key]
      } else {
        const res = await fetchPeriodData(365, baseCurrency, incomeCurrency)
        historical = res.rates
        cache.current[key] = historical
      }

      const sortedDates = Object.keys(historical).sort()
      const currentRate = rates[incomeCurrency]

      const getRate = (daysBack) => {
        if (daysBack === 0) return currentRate
        const targetIdx = Math.max(0, sortedDates.length - 1 - Math.floor(daysBack * sortedDates.length / 365))
        const dateKey = sortedDates[targetIdx]
        return historical[dateKey]?.[incomeCurrency] ?? null
      }

      const snapshotResults = SNAPSHOTS.map(s => {
        const r = getRate(s.offset)
        if (!r) return { ...s, rate: null, valueInBase: null }
        const valueInBase = amount / r
        return { ...s, rate: r, valueInBase }
      })

      setResults({ snapshots: snapshotResults, currency: incomeCurrency, amount, secondaryOnly: false })
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const baseSymbol = CURRENCIES.find(c => c.code === baseCurrency)?.symbol ?? baseCurrency
  const today = results?.snapshots[0]

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rastreador para freelancers</h2>
          <p className="text-[10px] text-slate-400">¿Cuánto vale tu ingreso en moneda extranjera en tu moneda local?</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 flex-1 min-w-[140px]">
          <input
            type="number"
            value={income}
            onChange={e => setIncome(e.target.value)}
            className="bg-transparent flex-1 text-slate-900 dark:text-white font-bold focus:outline-none w-0 min-w-0 tabular-nums text-sm"
            placeholder="3000"
            min="0"
          />
          <CurrencySelect
            value={incomeCurrency}
            onChange={setIncomeCurrency}
            exclude={baseCurrency}
            triggerClassName="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            dropdownAlign="right"
          />
        </div>

        <span className="text-xs text-slate-400 flex-shrink-0">→ {baseCurrency}</span>

        <button
          onClick={calculate}
          disabled={loading}
          className="flex-shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors"
        >
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {/* Resultados */}
      {results && (
        <div className="space-y-3">
          {results.secondaryOnly ? (
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-3 flex-1">
                <p className="text-[10px] text-slate-400 mb-1">Hoy</p>
                <p className="text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300">
                  {baseSymbol}{formatMoney(results.snapshots[0].valueInBase)}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 flex-1">
                Histórico no disponible para esta moneda — solo contamos con la tasa actual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {results.snapshots.map((s, i) => {
                const pct = i > 0 && today?.valueInBase && s.valueInBase
                  ? ((today.valueInBase - s.valueInBase) / s.valueInBase) * 100
                  : null
                const isGain = pct !== null && pct >= 0

                return (
                  <div key={s.label} className={`rounded-xl p-3 ${i === 0 ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900' : 'bg-gray-50 dark:bg-slate-900'}`}>
                    <p className="text-[10px] text-slate-400 mb-1">{s.label}</p>
                    <p className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {s.valueInBase ? `${baseSymbol}${formatMoney(s.valueInBase)}` : '—'}
                    </p>
                    {pct !== null && (
                      <p className={`text-[10px] font-bold mt-0.5 ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isGain ? '+' : ''}{pct.toFixed(1)}% vs hoy
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!results.secondaryOnly && today?.valueInBase && results.snapshots[3]?.valueInBase && (
            <div className={`rounded-xl px-4 py-3 text-xs flex items-center gap-2 ${
              today.valueInBase >= results.snapshots[3].valueInBase
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400'
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {today.valueInBase >= results.snapshots[3].valueInBase
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                }
              </svg>
              <span>
                Tu ingreso de <strong>{results.amount.toLocaleString()} {results.currency}</strong> vale hoy{' '}
                <strong>{today.valueInBase >= results.snapshots[3].valueInBase ? 'más' : 'menos'}</strong>{' '}
                que hace 12 meses en {baseCurrency} —{' '}
                <strong>
                  {Math.abs(((today.valueInBase - results.snapshots[3].valueInBase) / results.snapshots[3].valueInBase) * 100).toFixed(1)}%
                  {today.valueInBase >= results.snapshots[3].valueInBase ? ' de ganancia' : ' de pérdida'} cambiaria
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
