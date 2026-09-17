import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts'

const FEATURED_PAIRS = ['EUR', 'USD', 'GBP', 'JPY']

export default function MarketWidget({ rates, changes, sparklineData, baseCurrency, onSelect }) {
  const featuredCode = FEATURED_PAIRS.find(c => c !== baseCurrency) ?? 'EUR'
  const rate = rates?.[featuredCode]
  const change = changes?.[featuredCode] ?? 0
  const isPos = change >= 0
  const sparkline = sparklineData?.[featuredCode] ?? []

  const rateValues = sparkline.map(d => d.rate).filter(Boolean)
  const minR = rateValues.length ? Math.min(...rateValues) : 0
  const maxR = rateValues.length ? Math.max(...rateValues) : 1
  const pad = Math.max((maxR - minR) * 0.4, minR * 0.0008)

  const trendUp = rateValues.length >= 2
    ? rateValues[rateValues.length - 1] >= rateValues[0]
    : isPos
  const sparkColor = trendUp ? '#4ade80' : '#f87171'

  return (
    <div
      className="bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl text-white cursor-pointer hover:bg-white/[0.15] transition-all duration-200 overflow-hidden"
      onClick={() => rate && onSelect(featuredCode)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm text-blue-100/80 font-medium">Par de referencia</span>
          </div>
          <span className="text-xs text-blue-200/50 bg-white/10 px-2 py-0.5 rounded-full">
            {baseCurrency}/{featuredCode}
          </span>
        </div>

        {/* Tasa */}
        <div className="mb-3">
          <p className="text-4xl font-extrabold tabular-nums tracking-tight">
            {rate ? rate.toFixed(4) : '—'}
          </p>
          <p className="text-sm text-blue-200/60 mt-1">
            1 {baseCurrency} = {rate ? rate.toFixed(4) : '—'} {featuredCode}
          </p>
        </div>

        {/* Badge cambio */}
        <div className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${
          isPos
            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
            : 'bg-red-500/20 text-red-300 border border-red-400/30'
        }`}>
          {isPos ? '▲' : '▼'} {isPos ? '+' : ''}{change.toFixed(2)}%
          <span className="text-white/40 font-normal">últimas 24h</span>
        </div>
      </div>

      {/* Sparkline edge-to-edge con dominio relativo */}
      {rateValues.length > 1 && (
        <ResponsiveContainer width="100%" height={72}>
          <AreaChart data={sparkline} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mw-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={[minR - pad, maxR + pad]} hide />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={sparkColor}
              strokeWidth={2}
              fill="url(#mw-grad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
