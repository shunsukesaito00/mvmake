import { describe, expect, it } from 'vitest'
import {
  buildChapterExportEntries,
  formatBatchExportSummary,
  sanitizeFileBase,
} from './chapterBatchExport'
import type { MarkerChapterRange } from './markerExport'

describe('chapterBatchExport', () => {
  const chapters: MarkerChapterRange[] = [
    { markerId: 'm1', label: 'オープニング', start: 0, end: 20 },
    { markerId: 'm2', label: '新郎プロフィール', start: 20, end: 50 },
    { markerId: 'm3', label: '新婦プロフィール', start: 50, end: 120 },
  ]

  it('sanitizeFileBase は unsafe 文字を置換する', () => {
    expect(sanitizeFileBase('新郎/新婦:紹介')).toBe('新郎_新婦_紹介')
    expect(sanitizeFileBase('   ')).toBe('chapter')
  })

  it('buildChapterExportEntries で章ごとのファイル名と範囲を生成する', () => {
    const entries = buildChapterExportEntries('結婚式ムービー', chapters)
    expect(entries).toHaveLength(3)
    expect(entries[0]).toMatchObject({ label: 'オープニング', start: 0, duration: 20 })
    expect(entries[1].filename).toContain('02_新郎プロフィール.mp4')
    expect(entries[2].duration).toBe(70)
  })

  it('極短章は除外する', () => {
    const short: MarkerChapterRange[] = [
      { markerId: 'm1', label: '空', start: 0, end: 0.005 },
      { markerId: 'm2', label: '本編', start: 0.005, end: 10 },
    ]
    expect(buildChapterExportEntries('test', short)).toHaveLength(1)
  })

  it('formatBatchExportSummary に章数を含める', () => {
    expect(formatBatchExportSummary(5)).toContain('5 章')
  })
})
