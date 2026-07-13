import { describe, expect, it } from 'vitest'
import type { Track, VideoClip } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import { findPreferredNarrationTrack, isVideoAudioAudible, isVideoAudioLinked } from './videoAudioLink'

const baseVideoClip: VideoClip = {
  id: 'c1',
  trackId: 't1',
  type: 'video',
  mediaId: 'v1',
  startTime: 0,
  duration: 5,
  sourceStart: 0,
  sourceDuration: 5,
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
  audio: { volume: 1, fadeIn: 0, fadeOut: 0 },
  speed: 1,
  color: { ...DEFAULT_COLOR },
  crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
  fadeIn: 0,
  fadeOut: 0,
}

describe('isVideoAudioLinked', () => {
  it('defaults to linked when audioLinked is omitted', () => {
    expect(isVideoAudioLinked(baseVideoClip)).toBe(true)
  })

  it('returns false when explicitly detached', () => {
    expect(isVideoAudioLinked({ ...baseVideoClip, audioLinked: false })).toBe(false)
  })
})

describe('isVideoAudioAudible', () => {
  it('is false when detached even with volume', () => {
    expect(isVideoAudioAudible({ ...baseVideoClip, audioLinked: false })).toBe(false)
  })

  it('is false when volume is zero', () => {
    expect(isVideoAudioAudible({ ...baseVideoClip, audio: { volume: 0, fadeIn: 0, fadeOut: 0 } })).toBe(false)
  })
})

describe('findPreferredNarrationTrack', () => {
  const tracks: Track[] = [
    { id: 'v1', name: '映像', type: 'video', clips: [], muted: false, locked: false },
    { id: 'bgm', name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    { id: 'bgm2', name: 'ナレーション', type: 'audio', clips: [], muted: false, locked: true },
  ]

  it('returns first unlocked audio track', () => {
    expect(findPreferredNarrationTrack(tracks)?.id).toBe('bgm')
  })
})
