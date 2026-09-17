import { useState, useEffect, useCallback } from 'react'
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
  { id: '3M', days: 92 },
  { id: '1A', days: 366 },
  { id: '5A', days: 1830 },
]

const formatRate = (rate) => {
  if (!rate) return '—'
  if (rate >= 100) return rate.toFixed(2)
  return rate.toFixed(4)
}

const formatAmount = (v) => {
  if (!v || isNaN(v)) return '—'
  if (v >= 100) return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

const ChartTooltip = ({ active, payload, label, baseCurrency, code }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-bold text-slate-900 dark:text-white">
        1 {baseCurrency} = {payload[0].value?.toFixed(4)} {code}
      </p>
    </div>
  )
}

const TrendIcon = ({ direction }) => {
  if (direction === 'up') return (
    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
  if (direction === 'down') return (
    <svg className="w-4 h-4 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  )
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  )
}

export default function CurrencyModal({ currencyCode, rates, changes, sparklineData, baseCurrency, onClose }) {
  const [period, setPeriod] = useState('7D')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState({})
  const [calcAmount, setCalcAmount] = useState('1')
  const [swapped, setSwapped] = useState(false)
  const [spreadAmount, setSpreadAmount] = useState('1000')
  const [spreadPct, setSpreadPct] = useState(2)

  const currency = CURRENCIES.find(c => c.code === currencyCode)
  const isSecondary = currency?.secondary ?? false
  const rate = rates?.[currencyCode]
  const change = changes?.[currencyCode] ?? 0
  const isPos = change >= 0
  const color = isPos ? '#16a34a' : '#dc2626'

  const fetchChart = useCallback(async (p) => {
    const key = `${currencyCode}-${p}`
    if (cache[key]) { setChartData(cache[key]); return }

    if (p === '7D' && sparklineData?.[currencyCode]?.length) {
      const d = sparklineData[currencyCode].map(pt => ({
        date: fmtDateLocale(pt.date, 10),
        rate: pt.rate,
      }))
      setChartData(d)
      setCache(prev => ({ ...prev, [key]: d }))
      return
    }

    const days = PERIODS.find(x => x.id === p)?.days ?? 10
    setLoading(true)
    try {
      const res = await fetchPeriodData(days, baseCurrency, currencyCode)
      const formatted = Object.entries(res.rates)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, r]) => ({ date: fmtDateLocale(date, days), rate: r[currencyCode] }))
        .filter(d => d.rate)
      setChartData(formatted)
      setCache(prev => ({ ...prev, [key]: formatted }))
    } catch {
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [currencyCode, baseCurrency, sparklineData])

  useEffect(() => {
    if (currencyCode) { setPeriod('7D'); setCache({}); fetchChart('7D') }
  }, [currencyCode])

  useEffect(() => { fetchChart(period) }, [period, fetchChart])

  const rateValues = chartData.map(d => d.rate).filter(Boolean)
  const maxRate = rateValues.length ? Math.max(...rateValues) : null
  const minRate = rateValues.length ? Math.min(...rateValues) : null
  const firstRate = rateValues[0]
  const lastRate = rateValues[rateValues.length - 1]
  const periodChange = firstRate && lastRate ? -((lastRate - firstRate) / firstRate) * 100 : null

  // Estadísticas para el banner "¿es buen momento?"
  const avgRate = rateValues.length ? rateValues.reduce((a, b) => a + b, 0) / rateValues.length : null
  const pctFromAvg = avgRate && rate ? ((rate - avgRate) / avgRate) * 100 : null
  const sortedRates = [...rateValues].sort((a, b) => a - b)
  const percentile = rate && sortedRates.length > 1
    ? Math.round(sortedRates.filter(r => r <= rate).length / sortedRates.length * 100)
    : null

  const trendDir = pctFromAvg === null ? null : pctFromAvg > 1 ? 'up' : pctFromAvg < -1 ? 'down' : 'neutral'

  const calcResult = rate && parseFloat(calcAmount)
    ? swapped ? parseFloat(calcAmount) / rate : parseFloat(calcAmount) * rate
    : null

  const fromCurrency = swapped ? currencyCode : baseCurrency
  const toCurrency = swapped ? baseCurrency : currencyCode

  // Spread
  const spreadAmt = parseFloat(spreadAmount) || 0
  const ecbReceive = spreadAmt * (rate || 0)
  const bankRate = (rate || 0) * (1 - spreadPct / 100)
  const bankReceive = spreadAmt * bankRate
  const lossPerOp = ecbReceive - bankReceive
  const lossPerYear = lossPerOp * 12

  if (!currency) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100 dark:border-slate-600 shadow-md">
              <img
                src={`https://flagcdn.com/w80/${currency.country}.png`}
                alt={currency.code}
                className="w-full h-full object-cover"
                onError={e => { e.target.parentElement.style.display = 'none' }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{getCurrencyName(currencyCode)}</h2>
              <p className="text-sm text-slate-400">{currency.code} · {currency.symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tasa + cambio */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-400 mb-1">1 {baseCurrency} =</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatRate(rate)} {currencyCode}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isPos ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
              }`}>
                {isPos ? '▲ +' : '▼ '}{Math.abs(change).toFixed(2)}% {t('modal.today')}
              </span>
              {periodChange !== null && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  periodChange >= 0 ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                }`}>
                  {periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)}% {t('modal.in')} {period}
                </span>
              )}
            </div>
          </div>

          {/* Selector período */}
          <div className="flex gap-1 flex-wrap">
            {PERIODS.map(p => {
              const disabled = isSecondary && p.id !== '7D'
              return (
                <button
                  key={p.id}
                  onClick={() => !disabled && setPeriod(p.id)}
                  disabled={disabled}
                  title={disabled ? 'Solo 7D disponible para esta moneda' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

          {/* Banner ¿Es buen momento? */}
          {trendDir && !loading && (
            <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
              trendDir === 'up'
                ? 'bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900'
                : trendDir === 'down'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700'
            }`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                trendDir === 'up' ? 'bg-green-100 dark:bg-green-900/60' :
                trendDir === 'down' ? 'bg-red-100 dark:bg-red-900/60' :
                'bg-slate-100 dark:bg-slate-800'
              }`}>
                <TrendIcon direction={trendDir} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${
                  trendDir === 'up' ? 'text-green-700 dark:text-green-400' :
                  trendDir === 'down' ? 'text-red-600 dark:text-red-400' :
                  'text-slate-600 dark:text-slate-400'
                }`}>
                  {trendDir === 'up' ? 'Momento favorable para cambiar' :
                   trendDir === 'down' ? 'Momento desfavorable' :
                   'Tasa en rango normal'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {Math.abs(pctFromAvg).toFixed(2)}% {pctFromAvg >= 0 ? 'sobre' : 'bajo'} el promedio de {period}
                  {percentile !== null && ` · mejor que el ${percentile}% de los días`}
                </p>
              </div>
            </div>
          )}

          {/* Gráfica */}
          {loading ? (
            <div className="h-52 flex items-center justify-center text-slate-300 dark:text-slate-600">
              {t('modal.loading')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="modal-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={58} tickFormatter={v => v.toFixed(3)} />
                <Tooltip content={<ChartTooltip baseCurrency={baseCurrency} code={currencyCode} />} />
                <Area type="monotone" dataKey="rate" stroke={color} strokeWidth={2} fill="url(#modal-grad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('modal.max_period'), value: maxRate ? formatRate(maxRate) : '—' },
              { label: t('modal.min_period'), value: minRate ? formatRate(minRate) : '—' },
              { label: t('modal.today_change'), value: `${isPos ? '+' : ''}${change.toFixed(2)}%` },
              { label: t('modal.period_change'), value: periodChange !== null ? `${periodChange >= 0 ? '+' : ''}${periodChange.toFixed(2)}%` : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Calculadora */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">{t('modal.calculator')}</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-2.5 border border-blue-200 dark:border-blue-800 flex-1 min-w-0">
                <input
                  type="number"
                  value={calcAmount}
                  onChange={e => setCalcAmount(e.target.value)}
                  className="bg-transparent flex-1 text-slate-900 dark:text-white font-bold focus:outline-none w-0 min-w-0 tabular-nums text-base"
                  placeholder="0"
                  min="0"
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">{fromCurrency}</span>
              </div>
              <button
                onClick={() => setSwapped(s => !s)}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg px-3 py-2.5 border border-blue-200 dark:border-blue-800 flex-1 min-w-0">
                <span className="flex-1 text-slate-900 dark:text-white font-bold tabular-nums truncate text-base">
                  {formatAmount(calcResult)}
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">{toCurrency}</span>
              </div>
            </div>
          </div>

          {/* ECB vs. tu banco */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">ECB vs. tu banco — ¿cuánto pierdes?</p>
              <select
                value={spreadPct}
                onChange={e => setSpreadPct(Number(e.target.value))}
                className="text-xs bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 text-amber-700 dark:text-amber-300 focus:outline-none cursor-pointer"
              >
                <option value={1}>Broker / Wise (~1%)</option>
                <option value={2}>Banco online (~2%)</option>
                <option value={3}>Banco estándar (~3%)</option>
                <option value={5}>Aeropuerto / hotel (~5%)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={spreadAmount}
                onChange={e => setSpreadAmount(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 tabular-nums"
                placeholder="1000"
                min="0"
              />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">{baseCurrency}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1 font-medium">Tasa ECB (real)</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatRate(rate)}</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1.5 tabular-nums">
                  {formatAmount(ecbReceive)} {currencyCode}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 mb-1 font-medium">Tu banco ({spreadPct}% comisión)</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{formatRate(bankRate)}</p>
                <p className="text-sm font-bold text-red-500 dark:text-red-400 mt-1.5 tabular-nums">
                  {formatAmount(bankReceive)} {currencyCode}
                </p>
              </div>
            </div>
            {spreadAmt > 0 && lossPerOp > 0 && (
              <div className="mt-3 bg-amber-100/60 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Pierdes <span className="font-bold">{formatAmount(lossPerOp)} {currencyCode}</span> por operación
                  {' · '}
                  <span className="font-bold">{formatAmount(lossPerYear)} {currencyCode}</span> al año si cambias mensual
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
