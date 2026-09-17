import { translations } from './translations'

const SUPPORTED = ['en', 'es', 'pt', 'fr', 'de', 'zh', 'ja', 'ko']

let _lang = null

export const getLang = () => {
  if (!_lang) {
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
    _lang = SUPPORTED.includes(nav) ? nav : 'en'
  }
  return _lang
}

export const t = (key) => {
  const lang = getLang()
  const keys = key.split('.')
  let r = translations[lang]
  for (const k of keys) r = r?.[k]
  if (r !== undefined) return r
  let fb = translations['en']
  for (const k of keys) fb = fb?.[k]
  return fb ?? key
}

export const getCurrencyName = (code) => {
  try {
    const name = new Intl.DisplayNames([getLang()], { type: 'currency' }).of(code) ?? code
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return code
  }
}

export const fmtDateLocale = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00')
  const lang = getLang()
  if (days <= 32) return d.toLocaleDateString(lang, { day: '2-digit', month: 'short' })
  return d.toLocaleDateString(lang, { month: 'short', year: '2-digit' })
}
