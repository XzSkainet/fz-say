import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { CURRENCIES } from '../data/currencies'
import { fetchPeriodData } from '../services/frankfurter'
import { getCurrencyName, fmtDateLocale } from '../i18n'
import CurrencySelect from './CurrencySelect'

const PERIODS = [
  { id: '7D', days: 10 },
  { id: '1M', days: 32 },
  { id: '3M', days: 92 },
  { id: '1A', days: 366 },
]

const formatRate = (rate) => {
  if (!rate) return '—'
  if (rate >= 100) return rate.toFixed(2)
  return rate.toFixed(4)
}


const CompareTooltip = ({ active, payload, label, currA, currB }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg shadow-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value >= 0 ? '+' : ''}{p.value.toFixed(3)}%
        </p>
      ))}
    </div>
  )
}

export default function CurrencyCompare({ rates, changes, baseCurrency }) {
  const [currA, setCurrA] = useState('EUR')
  const [currB, setCurrB] = useState('GBP')
  const [period, setPeriod] = useState('7D')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const cache = useRef({})

  const selectableCurrencies = CURRENCIES.filter(c => c.code !== baseCurrency)

  useEffect(() => {
    if (currA === currB) return
    const key = `${currA}-${currB}-${period}-${baseCurrency}`
    if (cache.current[key]) { setChartData(cache.current[key]); return }

    setLoading(true)
    const days = PERIODS.find(p => p.id === period)?.days ?? 10

    Promise.all([
      fetchPeriodData(days, baseCurrency, currA),
      fetchPeriodData(days, baseCurrency, currB),
    ])
      .then(([resA, resB]) => {
        const entriesA = Object.entries(resA.rates).sort(([a], [b]) => a.localeCompare(b))
        const mapB = resB.rates

        const firstA = entriesA[0]?.[1][currA]
        const firstB = mapB[entriesA[0]?.[0]]?.[currB]
        if (!firstA || !firstB) { setChartData([]); return }

        const data = entriesA
          .map(([date, rA]) => {
            const rB = mapB[date]?.[currB]
            if (!rA[currA] || !rB) return null
            return {
              date: fmtDateLocale(date, days),
              [currA]: +((rA[currA] / firstA - 1) * 100).toFixed(4),
              [currB]: +((rB / firstB - 1) * 100).toFixed(4),
            }
          })
          .filter(Boolean)

        cache.current[key] = data
        setChartData(data)
      })
      .catch(() => setChartData([]))
      .finally(() => setLoading(false))
  }, [currA, currB, period, baseCurrency])

  const rateA = rates[currA]
  const rateB = rates[currB]
  const changeA = changes[currA] ?? 0
  const changeB = changes[currB] ?? 0
  const aIsLeader = changeA >= changeB

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Comparar monedas</h2>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                period === p.id ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Selectores */}
      <div className="flex items-center gap-2 flex-wrap">
        <CurrencySelect value={currA} onChange={setCurrA} exclude={[baseCurrency, currB]} />
        <span className="text-xs text-slate-400 font-bold">vs</span>
        <CurrencySelect value={currB} onChange={setCurrB} exclude={[baseCurrency, currA]} />
        {(() => {
          const baseCountry = CURRENCIES.find(c => c.code === baseCurrency)?.country
          return (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
              vs
              {baseCountry && (
                <img src={`https://flagcdn.com/w20/${baseCountry}.png`} alt={baseCurrency} className="w-4 h-3 object-cover rounded-sm" />
              )}
              <span className="font-semibold text-slate-500 dark:text-slate-300">{baseCurrency}</span>
            </span>
          )
        })()}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { code: currA, rate: rateA, change: changeA, isLeader: aIsLeader, accent: 'blue' },
          { code: currB, rate: rateB, change: changeB, isLeader: !aIsLeader, accent: 'teal' },
        ].map(({ code, rate, change, isLeader, accent }) => {
          const country = CURRENCIES.find(c => c.code === code)?.country
          return (
            <div key={code} className={`rounded-xl p-3 border-2 transition-all ${
              isLeader
                ? accent === 'blue'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-teal-400 bg-teal-50 dark:bg-teal-950/30'
                : 'border-transparent bg-gray-50 dark:bg-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {country && (
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
                      <img src={`https://flagcdn.com/w20/${country}.png`} alt={code} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{code}</span>
                </div>
                {isLeader && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    accent === 'blue'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60'
                      : 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60'
                  }`}>↑ líder hoy</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">{getCurrencyName(code)}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">{formatRate(rate)}</p>
              <p className={`text-xs font-bold mt-0.5 ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}% hoy
              </p>
            </div>
          )
        })}
      </div>

      {/* Gráfica comparativa normalizada */}
      {loading ? (
        <div className="h-40 flex items-center justify-center text-slate-300 dark:text-slate-600 text-sm">Cargando...</div>
      ) : chartData.length > 1 ? (
        <div>
          <p className="text-[10px] text-slate-400 mb-2">Variación relativa desde el inicio del período</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} width={48} />
              <Tooltip content={<CompareTooltip currA={currA} currB={currB} />} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} />
              <Line type="monotone" dataKey={currA} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }} />
              <Line type="monotone" dataKey={currB} stroke="#0d9488" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#0d9488' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />{currA}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-teal-500 inline-block rounded" />{currB}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
