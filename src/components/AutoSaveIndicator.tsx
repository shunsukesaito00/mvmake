import { useAutoSaveStore } from '../store/autosaveStore'

export function AutoSaveIndicator() {
  const status = useAutoSaveStore((s) => s.status)
  const mediaProgress = useAutoSaveStore((s) => s.mediaProgress)

  if (status === 'idle') return null

  const label =
    status === 'pending'
      ? '保存待ち...'
      : status === 'saving'
        ? mediaProgress
          ? `保存中 ${mediaProgress.current}/${mediaProgress.total}`
          : '保存中...'
        : status === 'saved'
          ? '保存済み'
          : '保存失敗'

  const className =
    status === 'error'
      ? 'text-red-400'
      : status === 'saved'
        ? 'text-emerald-400'
        : 'text-text-muted'

  return (
    <span
      aria-live="polite"
      aria-label={`自動保存: ${label}`}
      className={`hidden text-[10px] sm:inline ${className}`}
    >
      {label}
    </span>
  )
}
