import type { ExportNotificationOutcome } from './exportNotification'

const TITLE_BY_OUTCOME: Record<ExportNotificationOutcome, string> = {
  success: '✓ 書き出し完了',
  partial: '✓ 書き出し完了',
  failure: '! 書き出し失敗',
}

const DEFAULT_RESTORE_DELAY_MS = 5000

let restoreTimer: ReturnType<typeof setTimeout> | null = null
let originalTitle: string | null = null

function clearRestoreTimer() {
  if (restoreTimer !== null) {
    clearTimeout(restoreTimer)
    restoreTimer = null
  }
}

export function getExportTabTitle(outcome: ExportNotificationOutcome): string {
  return TITLE_BY_OUTCOME[outcome]
}

export function restoreExportTabTitle(): boolean {
  if (typeof document === 'undefined' || originalTitle === null) return false
  clearRestoreTimer()
  document.title = originalTitle
  originalTitle = null
  return true
}

export function flashExportTabTitle(
  outcome: ExportNotificationOutcome,
  options?: { restoreDelayMs?: number },
): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false

  if (originalTitle === null) {
    originalTitle = document.title
  }

  document.title = getExportTabTitle(outcome)
  clearRestoreTimer()

  const restoreDelayMs = Math.max(0, options?.restoreDelayMs ?? DEFAULT_RESTORE_DELAY_MS)
  restoreTimer = setTimeout(() => {
    restoreExportTabTitle()
  }, restoreDelayMs)

  window.addEventListener('focus', restoreExportTabTitle, { once: true })
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restoreExportTabTitle()
  }, { once: true })

  return true
}
