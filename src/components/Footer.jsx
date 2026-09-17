import { t, getLang } from '../i18n'

export default function Footer({ lastUpdated }) {
  const lang = getLang()
  const timeStr = lastUpdated
    ? new Date(lastUpdated + 'T00:00:00').toLocaleDateString(lang, { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <footer className="mt-16 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">

      {/* Donación */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" x2="6" y1="2" y2="4" />
                <line x1="10" x2="10" y1="2" y2="4" />
                <line x1="14" x2="14" y1="2" y2="4" />
              </svg>
            </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('footer.donate_title')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('footer.donate_sub')}</p>
          </div>
        </div>
        <a
          href="https://paypal.me/xzskainet"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070ba] hover:bg-[#005ea6] text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex-shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
          </svg>
          {t('footer.donate_btn')}
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <img src="./logo.png" alt="FZ Say" className="w-5 h-5 opacity-60" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">FZ Say</span>
          <span>·</span>
          <span>{t('footer.tagline')}</span>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap justify-center">
          <span>{t('footer.last_update')}: {timeStr}</span>
          <span>·</span>
          <span>
            {t('footer.source')}: <a href="https://www.ecb.europa.eu" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">{t('footer.ecb_full')}</a> {t('footer.via')}
            {' · '}
            <a href="https://github.com/fawazahmed0/exchange-api" target="_blank" rel="noreferrer" className="hover:text-blue-500 transition-colors">currency-api</a> (LatAm)
          </span>
          <span>·</span>
          <span>{t('footer.indicative')}</span>
        </div>
      </div>
    </footer>
  )
}
