declare global {
  interface Window {
    __FABLE_E2E_EXPORT_FAIL_ONCE__?: boolean
  }
}

/** E2E 用: 次の exportProject 呼び出し 1 回だけ失敗させる */
export function armE2eExportFailOnce(): void {
  if (typeof window === 'undefined') return
  window.__FABLE_E2E_EXPORT_FAIL_ONCE__ = true
}

export function maybeThrowE2eExportFailure(): void {
  if (typeof window === 'undefined' || !window.__FABLE_E2E_EXPORT_FAIL_ONCE__) return
  window.__FABLE_E2E_EXPORT_FAIL_ONCE__ = false
  throw new Error('E2E 用の書き出し失敗シミュレーション')
}
