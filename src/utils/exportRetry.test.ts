import { describe, expect, it } from 'vitest'
import {
  getExportRetryButtonLabel,
  getExportRetryHint,
  isRetryableExportJob,
} from './exportRetry'

describe('exportRetry', () => {
  it('isRetryableExportJob はスナップショットの有無を判定する', () => {
    expect(isRetryableExportJob(null)).toBe(false)
    expect(isRetryableExportJob({
      mode: 'single',
      resolution: 'project',
      quality: 'standard',
    })).toBe(true)
  })

  it('getExportRetryButtonLabel はモード別ラベルを返す', () => {
    expect(getExportRetryButtonLabel('single')).toBe('同じ設定で再試行')
    expect(getExportRetryButtonLabel('batch')).toContain('章 ZIP')
    expect(getExportRetryButtonLabel('batch', 2)).toBe('失敗した 2 章のみ再試行')
    expect(getExportRetryButtonLabel('batch', 0, 3)).toBe('残りの章から再開')
    expect(getExportRetryButtonLabel('sns')).toContain('SNS')
  })

  it('getExportRetryHint はモード別の説明を返す', () => {
    expect(getExportRetryHint('single')).toContain('In/Out')
    expect(getExportRetryHint('batch', 1)).toContain('失敗した章')
    expect(getExportRetryHint('batch', 0, 2)).toContain('未完了の章')
    expect(getExportRetryHint('sns')).toContain('9:16')
  })
})
