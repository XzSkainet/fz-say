import { useState, useCallback, useRef } from 'react'
import { CURRENCIES } from '../data/currencies'
import CurrencySelect from './CurrencySelect'

const STORAGE_KEY = 'fzsay-report-v1'
const BIG = ['JPY', 'KRW', 'IDR', 'ISK', 'HUF', 'ARS', 'CLP', 'COP']

const todayStr = () => new Date().toISOString().split('T')[0]

const fmtMoney = (v, code) => {
  if (v == null || isNaN(v)) return '—'
  const big = BIG.includes(code) || v >= 100
  return v.toLocaleString(undefined, { minimumFractionDigits: big ? 0 : 2, maximumFractionDigits: big ? 0 : 2 })
}

const fmtRate = (rate, code) => {
  if (!rate) return '—'
  return BIG.includes(code) || rate >= 100 ? rate.toFixed(2) : rate.toFixed(4)
}

const loadEntries = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw).map(e => ({ ...e, status: 'done', errorMsg: null }))
  } catch { return [] }
}

const persist = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(
      entries
        .filter(e => e.status === 'done')
        .map(({ status, errorMsg, ...rest }) => rest)
    ))
  } catch {}
}

const fetchWithTimeout = (url, ms = 10000) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

const fetchHistoricalRate = async (date, baseCurrency, incomeCurrency) => {
  if (baseCurrency === incomeCurrency) return 1
  const isSecondary = CURRENCIES.find(c => c.code === incomeCurrency)?.secondary ?? false

  if (isSecondary) {
    const b = baseCurrency.toLowerCase()
    const c = incomeCurrency.toLowerCase()
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${c}.json`,
      `https://${date}.currency-api.pages.dev/v1/currencies/${c}.json`,
    ]
    let data
    for (const url of urls) {
      try { const res = await fetchWithTimeout(url); if (res.ok) { data = await res.json(); break } } catch {}
    }
    if (!data) throw new Error('Fecha sin datos disponibles')
    const rate = data[c]?.[b]
    if (!rate) throw new Error('Moneda no disponible en esa fecha')
    return rate
  } else {
    const isToday = date === todayStr()
    const url = isToday
      ? `https://api.frankfurter.dev/v1/latest?from=${incomeCurrency}&to=${baseCurrency}`
      : `https://api.frankfurter.dev/v1/${date}?from=${incomeCurrency}&to=${baseCurrency}`
    try {
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error('Fecha sin datos disponibles')
      const data = await res.json()
      const rate = data.rates?.[baseCurrency]
      if (!rate) throw new Error('Datos no disponibles para esa fecha')
      return rate
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado — reintenta')
      throw err
    }
  }
}

export default function FreelancerReport({ baseCurrency }) {
  const [entries, setEntries] = useState(loadEntries)
  const [confirmClear, setConfirmClear] = useState(false)
  const [exporting, setExporting] = useState(false)
  const clearTimer = useRef(null)
  const baseSymbol = CURRENCIES.find(c => c.code === baseCurrency)?.symbol ?? ''
  const defaultIncome = baseCurrency === 'USD' ? 'EUR' : 'USD'

  const total = entries.filter(e => e.status === 'done' && e.baseAmount).reduce((s, e) => s + e.baseAmount, 0)
  const doneCount = entries.filter(e => e.status === 'done').length

  const addEntry = () => {
    setEntries(prev => [...prev, {
      id: Date.now(),
      date: todayStr(),
      amount: '1000',
      currency: defaultIncome,
      note: '',
      rate: null,
      baseAmount: null,
      status: 'idle',
      errorMsg: null,
    }])
  }

  const remove = (id) => {
    setEntries(prev => { const n = prev.filter(e => e.id !== id); persist(n); return n })
  }

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      clearTimer.current = setTimeout(() => setConfirmClear(false), 3000)
    } else {
      clearTimeout(clearTimer.current)
      setConfirmClear(false)
      setEntries([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const update = (id, field, value) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e
      const reset = ['date', 'currency'].includes(field)
        ? { rate: null, baseAmount: null, status: 'idle', errorMsg: null } : {}
      return { ...e, [field]: value, ...reset }
    }))
  }

  const fetchRate = useCallback(async (entry) => {
    const { id, date, amount, currency } = entry
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'loading', errorMsg: null } : e))
    try {
      const rate = await fetchHistoricalRate(date, baseCurrency, currency)
      const baseAmount = (parseFloat(amount) || 0) * rate
      setEntries(prev => {
        const next = prev.map(e => e.id === id ? { ...e, rate, baseAmount, status: 'done', errorMsg: null } : e)
        persist(next)
        return next
      })
    } catch (err) {
      setEntries(prev => prev.map(e => e.id === id
        ? { ...e, status: 'error', errorMsg: err.message, rate: null, baseAmount: null } : e))
    }
  }, [baseCurrency])

  const canFetch = (e) => parseFloat(e.amount) > 0 && e.date && e.date <= todayStr() && e.status !== 'loading'

  const exportXLSX = async () => {
    if (exporting) return
    setExporting(true)
    try {
    const done = entries.filter(e => e.status === 'done')
    const { default: writeXlsxFile } = await import('write-excel-file/browser')
    const dateNow = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })

    const B = { borderColor: '#E2E8F0', borderStyle: 'thin' }
    const BG = { topBorderColor: '#86EFAC', topBorderStyle: 'medium', bottomBorderColor: '#86EFAC', bottomBorderStyle: 'thin', leftBorderColor: '#86EFAC', leftBorderStyle: 'thin', rightBorderColor: '#86EFAC', rightBorderStyle: 'thin' }

    const TITLE  = { fontWeight: 'bold', fontSize: 15, color: '#FFFFFF', backgroundColor: '#1D4ED8', alignVertical: 'center' }
    const SUB    = { fontStyle: 'italic', fontSize: 9, color: '#3B82F6', backgroundColor: '#EFF6FF', alignVertical: 'center' }
    const HDR    = (align) => ({ fontWeight: 'bold', fontSize: 10, color: '#FFFFFF', backgroundColor: '#1E40AF', align, alignVertical: 'center', borderColor: '#1E40AF', borderStyle: 'thin' })
    const DT     = { fontSize: 10, color: '#475569', alignVertical: 'center', ...B }
    const NT     = { fontStyle: 'italic', fontSize: 10, color: '#94A3B8', alignVertical: 'center', ...B }
    const AM     = { fontWeight: 'bold', fontSize: 10, color: '#1E293B', align: 'right', alignVertical: 'center', format: '#,##0.00', ...B }
    const CU     = { fontWeight: 'bold', fontSize: 10, color: '#2563EB', align: 'center', alignVertical: 'center', ...B }
    const RT     = { fontSize: 9, color: '#94A3B8', align: 'right', alignVertical: 'center', format: '0.0000', ...B }
    const MN     = { fontWeight: 'bold', fontSize: 11, color: '#16A34A', backgroundColor: '#F0FDF4', align: 'right', alignVertical: 'center', format: '#,##0.00', ...B }
    const TLBL   = { fontWeight: 'bold', fontSize: 11, color: '#15803D', backgroundColor: '#DCFCE7', align: 'right', alignVertical: 'center', ...BG }
    const TTOTAL = { fontWeight: 'bold', fontSize: 14, color: '#15803D', backgroundColor: '#DCFCE7', align: 'right', alignVertical: 'center', format: '#,##0.00', ...BG }
    const FOOT   = { fontStyle: 'italic', fontSize: 8, color: '#CBD5E1', alignVertical: 'center' }

    const data = [
      [{ value: 'FZ Say — Registro de Cobros', span: 6, ...TITLE }],
      [{ value: `Generado el ${dateNow}  ·  Moneda base: ${baseCurrency}  ·  ${doneCount} cobro${doneCount !== 1 ? 's' : ''}`, span: 6, ...SUB }],
      [{ value: '' }],
      [
        { value: 'Fecha',                          ...HDR('left') },
        { value: 'Nota / Referencia',              ...HDR('left') },
        { value: 'Monto',                          ...HDR('right') },
        { value: 'Moneda',                         ...HDR('center') },
        { value: `Tasa (1 M = X ${baseCurrency})`, ...HDR('right') },
        { value: `En ${baseCurrency}`,             ...HDR('right') },
      ],
      ...done.map(e => [
        { value: e.date,                    type: String, ...DT },
        { value: e.note || '',              type: String, ...NT },
        { value: parseFloat(e.amount) || 0, type: Number, ...AM },
        { value: e.currency,                type: String, ...CU },
        { value: e.rate ?? 0,               type: Number, ...RT },
        { value: e.baseAmount ?? 0,         type: Number, ...MN },
      ]),
      [
        { value: `TOTAL — ${doneCount} cobro${doneCount !== 1 ? 's' : ''}`, span: 5, ...TLBL },
        { value: total, type: Number, ...TTOTAL },
      ],
      [{ value: '' }],
      [{ value: 'Tasas orientativas. Fuente: BCE (Frankfurter API) y currency-api para LatAm. FZ Say no es asesor financiero.', span: 6, ...FOOT }],
    ]

    await writeXlsxFile(data, {
      columns: [{ width: 12 }, { width: 28 }, { width: 12 }, { width: 8 }, { width: 22 }, { width: 16 }],
      rows: [
        { height: 38 }, { height: 20 }, { height: 8 }, { height: 26 },
        ...done.map(() => ({ height: 21 })),
        { height: 26 }, { height: 8 }, { height: 16 },
      ],
      fileName: `fzsay-cobros-${todayStr()}.xlsx`,
    })
    } catch (err) {
      console.error('Error exportando XLSX:', err)
    } finally {
      setExporting(false)
    }

  }

  const exportPDF = () => {
    const done = entries.filter(e => e.status === 'done')
    const rowsHTML = done.map(e => `
      <tr>
        <td>${e.date}</td>
        <td style="color:#64748b">${e.note || '—'}</td>
        <td style="text-align:right">${parseFloat(e.amount).toLocaleString()} <strong>${e.currency}</strong></td>
        <td style="text-align:right;font-size:12px;color:#64748b">${e.rate ? `1 ${e.currency} = ${fmtRate(e.rate, baseCurrency)} ${baseCurrency}` : '—'}</td>
        <td style="text-align:right;color:#16a34a;font-weight:700">${baseSymbol}${fmtMoney(e.baseAmount, baseCurrency)} ${baseCurrency}</td>
      </tr>`).join('')

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"><title>Cobros — FZ Say</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:860px;margin:0 auto}
        .logo{display:flex;align-items:center;gap:10px;margin-bottom:6px}
        .logo span{font-size:20px;font-weight:800;color:#1d4ed8}
        .meta{color:#94a3b8;font-size:12px;margin-bottom:28px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{background:#f8fafc;padding:10px 14px;text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0}
        td{padding:9px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
        .total-row td{border-top:2px solid #e2e8f0;font-weight:700;font-size:14px;background:#f0fdf4;color:#15803d}
        .footer{margin-top:24px;font-size:11px;color:#cbd5e1;border-top:1px solid #f1f5f9;padding-top:12px}
        @media print{body{padding:20px}}
      </style>
    </head><body>
      <div class="logo"><span>FZ Say — Registro de Cobros</span></div>
      <div class="meta">Generado el ${new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })} · Moneda base: ${baseCurrency}</div>
      <table>
        <thead><tr><th>Fecha</th><th>Nota</th><th>Cobro recibido</th><th>Tasa del día</th><th>En ${baseCurrency}</th></tr></thead>
        <tbody>
          ${rowsHTML}
          <tr class="total-row">
            <td colspan="4" style="text-align:right">TOTAL (${doneCount} cobros)</td>
            <td>${baseSymbol}${fmtMoney(total, baseCurrency)} ${baseCurrency}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Tasas orientativas. Fuente: BCE (Frankfurter API) y currency-api para monedas LatAm. FZ Say no es asesor financiero.</div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Registro de cobros</h2>
            <p className="text-[10px] text-slate-400">Historial de pagos con la tasa exacta del día — exportable para tu contador</p>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {doneCount > 0 && (
              <>
                <button
                  onClick={exportXLSX}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-60"
                >
                  {exporting ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
                    </svg>
                  )}
                  {exporting ? '...' : 'XLSX'}
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  PDF
                </button>
              </>
            )}
            <button
              onClick={handleClear}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                confirmClear
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'bg-transparent text-slate-400 dark:text-slate-500 hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 border-gray-200 dark:border-slate-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {confirmClear ? '¿Seguro?' : 'Limpiar'}
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Sin cobros registrados</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
              Agrega cada pago que recibes para llevar el registro con la tasa exacta del día
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers — desktop only */}
          <div className="hidden sm:grid gap-2 px-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
            style={{ gridTemplateColumns: '120px 1fr 1fr auto 28px' }}>
            <span>Fecha</span>
            <span>Monto · Moneda</span>
            <span>Nota (opcional)</span>
            <span>Resultado</span>
            <span />
          </div>

          {entries.map(entry => (
            <div
              key={entry.id}
              className={`rounded-xl border transition-all duration-200 ${
                entry.status === 'done'
                  ? 'border-green-100 dark:border-green-900/50 bg-green-50/40 dark:bg-green-950/10'
                  : entry.status === 'error'
                    ? 'border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10'
                    : entry.status === 'loading'
                      ? 'border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10'
                      : 'border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30'
              }`}
            >
              <div
                className="grid gap-2 p-3 items-center"
                style={{ gridTemplateColumns: '1fr' }}
              >
                {/* Mobile: stacked, Desktop: single row */}
                <div className="flex flex-col sm:grid sm:items-center gap-2"
                  style={{ gridTemplateColumns: '120px 1fr 1fr auto 28px' }}>

                  {/* Fecha */}
                  <input
                    type="date"
                    value={entry.date}
                    max={todayStr()}
                    onChange={e => update(entry.id, 'date', e.target.value)}
                    className="text-xs font-mono text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                  />

                  {/* Monto + Moneda */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-2 min-w-0">
                    <input
                      type="number"
                      value={entry.amount}
                      min="0"
                      onChange={e => update(entry.id, 'amount', e.target.value)}
                      className="bg-transparent flex-1 text-sm font-bold text-slate-800 dark:text-white focus:outline-none w-0 min-w-0 tabular-nums"
                      placeholder="1000"
                    />
                    <CurrencySelect
                      value={entry.currency}
                      onChange={v => update(entry.id, 'currency', v)}
                      exclude={baseCurrency}
                      triggerClassName="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex-shrink-0"
                      dropdownAlign="right"
                    />
                  </div>

                  {/* Nota */}
                  <input
                    type="text"
                    value={entry.note}
                    onChange={e => update(entry.id, 'note', e.target.value)}
                    placeholder="Cliente, factura..."
                    maxLength={60}
                    className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-300 dark:placeholder-slate-600 w-full"
                  />

                  {/* Resultado */}
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.status === 'idle' && (
                      <button
                        onClick={() => canFetch(entry) && fetchRate(entry)}
                        disabled={!canFetch(entry)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                          canFetch(entry)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Buscar tasa
                      </button>
                    )}

                    {entry.status === 'loading' && (
                      <div className="flex items-center gap-2 px-1">
                        <svg className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs text-blue-500 whitespace-nowrap">Buscando...</span>
                        <button
                          onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'idle', errorMsg: null } : e))}
                          className="text-[10px] text-slate-400 hover:text-red-400 transition-colors whitespace-nowrap"
                        >
                          cancelar
                        </button>
                      </div>
                    )}

                    {entry.status === 'done' && (
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-[10px] text-slate-400 leading-none whitespace-nowrap">
                          1 {entry.currency} = {fmtRate(entry.rate, baseCurrency)} {baseCurrency}
                        </p>
                        <p className="text-sm font-black text-green-600 dark:text-green-400 tabular-nums leading-tight whitespace-nowrap">
                          {baseSymbol}{fmtMoney(entry.baseAmount, baseCurrency)}
                          <span className="text-[10px] font-medium ml-1 text-green-500">{baseCurrency}</span>
                        </p>
                        <button
                          onClick={() => fetchRate(entry)}
                          className="text-[9px] text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          actualizar tasa
                        </button>
                      </div>
                    )}

                    {entry.status === 'error' && (
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] text-red-500 leading-tight max-w-[140px]">{entry.errorMsg}</p>
                        <button
                          onClick={() => canFetch(entry) && fetchRate(entry)}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => remove(entry.id)}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors self-center justify-self-center"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={addEntry}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-xs font-medium text-slate-400 hover:border-blue-300 hover:text-blue-500 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Agregar cobro
      </button>

      {/* Total */}
      {doneCount > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-slate-800/30 rounded-xl px-4 py-3.5 border border-blue-100 dark:border-blue-900/50">
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Total acumulado
            </p>
            <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-0.5">
              {doneCount} cobro{doneCount !== 1 ? 's' : ''} · tasas históricas del día exacto
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums leading-none">
              {baseSymbol}{fmtMoney(total, baseCurrency)}
            </p>
            <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mt-0.5">{baseCurrency}</p>
          </div>
        </div>
      )}
    </div>
  )
}
