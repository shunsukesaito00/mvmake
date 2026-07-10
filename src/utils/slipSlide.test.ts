import { describe, expect, it } from 'vitest'
import type { AudioClip, Clip, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR } from '../types/project'
import {
  canSlideClip,
  canSlipClip,
  computeSlipClip,
  findAdjacentClips,
  slideClipOnTrack,
  slideClipsFromSnapshot,
} from './slipSlide'

const mediaAssets = [{ id: 'm1', duration: 30 }]

const baseVideoClip: VideoClip = {
  id: 'v1',
  type: 'video',
  trackId: 't1',
  mediaId: 'm1',
  startTime: 0,
  duration: 5,
  sourceStart: 0,
  sourceDuration: 5,
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
  audio: { ...DEFAULT_AUDIO },
  speed: 1,
  color: { ...DEFAULT_COLOR },
  crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
  fadeIn: 0,
  fadeOut: 0,
}

const baseAudioClip: AudioClip = {
  id: 'a1',
  type: 'audio',
  trackId: 't2',
  mediaId: 'm1',
  startTime: 0,
  duration: 5,
  sourceStart: 0,
  sourceDuration: 5,
  audio: { ...DEFAULT_AUDIO },
  speed: 1,
  ducking: { enabled: false, amount: 0.3, fade: 0.5 },
}

describe('canSlipClip', () => {
  it('returns true for video and audio', () => {
    expect(canSlipClip(baseVideoClip)).toBe(true)
    expect(canSlipClip(baseAudioClip)).toBe(true)
  })

  it('returns false for text', () => {
    expect(canSlipClip({
      ...baseVideoClip,
      id: 't1',
      type: 'text',
      text: { content: 'hi', fontFamily: 'sans', fontSize: 24, color: '#fff', strokeColor: '#000', strokeWidth: 0, shadowColor: '#000', shadowBlur: 0, textAlign: 'center', lineHeight: 1.2, verticalAlign: 'center', backgroundColor: '', backgroundPadding: 0, backgroundRadius: 0 },
      animation: { type: 'none', duration: 0 },
    } as Clip)).toBe(false)
  })
})

describe('computeSlipClip', () => {
  it('shifts sourceStart without changing timeline position', () => {
    const slipped = computeSlipClip({ ...baseVideoClip, sourceStart: 2 }, 1, mediaAssets)
    expect(slipped?.sourceStart).toBe(3)
    expect(slipped?.startTime).toBe(0)
    expect(slipped?.duration).toBe(5)
  })

  it('rejects slip before source head', () => {
    expect(computeSlipClip(baseVideoClip, -1, mediaAssets)).toBeNull()
  })

  it('rejects slip past source tail', () => {
    expect(computeSlipClip({ ...baseVideoClip, sourceStart: 26 }, 2, mediaAssets)).toBeNull()
  })

  it('works for audio with speed', () => {
    const slipped = computeSlipClip({ ...baseAudioClip, sourceStart: 5, speed: 2 }, 2, mediaAssets)
    expect(slipped?.sourceStart).toBe(7)
  })
})

describe('findAdjacentClips', () => {
  const clips: Clip[] = [
    { ...baseVideoClip, id: 'c1', startTime: 0, duration: 3 },
    { ...baseVideoClip, id: 'c2', startTime: 3, duration: 2 },
    { ...baseVideoClip, id: 'c3', startTime: 5, duration: 1 },
  ]

  it('finds touching prev and next', () => {
    const { prev, next } = findAdjacentClips(clips, 'c2')
    expect(prev?.id).toBe('c1')
    expect(next?.id).toBe('c3')
  })

  it('returns null next when gap exists', () => {
    const gapped: Clip[] = [
      { ...baseVideoClip, id: 'c1', startTime: 0, duration: 3 },
      { ...baseVideoClip, id: 'c2', startTime: 3, duration: 2 },
      { ...baseVideoClip, id: 'c3', startTime: 8, duration: 1 },
    ]
    const { next } = findAdjacentClips(gapped, 'c2')
    expect(next).toBeNull()
  })
})

describe('slideClipOnTrack', () => {
  const clips: Clip[] = [
    { ...baseVideoClip, id: 'c1', startTime: 0, duration: 4 },
    { ...baseVideoClip, id: 'c2', startTime: 4, duration: 2 },
    { ...baseVideoClip, id: 'c3', startTime: 6, duration: 3, sourceStart: 0 },
  ]

  it('slides selected clip right and adjusts neighbors', () => {
    const result = slideClipOnTrack(clips, 'c2', 1, mediaAssets)
    expect(result).not.toBeNull()
    const c1 = result!.find((c) => c.id === 'c1')!
    const c2 = result!.find((c) => c.id === 'c2')!
    const c3 = result!.find((c) => c.id === 'c3')!
    expect(c1.duration).toBe(5)
    expect(c2.startTime).toBe(5)
    expect(c2.duration).toBe(2)
    expect(c3.duration).toBe(2)
    expect(c3.sourceStart).toBe(1)
  })

  it('slides selected clip left', () => {
    const clips: Clip[] = [
      { ...baseVideoClip, id: 'c1', startTime: 0, duration: 4 },
      { ...baseVideoClip, id: 'c2', startTime: 4, duration: 2 },
      { ...baseVideoClip, id: 'c3', startTime: 6, duration: 3, sourceStart: 2 },
    ]
    const result = slideClipOnTrack(clips, 'c2', -1, mediaAssets)
    expect(result).not.toBeNull()
    const c1 = result!.find((c) => c.id === 'c1')!
    const c2 = result!.find((c) => c.id === 'c2')!
    const c3 = result!.find((c) => c.id === 'c3')!
    expect(c1.duration).toBe(3)
    expect(c2.startTime).toBe(3)
    expect(c3.duration).toBe(4)
    expect(c3.sourceStart).toBe(1)
  })

  it('returns null without both neighbors', () => {
    expect(slideClipOnTrack([clips[0]], 'c1', 1, mediaAssets)).toBeNull()
  })
})

describe('canSlideClip', () => {
  it('requires adjacent clips on both sides', () => {
    const clips: Clip[] = [
      { ...baseVideoClip, id: 'c1', startTime: 0, duration: 3 },
      { ...baseVideoClip, id: 'c2', startTime: 3, duration: 2 },
      { ...baseVideoClip, id: 'c3', startTime: 5, duration: 2 },
    ]
    expect(canSlideClip(clips, 'c2')).toBe(true)
    expect(canSlideClip(clips, 'c1')).toBe(false)
  })
})

describe('slideClipsFromSnapshot', () => {
  it('preserves selected clip duration', () => {
    const snapshot = {
      prev: { ...baseVideoClip, id: 'c1', startTime: 0, duration: 4 },
      selected: { ...baseVideoClip, id: 'c2', startTime: 4, duration: 2 },
      next: { ...baseVideoClip, id: 'c3', startTime: 6, duration: 3 },
    }
    const result = slideClipsFromSnapshot(snapshot, 0.5, mediaAssets)
    expect(result?.selected.duration).toBe(2)
  })
})
