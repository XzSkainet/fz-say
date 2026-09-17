import { useState } from 'react'
import { CURRENCIES } from '../data/currencies'
import { getCurrencyName } from '../i18n'
import CurrencySelect from './CurrencySelect'

const formatMoney = (v, code) => {
  if (!v || isNaN(v)) return '—'
  const big = ['JPY', 'KRW', 'IDR', 'ISK', 'HUF']
  const decimals = big.includes(code) || v >= 100 ? 0 : 2
  return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const DEST_COLORS = [
  { border: 'border-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { border: 'border-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
  { border: 'border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' },
]

export default function TripPlanner({ baseCurrency, rates, sparklineData }) {
  const [budget, setBudget] = useState('100')
  const [days, setDays] = useState('7')
  const [destinations, setDestinations] = useState(['EUR', 'JPY'])

  const selectableCurrencies = CURRENCIES.filter(c => c.code !== baseCurrency)
  const baseSymbol = CURRENCIES.find(c => c.code === baseCurrency)?.symbol ?? baseCurrency

  const addDestination = () => {
    if (destinations.length >= 3) return
    const next = selectableCurrencies.find(c => !destinations.includes(c.code))
    if (next) setDestinations(prev => [...prev, next.code])
  }

  const removeDestination = (code) => {
    if (destinations.length <= 1) return
    setDestinations(prev => prev.filter(c => c !== code))
  }

  const updateDestination = (idx, code) => {
    setDestinations(prev => prev.map((c, i) => i === idx ? code : c))
  }

  const dailyBudget = parseFloat(budget) || 0
  const tripDays = parseInt(days) || 1
  const totalBudget = dailyBudget * tripDays

  const getPastRate = (code) => {
    const spark = sparklineData?.[code]
    if (!spark?.length) return null
    return spark[0]?.rate ?? null
  }

  const isSecondaryCode = (code) => CURRENCIES.find(c => c.code === code)?.secondary ?? false

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Planificador de viaje</h2>
          <p className="text-[10px] text-slate-400">¿Cuánto te costará tu viaje en moneda local de destino?</p>
        </div>
      </div>

      {/* Presupuesto y días */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[120px]">
          <span className="text-xs text-slate-400 flex-shrink-0">{baseSymbol}</span>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            className="bg-transparent flex-1 text-slate-900 dark:text-white font-bold focus:outline-none w-0 min-w-0 tabular-nums text-sm"
            placeholder="100"
            min="0"
          />
          <span className="text-[10px] text-slate-400 flex-shrink-0">/día</span>
        </div>

        <span className="text-slate-300 dark:text-slate-600">×</span>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 w-24">
          <input
            type="number"
            value={days}
            onChange={e => setDays(e.target.value)}
            className="bg-transparent flex-1 text-slate-900 dark:text-white font-bold focus:outline-none w-0 min-w-0 tabular-nums text-sm"
            placeholder="7"
            min="1"
          />
          <span className="text-[10px] text-slate-400 flex-shrink-0">días</span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          = <span className="font-bold text-slate-700 dark:text-slate-200">{baseSymbol}{formatMoney(totalBudget, baseCurrency)}</span> total
        </div>
      </div>

      {/* Destinos */}
      <div className="space-y-2">
        {destinations.map((code, idx) => {
          const rate = rates[code]
          const dailyLocal = dailyBudget * (rate || 0)
          const totalLocal = totalBudget * (rate || 0)
          const secondary = isSecondaryCode(code)
          const pastRate = getPastRate(code)
          const pastDailyLocal = pastRate ? dailyBudget * pastRate : null
          const pastChange = pastRate && rate ? ((rate - pastRate) / pastRate) * 100 : null
          const pastLabel = secondary ? 'vs hace 7D' : 'vs hace 1 mes'
          const col = DEST_COLORS[idx] ?? DEST_COLORS[0]
          const currency = CURRENCIES.find(c => c.code === code)

          return (
            <div key={idx} className={`rounded-xl p-3 border-2 ${col.border} ${col.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CurrencySelect
                    value={code}
                    onChange={v => updateDestination(idx, v)}
                    exclude={[baseCurrency, ...destinations.filter(d => d !== code)]}
                    triggerClassName={`flex items-center gap-1.5 text-xs font-bold ${col.text} hover:opacity-80 transition-opacity`}
                  />
                </div>
                {destinations.length > 1 && (
                  <button onClick={() => removeDestination(code)} className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-end justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[10px] text-slate-400">Por día</p>
                  <p className={`text-base font-bold tabular-nums ${col.text}`}>{formatMoney(dailyLocal, code)} {code}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Total {days} días</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatMoney(totalLocal, code)} {code}</p>
                </div>
                {pastChange !== null && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">{pastLabel}</p>
                    <p className={`text-xs font-bold ${pastChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {pastChange >= 0 ? '+' : ''}{pastChange.toFixed(2)}%
                      <span className="text-[10px] font-normal text-slate-400 ml-1">
                        ({pastChange >= 0 ? '+' : ''}{formatMoney(dailyLocal - (pastDailyLocal ?? 0), code)} {code}/día)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {destinations.length < 3 && (
          <button
            onClick={addDestination}
            className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            + Agregar destino ({destinations.length}/3)
          </button>
        )}
      </div>
    </div>
  )
}
