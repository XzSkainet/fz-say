import { REGIONS } from '../data/currencies'
import { t } from '../i18n'

export default function RegionFilter({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
      {REGIONS.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            selected === r.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          {t(`regions.${r.id}`)}
        </button>
      ))}
    </div>
  )
}
