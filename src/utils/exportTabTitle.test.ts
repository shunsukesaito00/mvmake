import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flashExportTabTitle, getExportTabTitle, restoreExportTabTitle } from './exportTabTitle'

describe('exportTabTitle', () => {
  let focusListener: (() => void) | null
  let visibilityListener: (() => void) | null
  let doc: { title: string; hidden: boolean; addEventListener: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.useFakeTimers()
    focusListener = null
    visibilityListener = null
    doc = {
      title: 'FABLE',
      hidden: true,
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'visibilitychange') visibilityListener = listener
      }),
    }
    vi.stubGlobal('document', doc)
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'focus') focusListener = listener
      }),
    })
  })

  afterEach(() => {
    restoreExportTabTitle()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('outcome 別のタブタイトルを返す', () => {
    expect(getExportTabTitle('success')).toBe('✓ 書き出し完了')
    expect(getExportTabTitle('partial')).toBe('✓ 書き出し完了')
    expect(getExportTabTitle('failure')).toBe('! 書き出し失敗')
  })

  it('書き出し結果タイトルへ一時変更し、指定時間後に復元する', () => {
    expect(flashExportTabTitle('success', { restoreDelayMs: 1000 })).toBe(true)
    expect(doc.title).toBe('✓ 書き出し完了')
    vi.advanceTimersByTime(1000)
    expect(doc.title).toBe('FABLE')
  })

  it('フォーカス復帰で即復元する', () => {
    flashExportTabTitle('failure', { restoreDelayMs: 5000 })
    expect(doc.title).toBe('! 書き出し失敗')
    focusListener?.()
    expect(doc.title).toBe('FABLE')
  })

  it('表示復帰でも即復元する', () => {
    flashExportTabTitle('success', { restoreDelayMs: 5000 })
    doc.hidden = false
    visibilityListener?.()
    expect(doc.title).toBe('FABLE')
  })
})
