import { t, getLang } from '../i18n'

const BASE_OPTIONS = ['USD', 'EUR', 'GBP', 'JPY']

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

export default function Header({ darkMode, onToggleDark, baseCurrency, onChangeBase, lastUpdated }) {
  const lang = getLang()
  const timeStr = lastUpdated
    ? new Date(lastUpdated + 'T00:00:00').toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' })
    : '...'

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="./logo.png" alt="FZ Say" className="w-8 h-8" />
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">FZ Say</span>
            <span className="hidden sm:inline text-sm text-slate-400 ml-2">{t('header.tagline')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{t('header.updated')} · {timeStr}</span>
          </div>

          <select
            value={baseCurrency}
            onChange={e => onChangeBase(e.target.value)}
            className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {BASE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{t('header.base')}: {opt}</option>
            ))}
          </select>

          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  )
}
