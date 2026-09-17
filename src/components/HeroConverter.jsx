import { useState } from 'react'
import { CURRENCIES } from '../data/currencies'
import CurrencySelect from './CurrencySelect'

const INNER_TRIGGER =
  'flex items-center gap-1.5 text-sm font-bold text-white px-3 py-2.5 hover:bg-white/10 rounded-r-xl transition-colors border-l border-white/15 flex-shrink-0'

const formatResult = (value, code) => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  const big = ['JPY', 'KRW', 'IDR', 'ISK', 'HUF']
  const decimals = big.includes(code) || value >= 100 ? 2 : 4
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function HeroConverter({ rates, baseCurrency }) {
  const [amount, setAmount] = useState('1000')
  const [from, setFrom] = useState(baseCurrency)
  const [to, setTo] = useState('EUR')

  const calculate = () => {
    const amt = parseFloat(amount)
    if (!amt || isNaN(amt)) return null
    if (from === to) return amt
    if (from === baseCurrency) return amt * (rates[to] ?? 0)
    if (to === baseCurrency) return rates[from] ? amt / rates[from] : null
    return rates[from] ? (amt / rates[from]) * (rates[to] ?? 0) : null
  }

  const result = calculate()
  const fromCurr = CURRENCIES.find(c => c.code === from)
  const fromSymbol = fromCurr?.symbol ?? from

  const unitRate = from === to ? 1
    : from === baseCurrency ? (rates[to] ?? 0)
    : to === baseCurrency ? (rates[from] ? 1 / rates[from] : 0)
    : (rates[from] && rates[to] ? rates[to] / rates[from] : 0)

  const handleSwap = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mt-6">
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">Conversor rápido</p>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">

        {/* From: cantidad + moneda */}
        <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden">
          <span className="pl-3 text-white/50 text-sm flex-shrink-0 select-none">{fromSymbol}</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-transparent flex-1 text-white font-bold focus:outline-none w-0 min-w-0 tabular-nums text-base px-2 py-2.5 placeholder-white/30"
            placeholder="1000"
            min="0"
          />
          <CurrencySelect
            value={from}
            onChange={setFrom}
            exclude={to}
            triggerClassName={INNER_TRIGGER}
          />
        </div>

        {/* Swap */}
        <button
          type="button"
          onClick={handleSwap}
          className="px-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors text-white flex-shrink-0 flex items-center"
          title="Intercambiar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>

        {/* To: resultado + moneda */}
        <div className="flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden">
          <span className="pl-3 flex-1 text-white font-bold text-base tabular-nums w-0 min-w-0 truncate py-2.5">
            {result !== null ? formatResult(result, to) : '—'}
          </span>
          <CurrencySelect
            value={to}
            onChange={setTo}
            exclude={from}
            triggerClassName={INNER_TRIGGER}
            dropdownAlign="right"
          />
        </div>
      </div>

      <p className="text-white/30 text-[11px] mt-2.5">
        1 {from} = {formatResult(unitRate, to)} {to} · Datos del BCE
      </p>
    </div>
  )
}
