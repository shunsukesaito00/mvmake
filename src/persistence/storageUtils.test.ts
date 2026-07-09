import { describe, expect, it } from 'vitest'
import type { Project } from '../types/project'
import {
  estimateProjectStorageBytes,
  formatStorageError,
  formatStorageUsageLabel,
  isQuotaExceededError,
} from './storageUtils'

function projectWithMediaSizes(sizes: number[]): Project {
  return {
    id: 'p1',
    name: 'Test',
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [],
    markers: [],
    mediaAssets: sizes.map((size, i) => ({
      id: `m${i}`,
      name: `file-${i}`,
      type: 'image',
      blob: new Blob([new Uint8Array(size)]),
      url: `blob:m${i}`,
      duration: 5,
    })),
  }
}

describe('storageUtils', () => {
  it('estimateProjectStorageBytes はメディア Blob サイズの合計を返す', () => {
    expect(estimateProjectStorageBytes(projectWithMediaSizes([100, 200]))).toBe(300)
  })

  it('isQuotaExceededError は QuotaExceededError を検出する', () => {
    expect(isQuotaExceededError({ name: 'QuotaExceededError' })).toBe(true)
    expect(isQuotaExceededError(new DOMException('quota', 'QuotaExceededError'))).toBe(true)
    expect(isQuotaExceededError(new Error('normal'))).toBe(false)
  })

  it('formatStorageError は容量不足メッセージを返す', () => {
    expect(formatStorageError({ name: 'QuotaExceededError' })).toContain('保存容量が不足')
  })

  it('formatStorageUsageLabel は使用率付きラベルを返す', () => {
    expect(formatStorageUsageLabel({ usage: 50_000_000, quota: 100_000_000 })).toContain('50%')
  })
})
