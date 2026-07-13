declare global {
  interface Window {
    __FABLE_E2E_EXPORT_FAIL_ONCE__?: boolean
    __FABLE_E2E_EXPORT_FAIL_CHAPTER__?: string | null
  }
}

/** E2E 用: 次の exportProject 呼び出し 1 回だけ失敗させる */
export function armE2eExportFailOnce(): void {
  if (typeof window === 'undefined') return
  window.__FABLE_E2E_EXPORT_FAIL_ONCE__ = true
}

/** E2E 用: 指定ラベルの章書き出しを失敗させる */
export function armE2eExportFailOnChapter(label: string): void {
  if (typeof window === 'undefined') return
  window.__FABLE_E2E_EXPORT_FAIL_CHAPTER__ = label
}

export function clearE2eExportFailureHooks(): void {
  if (typeof window === 'undefined') return
  window.__FABLE_E2E_EXPORT_FAIL_ONCE__ = false
  window.__FABLE_E2E_EXPORT_FAIL_CHAPTER__ = null
}

export function maybeThrowE2eExportFailure(chapterLabel?: string): void {
  if (typeof window === 'undefined') return
  if (window.__FABLE_E2E_EXPORT_FAIL_ONCE__) {
    window.__FABLE_E2E_EXPORT_FAIL_ONCE__ = false
    throw new Error('E2E 用の書き出し失敗シミュレーション')
  }
  if (chapterLabel && window.__FABLE_E2E_EXPORT_FAIL_CHAPTER__ === chapterLabel) {
    window.__FABLE_E2E_EXPORT_FAIL_CHAPTER__ = null
    throw new Error(`E2E 用の章書き出し失敗シミュレーション: ${chapterLabel}`)
  }
}
