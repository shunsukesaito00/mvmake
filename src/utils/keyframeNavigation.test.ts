import { describe, expect, it } from 'vitest'
import type { VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE } from '../types/project'
import { findAdjacentKeyframeNavEntry, listClipKeyframeNavEntries } from './keyframeNavigation'

const baseVideoClip: VideoClip = {
  id: 'v1',
  type: 'video',
  trackId: 't1',
  mediaId: 'm1',
  startTime: 0,
  duration: 10,
  sourceStart: 0,
  sourceDuration: 10,
  transform: { ...DEFAULT_TRANSFORM },
  transformKeyframes: [
    { id: 'tf1', time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    { id: 'tf2', time: 4, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
  ],
  audio: {
    ...DEFAULT_AUDIO,
    volumeKeyframes: [
      { id: 'vol1', time: 2, volume: 0.8 },
      { id: 'vol2', time: 5, volume: 1 },
    ],
  },
  speed: 1,
  speedKeyframes: [
    { id: 'sp1', time: 3, speed: 1.5 },
    { id: 'sp2', time: 6, speed: 2 },
  ],
  color: { ...DEFAULT_COLOR },
  crop: { ...DEFAULT_CROP },
  ...DEFAULT_VISUAL_FADE,
}

describe('listClipKeyframeNavEntries', () => {
  it('collects transform, volume, and speed keyframes sorted by time', () => {
    const entries = listClipKeyframeNavEntries(baseVideoClip)
    expect(entries.map((e) => e.time)).toEqual([1, 2, 3, 4, 5, 6])
    expect(entries.map((e) => e.type)).toEqual(['transform', 'volume', 'speed', 'transform', 'volume', 'speed'])
  })
})

describe('findAdjacentKeyframeNavEntry', () => {
  const entries = listClipKeyframeNavEntries(baseVideoClip)

  it('finds next keyframe after playhead', () => {
    expect(findAdjacentKeyframeNavEntry(entries, 0, 'next')?.id).toBe('tf1')
    expect(findAdjacentKeyframeNavEntry(entries, 1.5, 'next')?.id).toBe('vol1')
  })

  it('finds previous keyframe before playhead', () => {
    expect(findAdjacentKeyframeNavEntry(entries, 7, 'prev')?.id).toBe('sp2')
    expect(findAdjacentKeyframeNavEntry(entries, 2.5, 'prev')?.id).toBe('vol1')
  })

  it('steps within same-time selection using current keyframe id', () => {
    expect(findAdjacentKeyframeNavEntry(entries, 1, 'next', 'tf1')?.id).toBe('vol1')
    expect(findAdjacentKeyframeNavEntry(entries, 2, 'prev', 'vol1')?.id).toBe('tf1')
  })

  it('returns null when no further keyframe exists', () => {
    expect(findAdjacentKeyframeNavEntry(entries, 10, 'next')).toBeNull()
    expect(findAdjacentKeyframeNavEntry(entries, 0, 'prev')).toBeNull()
  })
})
