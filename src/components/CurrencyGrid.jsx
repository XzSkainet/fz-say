import { useState } from 'react'
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts'
import { CURRENCIES } from '../data/currencies'
import { t, getCurrencyName } from '../i18n'
import CurrencyCard from './CurrencyCard'

const BIG = ['JPY', 'KRW', 'IDR', 'ISK', 'HUF']
const formatRate = (rate, code) => {
  if (!rate) return '—'
  if (BIG.includes(code) || rate >= 100) return rate.toFixed(2)
  return rate.toFixed(4)
}

const MiniSparkline = ({ sparkline, trendUp, periodChange }) => {
  const rateValues = sparkline?.map(d => d.rate).filter(Boolean) ?? []
  if (rateValues.length < 2) return <div style={{ width: 120, height: 36 }} />
  const minR = Math.min(...rateValues)
  const maxR = Math.max(...rateValues)
  const pad = Math.max((maxR - minR) * 0.4, minR * 0.0008)
  const color = trendUp ? '#16a34a' : '#dc2626'
  return (
    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
      <div style={{ width: 120, height: 36 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id={`list-grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={[minR - pad, maxR + pad]} hide />
            <Area type="monotone" dataKey="rate" stroke={color} strokeWidth={1.5} fill={`url(#list-grad-${color.replace('#','')})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {periodChange !== null && (
        <span className={`text-[9px] font-bold ${trendUp ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {periodChange >= 0 ? '▲' : '▼'} {Math.abs(periodChange).toFixed(2)}% 7D
        </span>
      )}
    </div>
  )
}

const CurrencyRow = ({ currency, rate, change, sparkline, onClick }) => {
  const { code, country, symbol } = currency
  const name = getCurrencyName(code)
  const isPositive = change >= 0
  const rateValues = sparkline?.map(d => d.rate).filter(Boolean) ?? []
  const trendUp = rateValues.length >= 2 ? rateValues[rateValues.length - 1] >= rateValues[0] : isPositive
  const periodChange = rateValues.length >= 2
    ? ((rateValues[rateValues.length - 1] - rateValues[0]) / rateValues[0]) * 100
    : null

  const borderColor = change > 0.3
    ? 'border-green-400 dark:border-green-600'
    : change < -0.3
      ? 'border-red-400 dark:border-red-600'
      : 'border-transparent'

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors border-l-[3px] ${borderColor}`}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-slate-600 flex-shrink-0 bg-gray-100 dark:bg-slate-700">
        <img src={`https://flagcdn.com/w40/${country}.png`} alt={code} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{code}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate leading-tight">{name}</p>
      </div>

      <div className="hidden sm:block flex-shrink-0">
        <MiniSparkline sparkline={sparkline} trendUp={trendUp} periodChange={periodChange} />
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
          {formatRate(rate, code)}{rate ? <span className="text-[10px] font-normal text-slate-400 ml-0.5">{symbol}</span> : ''}
        </p>
        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${
          isPositive
            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
        }`}>
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>

      <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export default function CurrencyGrid({ rates, changes, sparklineData, baseCurrency, selectedRegion, onSelect }) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')

  const filtered = CURRENCIES.filter(c => {
    if (c.code === baseCurrency) return false
    if (!rates[c.code]) return false
    if (selectedRegion !== 'all' && c.region !== selectedRegion) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return c.code.toLowerCase().includes(q) || getCurrencyName(c.code).toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      {/* Barra de controles */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('section.search')}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Toggle Grid/Lista */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-1 flex-shrink-0">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="Vista cuadrícula"
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            title="Vista lista"
          >
            <ListIcon />
          </button>
        </div>

        {/* Leyenda micro-tint (solo en grid) */}
        {view === 'grid' && (
          <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-100 dark:bg-green-900/60 border border-green-300 dark:border-green-700 inline-block flex-shrink-0" />
              Sube &gt;0.3%
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-700 inline-block flex-shrink-0" />
              Baja &gt;0.3%
            </span>
          </div>
        )}

        {/* Leyenda lista */}
        {view === 'list' && (
          <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-0.5 h-4 rounded-full bg-green-400 inline-block flex-shrink-0" />
              Sube &gt;0.3%
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-0.5 h-4 rounded-full bg-red-400 inline-block flex-shrink-0" />
              Baja &gt;0.3%
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      {!filtered.length ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          {t('section.no_data')}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(currency => (
            <CurrencyCard
              key={currency.code}
              currency={currency}
              rate={rates[currency.code]}
              change={changes[currency.code] ?? 0}
              sparkline={sparklineData[currency.code] ?? []}
              baseCurrency={baseCurrency}
              onClick={() => onSelect(currency.code)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
          {filtered.map(currency => (
            <CurrencyRow
              key={currency.code}
              currency={currency}
              rate={rates[currency.code]}
              change={changes[currency.code] ?? 0}
              sparkline={sparklineData[currency.code] ?? []}
              onClick={() => onSelect(currency.code)}
            />
          ))}
        </div>
      )}
    </>
  )
}
