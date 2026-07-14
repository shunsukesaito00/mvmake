const STORAGE_KEY = 'fable-export-completion-notification'

/** 書き出し完了時に Browser Notification を出すか */
export function loadExportCompletionNotificationEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return false
    return JSON.parse(raw) === true
  } catch {
    return false
  }
}

export function saveExportCompletionNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled === true))
  } catch {
    // ignore
  }
}

export function getExportCompletionNotificationLabel(): string {
  return '書き出し完了を通知する'
}

export function getExportCompletionNotificationHint(): string {
  return 'タブを見ていなくても、書き出しの成功・部分成功・失敗を OS 通知で知らせます。初回はブラウザの通知許可が必要です。'
}
