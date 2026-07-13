const STORAGE_KEY = 'fable-chapter-export-continue-on-error'

/** 章 ZIP 書き出しで失敗時に残り章を自動続行するか */
export function loadChapterExportContinueOnError(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return false
    const parsed = JSON.parse(raw)
    return parsed === true
  } catch {
    return false
  }
}

export function saveChapterExportContinueOnError(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled === true))
  } catch {
    // ignore quota / private mode
  }
}

export function getChapterExportContinueOnErrorLabel(): string {
  return '失敗時は自動でスキップして続行'
}

export function getChapterExportContinueOnErrorHint(): string {
  return 'オンにすると、章の失敗時に止まらず残り章を書き出します。完了後に成功章だけの ZIP と失敗サマリーを保存します。'
}
