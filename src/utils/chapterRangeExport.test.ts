import { describe, expect, it } from 'vitest'
import {
  findChapterRangeByMarkerId,
  formatRangeExportSummary,
  getChapterRangeAudioSampleRange,
  isExportableChapterRange,
  MIN_RANGE_EXPORT_DURATION,
  resolveRangeExportParams,
} from './chapterRangeExport'

describe('chapterRangeExport', () => {
  const markers = [
    { id: 'm1', time: 0, label: 'オープニング' },
    { id: 'm2', time: 20, label: '新郎プロフィール' },
    { id: 'm3', time: 50, label: '新婦プロフィール' },
    { id: 'm4', time: 110, label: 'エンディング' },
  ]

  it('章区間の In/Out を解決する', () => {
    const range = findChapterRangeByMarkerId('m2', markers, 130)!
    const params = resolveRangeExportParams(range.start, range.end, 130)
    expect(params).toMatchObject({ startTime: 20, endTime: 50, duration: 30, isPartial: true })
  })

  it('先頭章は 0 から次マーカーまで', () => {
    const range = findChapterRangeByMarkerId('m1', markers, 130)!
    expect(range).toMatchObject({ start: 0, end: 20 })
    expect(isExportableChapterRange(range.start, range.end)).toBe(true)
  })

  it('末尾章は最終マーカーからプロジェクト末尾まで', () => {
    const range = findChapterRangeByMarkerId('m4', markers, 130)!
    expect(range).toMatchObject({ start: 110, end: 130, label: 'エンディング' })
  })

  it('極短章は書き出し不可', () => {
    const shortMarkers = [
      { id: 'a', time: 0, label: '空' },
      { id: 'b', time: 0.005, label: '本編' },
    ]
    const range = findChapterRangeByMarkerId('a', shortMarkers, 10)!
    expect(isExportableChapterRange(range.start, range.end)).toBe(false)
    expect(resolveRangeExportParams(range.start, range.end, 10)).toBeNull()
  })

  it('In のみ / Out のみでも部分書き出しとして解決する', () => {
    expect(resolveRangeExportParams(15, null, 100)).toMatchObject({
      startTime: 15,
      endTime: 100,
      duration: 85,
      isPartial: true,
    })
    expect(resolveRangeExportParams(null, 40, 100)).toMatchObject({
      startTime: 0,
      endTime: 40,
      duration: 40,
      isPartial: true,
    })
  })

  it('In/Out 未設定はフル尺書き出し', () => {
    expect(resolveRangeExportParams(null, null, 90)).toMatchObject({
      startTime: 0,
      endTime: 90,
      duration: 90,
      isPartial: false,
    })
  })

  it('章境界のオーディオサンプル範囲が exporter と一致する', () => {
    const params = resolveRangeExportParams(20, 50, 130)!
    const { audioSampleOffset, audioEndSample } = getChapterRangeAudioSampleRange(params, 48_000, 10_000_000)
    expect(audioSampleOffset).toBe(960_000)
    expect(audioEndSample).toBe(2_400_000)
  })

  it('formatRangeExportSummary は In/Out 表示を整形する', () => {
    expect(formatRangeExportSummary(20, 50)).toBe('書き出し範囲: 20.0–50.0s')
    expect(formatRangeExportSummary(null, 40)).toContain('—')
  })

  it('MIN_RANGE_EXPORT_DURATION 境界', () => {
    expect(isExportableChapterRange(0, MIN_RANGE_EXPORT_DURATION, MIN_RANGE_EXPORT_DURATION)).toBe(true)
    expect(isExportableChapterRange(0, MIN_RANGE_EXPORT_DURATION - 0.001, MIN_RANGE_EXPORT_DURATION)).toBe(false)
  })
})
