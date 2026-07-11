import { describe, expect, it } from 'vitest'
import { ChapterBatchExportError } from './chapterBatchExport'
import {
  estimateExportEta,
  formatExportDuration,
  formatExportError,
  formatExportProgressLabel,
  isExportAbortError,
} from './exportUx'

describe('formatExportDuration', () => {
  it('秒のみを表示する', () => {
    expect(formatExportDuration(45)).toBe('45秒')
  })

  it('分と秒を表示する', () => {
    expect(formatExportDuration(125)).toBe('2分05秒')
  })
})

describe('estimateExportEta', () => {
  it('進捗が少ないときは計算中表示', () => {
    expect(estimateExportEta(0.02, 5000).label).toBe('残り時間を計算中…')
  })

  it('進捗から残り時間を推定する', () => {
    const eta = estimateExportEta(0.5, 10_000)
    expect(eta.remainingSeconds).toBe(10)
    expect(eta.label).toBe('残り約 10秒')
  })
})

describe('formatExportError', () => {
  it('AbortError をキャンセル表示にする', () => {
    const result = formatExportError(new DOMException('cancelled', 'AbortError'))
    expect(result.title).toBe('書き出しをキャンセルしました')
    expect(result.detail).toContain('中断')
  })

  it('Error メッセージを詳細に含める', () => {
    const result = formatExportError(new Error('メモリ不足'))
    expect(result.title).toBe('書き出しに失敗しました')
    expect(result.detail).toBe('メモリ不足')
  })

  it('一括書き出しの文脈を反映する', () => {
    const result = formatExportError(new Error('ZIP 失敗'), 'batch')
    expect(result.title).toBe('一括書き出しに失敗しました')
  })

  it('ChapterBatchExportError の章名を詳細に含める', () => {
    const err = new ChapterBatchExportError('新郎プロフィール', 1, 5, new Error('encode failed'))
    const result = formatExportError(err, 'batch')
    expect(result.title).toBe('一括書き出しに失敗しました')
    expect(result.detail).toContain('新郎プロフィール')
    expect(result.detail).toContain('2/5章目')
  })
})

describe('isExportAbortError', () => {
  it('AbortError を判定する', () => {
    expect(isExportAbortError(new DOMException('x', 'AbortError'))).toBe(true)
    expect(isExportAbortError(new Error('x'))).toBe(false)
  })
})

describe('formatExportProgressLabel', () => {
  it('進捗と ETA を結合する', () => {
    expect(formatExportProgressLabel(0.42, '残り約 30秒')).toBe('42% 完了 · 残り約 30秒')
  })
})
