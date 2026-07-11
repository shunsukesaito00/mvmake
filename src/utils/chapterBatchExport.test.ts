import { describe, expect, it } from 'vitest'
import {
  buildChapterExportEntries,
  ChapterBatchExportError,
  exportAllChaptersToZip,
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

  it('exportAllChaptersToZip は逐次処理で同時保持する Blob を 1 件までに抑える', async () => {
    const entries = buildChapterExportEntries('test', chapters)
    let held = 0
    let peakHeld = 0
    const zip = await exportAllChaptersToZip(
      async () => {
        held++
        peakHeld = Math.max(peakHeld, held)
        await new Promise((r) => setTimeout(r, 1))
        held--
        return new Blob([new Uint8Array([1, 2, 3])])
      },
      entries,
      () => {},
    )
    expect(peakHeld).toBe(1)
    expect(zip.type).toBe('application/zip')
  })

  it('章エクスポート失敗時は ChapterBatchExportError を投げる', async () => {
    const entries = buildChapterExportEntries('test', chapters)
    await expect(
      exportAllChaptersToZip(
        async (entry) => {
          if (entry.label === '新郎プロフィール') throw new Error('encode failed')
          return new Blob([new Uint8Array([1])])
        },
        entries,
        () => {},
      ),
    ).rejects.toBeInstanceOf(ChapterBatchExportError)
  })

  it('AbortSignal でキャンセルできる', async () => {
    const entries = buildChapterExportEntries('test', chapters)
    const controller = new AbortController()
    const promise = exportAllChaptersToZip(
      async () => {
        controller.abort()
        return new Blob([new Uint8Array([1])])
      },
      entries,
      () => {},
      controller.signal,
    )
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('空の entries はエラー', async () => {
    await expect(exportAllChaptersToZip(async () => new Blob(), [], () => {})).rejects.toThrow(
      '書き出し可能な章がありません',
    )
  })
})
