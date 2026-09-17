import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { CURRENCIES, ISO_TO_CURRENCY } from '../data/currencies'
import { t, getCurrencyName } from '../i18n'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const getCountryColor = (geoId, changes, baseCurrency, darkMode) => {
  const iso = String(geoId).padStart(3, '0')
  const curr = ISO_TO_CURRENCY[iso]
  const neutral = darkMode ? '#1e293b' : '#e2e8f0'
  const base = darkMode ? '#334155' : '#bfdbfe'
  if (!curr) return neutral
  if (curr === baseCurrency) return base
  const change = changes[curr]
  if (change === undefined) return neutral
  const intensity = Math.min(Math.abs(change) / 2, 1)
  const alpha = 0.55 + intensity * 0.45
  if (darkMode) {
    return change >= 0
      ? `rgba(74, 222, 128, ${alpha})`
      : `rgba(248, 113, 113, ${alpha})`
  }
  return change >= 0 ? `rgba(22, 163, 74, ${alpha})` : `rgba(220, 38, 38, ${alpha})`
}

export default function WorldMap({ rates, changes, baseCurrency, darkMode, onSelect }) {
  const [tooltip, setTooltip] = useState(null)

  const topCountries = CURRENCIES
    .filter(c => c.code !== baseCurrency && rates[c.code])
    .slice(0, 8)

  const formatRate = (rate, code) => {
    if (!rate) return '—'
    if (rate >= 100) return rate.toFixed(2)
    return rate.toFixed(4)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('map.title')}</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 relative" style={{ height: 220 }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 100, center: [10, 20] }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup zoom={1} minZoom={1} maxZoom={4}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const iso = String(geo.id).padStart(3, '0')
                    const curr = ISO_TO_CURRENCY[iso]
                    const hasCurrency = curr && curr !== baseCurrency && rates[curr]
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(geo.id, changes, baseCurrency, darkMode)}
                        stroke={darkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={0.4}
                        style={{
                          default: { outline: 'none', cursor: hasCurrency ? 'pointer' : 'default' },
                          hover: { outline: 'none', opacity: 0.75 },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={(e) => {
                          if (curr && rates[curr]) {
                            setTooltip({ x: e.clientX, y: e.clientY, curr, rate: rates[curr], change: changes[curr] })
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => { if (curr && curr !== baseCurrency) onSelect(curr) }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {tooltip && (
            <div
              className="fixed z-50 bg-white dark:bg-slate-700 shadow-xl rounded-lg px-3 py-2 text-xs pointer-events-none border border-gray-100 dark:border-slate-600"
              style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
            >
              <div className="font-bold text-slate-800 dark:text-white">{tooltip.curr}</div>
              <div className="text-slate-500 dark:text-slate-300">{formatRate(tooltip.rate, tooltip.curr)} {baseCurrency}</div>
              {tooltip.change !== undefined && (
                <div className={tooltip.change >= 0 ? 'text-green-600' : 'text-red-500'}>
                  {tooltip.change >= 0 ? '▲' : '▼'} {Math.abs(tooltip.change).toFixed(2)}%
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-1 left-1 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-800/80 rounded px-2 py-1">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 opacity-70 inline-block" />{t('map.rises')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 opacity-70 inline-block" />{t('map.falls')}</span>
          </div>
        </div>

        <div className="w-full lg:w-56 flex-shrink-0 space-y-0.5 overflow-y-auto max-h-56 lg:max-h-none no-scrollbar">
          {topCountries.map(c => {
            const change = changes[c.code] ?? 0
            const isPos = change >= 0
            return (
              <button
                key={c.code}
                onClick={() => onSelect(c.code)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-slate-600">
                  <img src={`https://flagcdn.com/w20/${c.country}.png`} alt={c.code} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{c.code}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">{getCurrencyName(c.code)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums leading-tight">{formatRate(rates[c.code], c.code)}</p>
                  <p className={`text-[10px] font-bold tabular-nums leading-tight ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {isPos ? '+' : ''}{change.toFixed(2)}%
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
