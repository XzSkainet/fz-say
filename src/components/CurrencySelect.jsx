import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CURRENCIES } from '../data/currencies'
import { getCurrencyName } from '../i18n'

export default function CurrencySelect({
  value,
  onChange,
  exclude = [],
  triggerClassName,
  dropdownAlign = 'left',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  const excludeList = Array.isArray(exclude) ? exclude : [exclude].filter(Boolean)
  const currencies = CURRENCIES.filter(c => !excludeList.includes(c.code))
  const filtered = search
    ? currencies.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        getCurrencyName(c.code).toLowerCase().includes(search.toLowerCase())
      )
    : currencies

  const selected = CURRENCIES.find(c => c.code === value)

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: dropdownAlign === 'right'
        ? Math.max(4, rect.right - 240)
        : Math.min(rect.left, window.innerWidth - 244),
    })
  }, [dropdownAlign])

  const handleToggle = () => {
    calcPos()
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target)
      const inDropdown = dropdownRef.current?.contains(e.target)
      if (!inTrigger && !inDropdown) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const defaultTrigger =
    'flex items-center gap-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-white hover:border-blue-400 dark:hover:border-blue-600 transition-colors'

  const dropdown = open && (
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 240 }}
      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 rounded-lg px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar moneda..."
            className="bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none flex-1 w-0 min-w-0"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto overscroll-contain">
        {filtered.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
              c.code === value ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
              <img src={`https://flagcdn.com/w20/${c.country}.png`} alt={c.code} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-10 flex-shrink-0">{c.code}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{getCurrencyName(c.code)}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">Sin resultados</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={triggerClassName ?? defaultTrigger}
      >
        {selected && (
          <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 flex-shrink-0">
            <img src={`https://flagcdn.com/w20/${selected.country}.png`} alt={selected.code} className="w-full h-full object-cover" />
          </div>
        )}
        <span>{value}</span>
        <svg className={`w-3 h-3 opacity-60 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {createPortal(dropdown, document.body)}
    </div>
  )
}
