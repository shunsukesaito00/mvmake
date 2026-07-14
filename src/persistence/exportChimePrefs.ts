const STORAGE_KEY = 'fable-export-completion-chime'

/** 書き出し完了時にチャイムを鳴らすか */
export function loadExportCompletionChimeEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return false
    return JSON.parse(raw) === true
  } catch {
    return false
  }
}

export function saveExportCompletionChimeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled === true))
  } catch {
    // ignore
  }
}

export function getExportCompletionChimeLabel(): string {
  return '書き出し完了チャイム'
}

export function getExportCompletionChimeHint(): string {
  return '成功・部分成功・失敗で短い音を鳴らします。タブの表示可否に関わらず鳴ります（通知は非アクティブ時のみ）。OS や端末のミュート時は聞こえません。'
}
