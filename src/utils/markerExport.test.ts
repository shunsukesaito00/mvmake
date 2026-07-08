import { describe, expect, it } from 'vitest'
import { formatMarkerChapterRange, getMarkerChapterRanges } from './markerExport'

describe('markerExport', () => {
  const markers = [
    { id: 'm1', time: 0, label: 'オープニング' },
    { id: 'm2', time: 20, label: '新郎プロフィール' },
    { id: 'm3', time: 50, label: '新婦プロフィール' },
  ]

  it('連続マーカー間の章区間を返す', () => {
    const ranges = getMarkerChapterRanges(markers, 120)
    expect(ranges).toHaveLength(3)
    expect(ranges[0]).toMatchObject({ markerId: 'm1', start: 0, end: 20 })
    expect(ranges[1]).toMatchObject({ markerId: 'm2', start: 20, end: 50 })
    expect(ranges[2]).toMatchObject({ markerId: 'm3', start: 50, end: 120 })
  })

  it('章区間ラベルを整形する', () => {
    expect(formatMarkerChapterRange({ markerId: 'm2', label: '新郎プロフィール', start: 20, end: 50 }))
      .toBe('新郎プロフィール (20.0–50.0s)')
  })
})
