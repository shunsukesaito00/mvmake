import { describe, expect, it } from 'vitest'
import {
  collectBatchTransitionClipIds,
  collectBatchTransitionRemovalClipIds,
  formatBatchTransitionSummary,
  formatBatchTransitionRemovalSummary,
  getAdjacentTransitionTargets,
} from './batchTransition'
import type { ImageClip, Track, VideoClip } from '../types/project'
import { DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE } from '../types/project'

function imageClip(id: string, startTime: number, duration: number): ImageClip {
  return {
    id,
    trackId: 'track-v1',
    type: 'image',
    mediaId: 'img1',
    startTime,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
  }
}

function makeVideoTrack(clips: (VideoClip | ImageClip)[]): Track {
  return {
    id: 'track-v1',
    name: '映像 1',
    type: 'video',
    clips,
    muted: false,
    locked: false,
  }
}

describe('batchTransition', () => {
  it('隣接する2枚目以降のクリップ ID を返す', () => {
    const track = makeVideoTrack([
      imageClip('c1', 0, 4),
      imageClip('c2', 4, 4),
      imageClip('c3', 12, 4),
    ])
    expect(getAdjacentTransitionTargets(track)).toEqual(['c2'])
  })

  it('連続21枚は20件がトランジション対象', () => {
    const clips = Array.from({ length: 21 }, (_, i) => imageClip(`c${i}`, i * 3, 3))
    const track = makeVideoTrack(clips)
    expect(getAdjacentTransitionTargets(track)).toHaveLength(20)
  })

  it('隙間が許容値超なら隣接とみなさない', () => {
    const track = makeVideoTrack([
      imageClip('c1', 0, 4),
      imageClip('c2', 4.06, 4),
    ])
    expect(getAdjacentTransitionTargets(track)).toEqual([])
  })

  it('隙間が許容値内なら隣接とみなす', () => {
    const track = makeVideoTrack([
      imageClip('c1', 0, 4),
      imageClip('c2', 4.04, 4),
    ])
    expect(getAdjacentTransitionTargets(track)).toEqual(['c2'])
  })

  it('collectBatchTransitionClipIds で全映像トラックを対象にする', () => {
    const tracks: Track[] = [
      makeVideoTrack([imageClip('a1', 0, 3), imageClip('a2', 3, 3)]),
      { id: 'track-v2', name: '映像 2', type: 'video', clips: [imageClip('b1', 0, 2), imageClip('b2', 2, 2)], muted: false, locked: false },
      { id: 'track-text', name: 'Text', type: 'text', clips: [], muted: false, locked: false },
    ]
    tracks[1].clips.forEach((c) => { c.trackId = 'track-v2' })
    expect(collectBatchTransitionClipIds(tracks, 'all-video-tracks')).toEqual(['a2', 'b2'])
  })

  it('selected-track スコープで指定トラックのみ', () => {
    const tracks: Track[] = [
      makeVideoTrack([imageClip('a1', 0, 3), imageClip('a2', 3, 3)]),
      { id: 'track-v2', name: '映像 2', type: 'video', clips: [imageClip('b1', 0, 2), imageClip('b2', 2, 2)], muted: false, locked: false },
    ]
    tracks[1].clips.forEach((c) => { c.trackId = 'track-v2' })
    expect(collectBatchTransitionClipIds(tracks, 'selected-track', 'track-v2')).toEqual(['b2'])
  })

  it('formatBatchTransitionSummary', () => {
    expect(formatBatchTransitionSummary(3, 'クロスフェード')).toContain('3件')
  })

  it('collectBatchTransitionRemovalClipIds はトランジション付きクリップのみ返す', () => {
    const c1 = imageClip('a1', 0, 3)
    const c2 = { ...imageClip('a2', 3, 3), transition: { type: 'crossfade' as const, duration: 0.8 } }
    const c3 = { ...imageClip('a3', 8, 3), transition: { type: 'wipe' as const, duration: 0.5 } }
    const tracks: Track[] = [
      makeVideoTrack([c1, c2, c3]),
      { id: 'track-v2', name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
    ]
    expect(collectBatchTransitionRemovalClipIds(tracks, 'all-video-tracks')).toEqual(['a2', 'a3'])
  })

  it('formatBatchTransitionRemovalSummary', () => {
    expect(formatBatchTransitionRemovalSummary(2)).toBe('2件のクリップからトランジションを一括削除しました')
  })
})
