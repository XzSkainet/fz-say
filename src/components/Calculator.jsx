import { useState, useMemo } from 'react'
import { CURRENCIES } from '../data/currencies'

const formatResult = (value) => {
  if (!value || isNaN(value)) return '—'
  if (value >= 1000) return value.toLocaleString('es', { maximumFractionDigits: 2 })
  if (value >= 1) return value.toFixed(4)
  return value.toFixed(6)
}

const Flag = ({ country }) => (
  <img
    src={`https://flagcdn.com/w40/${country}.png`}
    alt=""
    className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
    onError={e => { e.target.style.display = 'none' }}
  />
)

export default function Calculator({ rates, baseCurrency }) {
  const [amount, setAmount] = useState('100')
  const [fromCode, setFromCode] = useState(baseCurrency)
  const [toCode, setToCode] = useState('EUR')

  const allCurrencies = [
    { code: baseCurrency, ...CURRENCIES.find(c => c.code === baseCurrency) },
    ...CURRENCIES.filter(c => c.code !== baseCurrency),
  ]

  const getRateToBase = (code) => {
    if (code === baseCurrency) return 1
    return rates[code] ? 1 / rates[code] : null
  }

  const result = useMemo(() => {
    const num = parseFloat(amount)
    if (!num || isNaN(num)) return null
    const fromRate = getRateToBase(fromCode)
    const toRate = toCode === baseCurrency ? 1 : rates[toCode]
    if (!fromRate || !toRate) return null
    return num * fromRate * toRate
  }, [amount, fromCode, toCode, rates, baseCurrency])

  const unitRate = useMemo(() => {
    const fromRate = getRateToBase(fromCode)
    const toRate = toCode === baseCurrency ? 1 : rates[toCode]
    if (!fromRate || !toRate) return null
    return fromRate * toRate
  }, [fromCode, toCode, rates, baseCurrency])

  const swap = () => { setFromCode(toCode); setToCode(fromCode) }

  const fromCurr = CURRENCIES.find(c => c.code === fromCode)
  const toCurr = CURRENCIES.find(c => c.code === toCode)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-slate-800">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
        Calculadora de cambio
      </p>

      {/* FROM */}
      <div className="mb-1">
        <label className="text-xs text-slate-400 mb-1.5 block">De</label>
        <div className="flex items-center gap-3 border-2 border-gray-100 hover:border-blue-200 focus-within:border-blue-500 rounded-xl px-4 py-3 transition-colors bg-gray-50">
          {fromCurr && <Flag country={fromCurr.country} />}
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 font-bold text-xl focus:outline-none w-0 min-w-0 tabular-nums"
            placeholder="0"
            min="0"
          />
          <select
            value={fromCode}
            onChange={e => setFromCode(e.target.value)}
            className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-sm"
          >
            {allCurrencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {/* Swap */}
      <div className="flex justify-center my-3">
        <button
          onClick={swap}
          className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* TO */}
      <div className="mb-4">
        <label className="text-xs text-slate-400 mb-1.5 block">A</label>
        <div className="flex items-center gap-3 border-2 border-blue-100 rounded-xl px-4 py-3 bg-blue-50">
          {toCurr && <Flag country={toCurr.country} />}
          <span className="flex-1 text-blue-700 font-bold text-xl tabular-nums truncate">
            {result !== null ? formatResult(result) : rates[toCode] ? '...' : '—'}
          </span>
          <select
            value={toCode}
            onChange={e => setToCode(e.target.value)}
            className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer text-sm"
          >
            {allCurrencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {/* Tasa */}
      {unitRate !== null && (
        <div className="text-center text-xs text-slate-400 bg-gray-50 rounded-lg py-2 px-3">
          1 <span className="font-semibold text-slate-600">{fromCode}</span>
          {' = '}
          <span className="font-bold text-slate-800">{formatResult(unitRate)}</span>
          {' '}
          <span className="font-semibold text-slate-600">{toCode}</span>
        </div>
      )}
    </div>
  )
}
