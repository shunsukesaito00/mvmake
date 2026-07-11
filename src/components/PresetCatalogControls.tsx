import type { CatalogCategoryOption, CatalogFilterValue } from '../utils/presetCatalog'

interface Props {
  options: CatalogCategoryOption[]
  value: CatalogFilterValue
  onChange: (value: CatalogFilterValue) => void
  ariaLabel?: string
}

export function PresetCatalogControls({ options, value, onChange, ariaLabel = 'プリセット絞り込み' }: Props) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 transition-all ${
            value === option.value
              ? 'bg-accent-muted text-accent ring-accent/40'
              : 'bg-surface-3 text-text-secondary ring-border hover:ring-accent/30'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface FavoriteToggleProps {
  active: boolean
  label: string
  onToggle: () => void
}

export function PresetFavoriteToggle({ active, label, onToggle }: FavoriteToggleProps) {
  return (
    <button
      type="button"
      aria-label={active ? `${label}をよく使うから外す` : `${label}をよく使うに追加`}
      aria-pressed={active}
      title={active ? 'よく使うから外す' : 'よく使うに追加'}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs transition-colors ${
        active ? 'text-amber-400' : 'text-text-muted hover:bg-surface-4 hover:text-amber-300'
      }`}
    >
      {active ? '★' : '☆'}
    </button>
  )
}
