import { useState, useEffect } from 'react'
import { useCurrencyData } from './hooks/useCurrencyData'
import Header from './components/Header'
import GainersLosers from './components/GainersLosers'
import RegionFilter from './components/RegionFilter'
import CurrencyGrid from './components/CurrencyGrid'
import MarketWidget from './components/MarketWidget'
import WorldMap from './components/WorldMap'
import EvolutionChart from './components/EvolutionChart'
import CurrencyModal from './components/CurrencyModal'
import CurrencyCompare from './components/CurrencyCompare'
import FreelancerTracker from './components/FreelancerTracker'
import TripPlanner from './components/TripPlanner'
import HeroConverter from './components/HeroConverter'
import TopMovers from './components/TopMovers'
import Footer from './components/Footer'
import { t } from './i18n'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('fxzone-dark') === 'true'
  })
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedCurrency, setSelectedCurrency] = useState(null)

  const { rates, changes, sparklineData, lastUpdated, loading, error } = useCurrencyData(baseCurrency)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('fxzone-dark', darkMode)
  }, [darkMode])

  const handleSelectCurrency = (code) => setSelectedCurrency(code)
  const handleCloseModal = () => setSelectedCurrency(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Header
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        baseCurrency={baseCurrency}
        onChangeBase={setBaseCurrency}
        lastUpdated={lastUpdated}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-900">
        {/* Coloca tu banner en /public con el nombre: banner.png */}
        <img
          src="./banner.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/50 dark:bg-black/65" />

        <div className="relative z-10 text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-6">

            {/* Texto izquierda */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {t('hero.badge')}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
                {t('hero.title1')}{' '}
                <span className="text-blue-300">{t('hero.title2')}</span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg max-w-lg leading-relaxed">
                {t('hero.description')}
              </p>
              <HeroConverter rates={rates} baseCurrency={baseCurrency} />
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-white/60">
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> {t('hero.no_registration')}</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> {t('hero.no_ads')}</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> {t('hero.ecb_data')}</span>
                <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> {t('hero.currencies')}</span>
              </div>
            </div>

            {/* Widget derecha */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <MarketWidget
                rates={rates}
                changes={changes}
                sparklineData={sparklineData}
                baseCurrency={baseCurrency}
                onSelect={handleSelectCurrency}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Gainers / Losers */}
        {!loading && Object.keys(changes).length > 0 && (
          <GainersLosers changes={changes} baseCurrency={baseCurrency} />
        )}

        {/* Top movers del día */}
        {!loading && Object.keys(changes).length > 0 && (
          <TopMovers
            changes={changes}
            rates={rates}
            baseCurrency={baseCurrency}
            onSelect={handleSelectCurrency}
          />
        )}

        {/* Grid de monedas */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                  {t('section.title')}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Clic en cualquier moneda para ver historial, estadísticas y conversor</p>
              </div>
            </div>
            <RegionFilter selected={selectedRegion} onSelect={setSelectedRegion} />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-pulse h-[188px] flex flex-col">
                  <div className="px-3 pt-3 pb-2 space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded w-8" />
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-20" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                      <div className="h-3.5 bg-gray-100 dark:bg-slate-700 rounded w-10" />
                    </div>
                  </div>
                  <div className="h-[46px] bg-gray-50 dark:bg-slate-900/50" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500 dark:text-red-400">
              <p className="text-lg font-semibold mb-2">No se pudieron cargar los datos</p>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          ) : (
            <CurrencyGrid
              rates={rates}
              changes={changes}
              sparklineData={sparklineData}
              baseCurrency={baseCurrency}
              selectedRegion={selectedRegion}
              onSelect={handleSelectCurrency}
            />
          )}
        </section>

        {/* Mapa + Gráfica evolución */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorldMap
            rates={rates}
            changes={changes}
            baseCurrency={baseCurrency}
            darkMode={darkMode}
            onSelect={handleSelectCurrency}
          />
          <EvolutionChart
            baseCurrency={baseCurrency}
            initialSparkline={sparklineData}
            rates={rates}
            changes={changes}
          />
        </section>

        {/* Herramientas */}
        <section className="rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/40 p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Herramientas</h2>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-7">Compara divisas, calcula ingresos y planifica tu viaje sin crear una cuenta</p>
          </div>

          <CurrencyCompare
            rates={rates}
            changes={changes}
            baseCurrency={baseCurrency}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FreelancerTracker
              baseCurrency={baseCurrency}
              rates={rates}
            />
            <TripPlanner
              baseCurrency={baseCurrency}
              rates={rates}
              sparklineData={sparklineData}
            />
          </div>
        </section>
      </main>

      <Footer lastUpdated={lastUpdated} />

      {/* Modal */}
      {selectedCurrency && (
        <CurrencyModal
          currencyCode={selectedCurrency}
          rates={rates}
          changes={changes}
          sparklineData={sparklineData}
          baseCurrency={baseCurrency}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
