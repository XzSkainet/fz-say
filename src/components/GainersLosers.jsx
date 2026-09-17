import { CURRENCIES } from '../data/currencies'
import { t } from '../i18n'

export default function GainersLosers({ changes, baseCurrency }) {
  const sorted = CURRENCIES
    .filter(c => c.code !== baseCurrency && changes[c.code] !== undefined)
    .map(c => ({ ...c, change: changes[c.code] }))
    .sort((a, b) => b.change - a.change)

  if (!sorted.length) return null

  const gainers = sorted.filter(c => c.change >= 0)
  const losers = [...sorted.filter(c => c.change < 0)].reverse()

  const items = [...gainers, null, ...losers]
  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm py-3">
      {/* Fade izquierda */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white dark:from-slate-800 to-transparent z-10" />
      {/* Fade derecha */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white dark:from-slate-800 to-transparent z-10" />

      <div className="flex animate-ticker w-max">
        {doubled.map((c, i) =>
          c === null ? (
            <div key={`sep-${i}`} className="flex items-center mx-4">
              <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />
            </div>
          ) : (
            <div
              key={`${c.code}-${i}`}
              className="flex items-center gap-1.5 mx-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap select-none cursor-default"
            >
              <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-600">
                <img src={`https://flagcdn.com/w20/${c.country}.png`} alt={c.code} className="w-full h-full object-cover" />
              </div>
              <span className="text-slate-700 dark:text-slate-200">{c.code}</span>
              <span className={c.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                {c.change > 0 ? '+' : ''}{c.change.toFixed(2)}%
              </span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
