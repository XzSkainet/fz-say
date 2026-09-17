import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { CURRENCIES } from '../data/currencies'
import { fetchPeriodData } from '../services/frankfurter'
import { t, getCurrencyName, fmtDateLocale } from '../i18n'

const PERIODS = [
  { id: '7D', days: 10 },
  { id: '1M', days: 32 },
  { id: '1A', days: 366 },
  { id: '5A', days: 1830 },
]

const CustomTooltip = ({ active, payload, label, baseCurrency, currCode }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-bold text-slate-900 dark:text-white">
        1 {baseCurrency} = {payload[0].value?.toFixed(4)} {currCode}
      </p>
    </div>
  )
}

export default function EvolutionChart({ baseCurrency, initialSparkline, rates, changes }) {
  const [period, setPeriod] = useState('7D')
  const [currCode, setCurrCode] = useState('EUR')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState({})

  const selectableCurrencies = CURRENCIES.filter(c => c.code !== baseCurrency)
  const isSecondary = CURRENCIES.find(c => c.code === currCode)?.secondary ?? false

  useEffect(() => {
    const key = `${currCode}-${period}`
    if (cache[key]) { setData(cache[key]); return }

    if (period === '7D' && initialSparkline?.[currCode]?.length) {
      const d = initialSparkline[currCode].map(p => ({
        date: fmtDateLocale(p.date, 10),
        rate: p.rate,
      }))
      setData(d)
      setCache(prev => ({ ...prev, [key]: d }))
      return
    }

    const days = PERIODS.find(p => p.id === period)?.days ?? 10
    setLoading(true)
    fetchPeriodData(days, baseCurrency, currCode)
      .then(res => {
        const formatted = Object.entries(res.rates)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, r]) => ({ date: fmtDateLocale(date, days), rate: r[currCode] }))
          .filter(d => d.rate)
        setData(formatted)
        setCache(prev => ({ ...prev, [key]: formatted }))
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [currCode, period, baseCurrency])

  const change = changes?.[currCode] ?? 0
  const isPos = change >= 0
  const color = isPos ? '#16a34a' : '#dc2626'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">{t('evolution.title')}</h2>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative flex-shrink-0">
                <select
                  value={currCode}
                  onChange={e => {
                    const newCode = e.target.value
                    const newIsSecondary = CURRENCIES.find(c => c.code === newCode)?.secondary ?? false
                    setCurrCode(newCode)
                    if (newIsSecondary) setPeriod('7D')
                  }}
                  className="appearance-none text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg pl-2.5 pr-6 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer w-[4.5rem]"
                >
                  {selectableCurrencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate min-w-0 hidden sm:block">{getCurrencyName(currCode)}</span>
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">{t('evolution.vs')} {baseCurrency}</span>
          </div>
        </div>

        <div className="flex gap-1">
          {PERIODS.map(p => {
            const disabled = isSecondary && p.id !== '7D'
            return (
              <button
                key={p.id}
                onClick={() => !disabled && setPeriod(p.id)}
                disabled={disabled}
                title={disabled ? 'Solo 7D disponible para esta moneda' : undefined}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  disabled
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : period === p.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {p.id}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
          {rates?.[currCode] ? rates[currCode].toFixed(4) : '—'}
        </span>
        <span className={`text-sm font-semibold ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {isPos ? '▲ +' : '▼ '}{Math.abs(change).toFixed(2)}% {t('evolution.today')}
        </span>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm">
          {t('evolution.loading')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="evo-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={55} tickFormatter={v => v.toFixed(3)} />
            <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} currCode={currCode} />} />
            <Area type="monotone" dataKey="rate" stroke={color} strokeWidth={2} fill="url(#evo-grad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="text-xs text-slate-400 dark:text-slate-500">
        <span>{t('evolution.source')}</span>
      </div>
    </div>
  )
}
