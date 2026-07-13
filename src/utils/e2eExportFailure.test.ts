import { describe, expect, it } from 'vitest'
import { armE2eExportFailOnce, maybeThrowE2eExportFailure } from './e2eExportFailure'

describe('e2eExportFailure', () => {
  it('armE2eExportFailOnce は次の 1 回だけ失敗させる', () => {
    const original = globalThis.window
    const win = { __FABLE_E2E_EXPORT_FAIL_ONCE__: false as boolean | undefined }
    Object.defineProperty(globalThis, 'window', { value: win, configurable: true })

    try {
      armE2eExportFailOnce()
      expect(() => maybeThrowE2eExportFailure()).toThrow('E2E 用の書き出し失敗シミュレーション')
      expect(() => maybeThrowE2eExportFailure()).not.toThrow()
    } finally {
      Object.defineProperty(globalThis, 'window', { value: original, configurable: true })
    }
  })
})
