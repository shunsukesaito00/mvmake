import { describe, expect, it } from 'vitest'
import { armE2eExportFailOnce, armE2eExportFailOnChapter, maybeThrowE2eExportFailure } from './e2eExportFailure'

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

  it('armE2eExportFailOnChapter は指定章のみ失敗させる', () => {
    const original = globalThis.window
    const win = { __FABLE_E2E_EXPORT_FAIL_CHAPTER__: null as string | null }
    Object.defineProperty(globalThis, 'window', { value: win, configurable: true })

    try {
      armE2eExportFailOnChapter('新郎プロフィール')
      expect(() => maybeThrowE2eExportFailure('オープニング')).not.toThrow()
      expect(() => maybeThrowE2eExportFailure('新郎プロフィール')).toThrow('新郎プロフィール')
      expect(() => maybeThrowE2eExportFailure('新郎プロフィール')).not.toThrow()
    } finally {
      Object.defineProperty(globalThis, 'window', { value: original, configurable: true })
    }
  })
})
