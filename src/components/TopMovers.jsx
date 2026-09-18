import { CURRENCIES } from '../data/currencies'
import { getCurrencyName } from '../i18n'

const BIG = ['JPY', 'KRW', 'IDR', 'ISK', 'HUF']
const formatRate = (rate, code) => {
  if (!rate) return '—'
  if (BIG.includes(code) || rate >= 100) return rate.toFixed(2)
  return rate.toFixed(4)
}

const TopItem = ({ code, change, isGainer, rank, rates, onSelect }) => {
  const curr = CURRENCIES.find(c => c.code === code)
  const rate = rates[code]
  const isFirst = rank === 0

  if (isFirst) {
    return (
      <div
        onClick={() => onSelect(code)}
        className={`rounded-xl p-3 cursor-pointer overflow-hidden transition-all hover:scale-[1.02] active:scale-100 ${
          isGainer
            ? 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50'
            : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm flex-shrink-0">
              <img src={`https://flagcdn.com/w40/${curr?.country}.png`} alt={code} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{code}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{getCurrencyName(code)}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-1">
            <p className={`text-base sm:text-xl font-black tabular-nums leading-tight ${isGainer ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
            <p className="text-[10px] text-slate-400 tabular-nums">{formatRate(rate, code)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect(code)}
      className="flex items-center gap-2.5 px-1 py-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
    >
      <span className={`text-[10px] font-bold w-4 text-center flex-shrink-0 ${isGainer ? 'text-green-400' : 'text-red-400'}`}>
        #{rank + 1}
      </span>
      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
        <img src={`https://flagcdn.com/w20/${curr?.country}.png`} alt={code} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">{code}</span>
        <span className="text-[10px] text-slate-400 truncate hidden sm:block">{getCurrencyName(code)}</span>
      </div>
      <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${isGainer ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  )
}

const Panel = ({ items, isGainer, title, rates, onSelect }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
    <div className="flex items-center gap-1.5 mb-3">
      <span className={`w-2 h-2 rounded-full ${isGainer ? 'bg-green-400' : 'bg-red-400'}`} />
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
    </div>
    <div className="space-y-2">
      {items.map(([code, change], idx) => (
        <TopItem key={code} code={code} change={change} isGainer={isGainer} rank={idx} rates={rates} onSelect={onSelect} />
      ))}
    </div>
  </div>
)

export default function TopMovers({ changes, rates, baseCurrency, onSelect }) {
  const entries = Object.entries(changes)
    .filter(([code]) => code !== baseCurrency && rates[code])
    .sort(([, a], [, b]) => b - a)

  const gainers = entries.slice(0, 3)
  const losers = entries.slice(-3).reverse()

  if (!gainers.length || !losers.length) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Movimientos del día</h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">vs {baseCurrency}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Panel items={gainers} isGainer={true} title="Mayores subidas" rates={rates} onSelect={onSelect} />
        <Panel items={losers} isGainer={false} title="Mayores caídas" rates={rates} onSelect={onSelect} />
      </div>
    </div>
  )
}
