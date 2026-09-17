import { useState } from 'react'
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts'
import NumberFlow from '@number-flow/react'
import { getCurrencyName } from '../i18n'

const BIG = ['JPY', 'KRW', 'IDR', 'ISK', 'HUF', 'ARS', 'CLP', 'COP']

const formatRate = (rate, code) => {
  if (!rate) return '—'
  if (BIG.includes(code) || rate >= 100) return rate.toFixed(2)
  return rate.toFixed(4)
}

const TrendUp = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)
const TrendDown = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
)
const CopyIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default function CurrencyCard({ currency, rate, change, sparkline, baseCurrency, onClick }) {
  const { code, country, symbol } = currency
  const name = getCurrencyName(code)
  const isPositive = change >= 0
  const [copied, setCopied] = useState(false)

  const rateValues = sparkline?.map(d => d.rate).filter(Boolean) ?? []
  const minR = rateValues.length ? Math.min(...rateValues) : 0
  const maxR = rateValues.length ? Math.max(...rateValues) : 1
  const pad = Math.max((maxR - minR) * 0.4, minR * 0.0008)

  const trendUp = rateValues.length >= 2
    ? rateValues[rateValues.length - 1] >= rateValues[0]
    : isPositive
  const sparkColor = trendUp ? '#16a34a' : '#dc2626'

  const periodChange = rateValues.length >= 2
    ? ((rateValues[rateValues.length - 1] - rateValues[0]) / rateValues[0]) * 100
    : null

  const rangePosition = rateValues.length >= 2 && rate && (maxR - minR) > 0
    ? Math.max(0, Math.min(1, (rate - minR) / (maxR - minR)))
    : null
  const nearMax = rangePosition !== null && rangePosition >= 0.80
  const nearMin = rangePosition !== null && rangePosition <= 0.20

  const handleCopy = (e) => {
    e.stopPropagation()
    if (!rate) return
    navigator.clipboard?.writeText(`1 ${baseCurrency} = ${formatRate(rate, code)} ${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUp = change > 0

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-[188px]"
    >
      {/* Franja elegante: glow difuso + línea nítida */}
      <div className={`absolute left-0 top-0 bottom-0 w-5 pointer-events-none ${
        isUp
          ? 'bg-gradient-to-r from-green-400/20 dark:from-green-400/15 to-transparent'
          : 'bg-gradient-to-r from-red-400/20 dark:from-red-400/15 to-transparent'
      }`} />
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b pointer-events-none ${
        isUp
          ? 'from-green-300/60 via-green-500 to-green-300/60'
          : 'from-red-300/60 via-red-500 to-red-300/60'
      }`} />

      {/* Contenido */}
      <div className="pl-4 pr-3 pt-3 pb-2 flex flex-col gap-2 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 dark:border-slate-600 bg-gray-100 dark:bg-slate-700">
            <img
              src={`https://flagcdn.com/w40/${country}.png`}
              alt={code}
              className="w-full h-full object-cover"
              onError={e => { e.target.parentElement.style.display = 'none' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">{code}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">{name}</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1">
            <span className={isPositive ? 'text-green-500 dark:text-green-400 trend-up-anim' : 'text-red-500 dark:text-red-400 trend-down-anim'}>
              {isPositive ? <TrendUp /> : <TrendDown />}
            </span>
            <button
              onClick={handleCopy}
              className={`p-0.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
                copied
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
              }`}
              title="Copiar tasa"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>

        {/* Tasa + badges */}
        <div>
          <p className="text-[17px] font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
            {rate
              ? <NumberFlow
                  value={rate}
                  format={{ minimumFractionDigits: BIG.includes(code) || rate >= 100 ? 2 : 4, maximumFractionDigits: BIG.includes(code) || rate >= 100 ? 2 : 4 }}
                  className="tabular-nums"
                />
              : '—'}
            {rate && <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-1">{symbol}</span>}
          </p>
          {rate && <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isPositive
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}% hoy
            </span>
            {periodChange !== null && (
              nearMax ? (
                <span className="text-[9px] font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/60 px-1 py-0.5 rounded">↑ máx 7D</span>
              ) : nearMin ? (
                <span className="text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1 py-0.5 rounded">↓ mín 7D</span>
              ) : (
                <span className={`text-[9px] font-semibold ${
                  periodChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'
                }`}>
                  {periodChange >= 0 ? '▲' : '▼'}{Math.abs(periodChange).toFixed(2)}% 7D
                </span>
              )
            )}
          </div>}
          {/* Barra de rango 7D */}
          {rate && rangePosition !== null && (
            <div className="mt-2">
              <div className="relative h-[3px] bg-gray-100 dark:bg-slate-700 rounded-full">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white/80 dark:border-slate-800 shadow-sm"
                  style={{
                    left: `${Math.max(8, Math.min(92, rangePosition * 100))}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: nearMax ? '#16a34a' : nearMin ? '#dc2626' : '#94a3b8',
                  }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[8px] text-slate-300 dark:text-slate-600 leading-none">mín</span>
                <span className="text-[8px] text-slate-300 dark:text-slate-600 leading-none">rango 7D</span>
                <span className="text-[8px] text-slate-300 dark:text-slate-600 leading-none">máx</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-auto">
        {rateValues.length > 1 ? (
          <ResponsiveContainer width="100%" height={46}>
            <AreaChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${code}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <YAxis domain={[minR - pad, maxR + pad]} hide />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#grad-${code})`}
                dot={false}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[46px] flex items-center px-4">
            <div className="w-full h-px bg-gray-100 dark:bg-slate-700" />
          </div>
        )}
      </div>
    </div>
  )
}
