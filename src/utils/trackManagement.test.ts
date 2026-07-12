import { describe, expect, it } from 'vitest'
import type { Track } from '../types/project'
import {
  canRemoveTrack,
  countTracksByType,
  defaultTrackName,
  findTrackInsertIndex,
} from './trackManagement'
import {
  DEFAULT_TRACK_HEIGHT,
  clampTrackHeight,
  findTrackIndexAtY,
  resolveTrackHeights,
} from '../persistence/timelineTrackHeights'

function track(id: string, type: Track['type'], name: string, hasClip = false): Track {
  return {
    id,
    name,
    type,
    clips: hasClip ? [{ id: `${id}-clip` } as Track['clips'][number]] : [],
    muted: false,
    locked: false,
  }
}

describe('trackManagement', () => {
  const tracks: Track[] = [
    track('v1', 'video', '映像 1'),
    track('v2', 'video', '映像 2'),
    track('t1', 'text', 'テキスト'),
    track('a1', 'audio', 'BGM'),
  ]

  it('defaultTrackName は種別ごとに連番を付ける', () => {
    expect(defaultTrackName('video', tracks)).toBe('映像 3')
    expect(defaultTrackName('audio', tracks)).toBe('オーディオ 2')
  })

  it('canRemoveTrack はクリップあり・最小本数で拒否する', () => {
    expect(canRemoveTrack(tracks, 'missing')).toEqual({ ok: false, reason: 'not-found' })
    expect(canRemoveTrack(tracks, 'v2')).toEqual({ ok: true })
    expect(canRemoveTrack([track('only', 'video', '映像 1')], 'only')).toEqual({ ok: false, reason: 'min-count' })
    expect(canRemoveTrack([track('v3', 'video', '映像 3', true)], 'v3')).toEqual({ ok: false, reason: 'has-clips' })
  })

  it('findTrackInsertIndex は同種別の末尾に挿入する', () => {
    expect(findTrackInsertIndex(tracks, 'video')).toBe(2)
    expect(findTrackInsertIndex(tracks, 'audio')).toBe(4)
    expect(findTrackInsertIndex(tracks, 'video', 'v1')).toBe(1)
  })

  it('countTracksByType は種別ごとの本数を返す', () => {
    expect(countTracksByType(tracks, 'video')).toBe(2)
    expect(countTracksByType(tracks, 'text')).toBe(1)
  })
})

describe('timelineTrackHeights', () => {
  it('clampTrackHeight は範囲内に収める', () => {
    expect(clampTrackHeight(10)).toBe(32)
    expect(clampTrackHeight(200)).toBe(120)
    expect(clampTrackHeight(52)).toBe(52)
  })

  it('findTrackIndexAtY は可変高さでトラックを判定する', () => {
    const heights = [40, 60, 52]
    expect(findTrackIndexAtY(10, heights)).toBe(0)
    expect(findTrackIndexAtY(45, heights)).toBe(1)
    expect(findTrackIndexAtY(110, heights)).toBe(2)
    expect(findTrackIndexAtY(200, heights)).toBe(-1)
  })

  it('resolveTrackHeights は未設定トラックにデフォルト高さを使う', () => {
    const heights = resolveTrackHeights(['a', 'b'], { defaultHeight: DEFAULT_TRACK_HEIGHT, byTrackId: { a: 80 } })
    expect(heights).toEqual([80, DEFAULT_TRACK_HEIGHT])
  })
})
