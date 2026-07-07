import { describe, it, expect } from 'vitest'
import {
  isCompatibleTrack,
  clampTrimEnd,
  trackTypeForClip,
  clipsOverlap,
  resolveClipOverlap,
  rippleShiftClips,
  getDuckingIntervals,
} from './clipUtils'
import type { MediaAsset, Project, Track, VideoClip, Clip } from '../types/project'

const videoAsset: MediaAsset = {
  id: 'v1', name: 'test.mp4', type: 'video', blob: new Blob(), url: 'blob:test', duration: 10,
}

const videoTrack: Track = { id: 't1', name: '映像', type: 'video', clips: [], muted: false, locked: false }
const audioTrack: Track = { id: 't2', name: 'BGM', type: 'audio', clips: [], muted: false, locked: false }

const baseVideoClip: VideoClip = {
  id: 'c1', trackId: 't1', type: 'video', mediaId: 'v1',
  startTime: 0, duration: 5, sourceStart: 0, sourceDuration: 5,
  transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
  audio: { volume: 1, fadeIn: 0, fadeOut: 0 },
  speed: 1, color: { brightness: 0, contrast: 0, saturation: 0 },
  crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
}

describe('isCompatibleTrack', () => {
  it('allows video on video track', () => {
    expect(isCompatibleTrack(videoAsset, videoTrack)).toBe(true)
  })
  it('rejects video on audio track', () => {
    expect(isCompatibleTrack(videoAsset, audioTrack)).toBe(false)
  })
})

describe('clampTrimEnd', () => {
  it('limits duration to source length', () => {
    const clip = { ...baseVideoClip, sourceStart: 8 }
    expect(clampTrimEnd(clip, 5, [videoAsset])).toBe(2)
  })
})

describe('clipsOverlap', () => {
  it('detects overlapping clips', () => {
    const a: Clip = { ...baseVideoClip, startTime: 0, duration: 5 }
    const b: Clip = { ...baseVideoClip, id: 'c2', startTime: 3, duration: 5 }
    expect(clipsOverlap(a, b)).toBe(true)
  })
})

describe('resolveClipOverlap', () => {
  it('shifts clip after overlapping clip', () => {
    const moving: Clip = { ...baseVideoClip, id: 'c2', startTime: 2, duration: 3 }
    const other: Clip = { ...baseVideoClip, startTime: 0, duration: 5 }
    const result = resolveClipOverlap(moving, [other], 2)
    expect(result).toBeGreaterThanOrEqual(5.05)
  })
})

describe('rippleShiftClips', () => {
  it('shifts clips after given time', () => {
    const clips: Clip[] = [
      { ...baseVideoClip, startTime: 0, duration: 3 },
      { ...baseVideoClip, id: 'c2', startTime: 5, duration: 2 },
    ]
    const shifted = rippleShiftClips(clips, 3, -2)
    expect(shifted[1].startTime).toBe(3)
  })
})

describe('trackTypeForClip', () => {
  it('returns video for video clip', () => {
    expect(trackTypeForClip(baseVideoClip)).toBe('video')
  })
})

describe('getDuckingIntervals', () => {
  const makeProject = (clips: Clip[], muted = false): Project => ({
    id: 'p1', name: 'test', width: 1920, height: 1080, fps: 30,
    mediaAssets: [], markers: [],
    tracks: [{ id: 't1', name: '映像', type: 'video', clips, muted, locked: false }],
  })

  it('returns intervals for video clips with audio', () => {
    const project = makeProject([
      { ...baseVideoClip, startTime: 1, duration: 3 },
      { ...baseVideoClip, id: 'c2', startTime: 10, duration: 2 },
    ])
    expect(getDuckingIntervals(project)).toEqual([
      { start: 1, end: 4 },
      { start: 10, end: 12 },
    ])
  })

  it('merges adjacent intervals', () => {
    const project = makeProject([
      { ...baseVideoClip, startTime: 0, duration: 3 },
      { ...baseVideoClip, id: 'c2', startTime: 3.05, duration: 2 },
    ])
    expect(getDuckingIntervals(project)).toEqual([{ start: 0, end: 5.05 }])
  })

  it('ignores muted tracks and silent clips', () => {
    const muted = makeProject([{ ...baseVideoClip }], true)
    expect(getDuckingIntervals(muted)).toEqual([])

    const silent = makeProject([{ ...baseVideoClip, audio: { volume: 0, fadeIn: 0, fadeOut: 0 } }])
    expect(getDuckingIntervals(silent)).toEqual([])
  })
})
