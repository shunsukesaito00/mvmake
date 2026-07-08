import { describe, it, expect } from 'vitest'
import {
  isCompatibleTrack,
  clampTrimEnd,
  clampTrimStart,
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
  fadeIn: 0,
  fadeOut: 0,
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

  it('enforces minimum duration of 0.2s', () => {
    expect(clampTrimEnd(baseVideoClip, 0.05, [videoAsset])).toBe(0.2)
    expect(clampTrimEnd(baseVideoClip, -1, [videoAsset])).toBe(0.2)
  })

  it('accounts for playback speed against source length', () => {
    // 速度2xでは素材10秒 → タイムライン上は最大5秒
    const clip = { ...baseVideoClip, speed: 2 }
    expect(clampTrimEnd(clip, 8, [videoAsset])).toBe(5)
  })

  it('does not limit image clips by source length', () => {
    const imageClip: Clip = {
      id: 'i1', trackId: 't1', type: 'image', mediaId: 'img1',
      startTime: 0, duration: 5, sourceStart: 0, sourceDuration: 5,
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
      kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 },
      color: { brightness: 0, contrast: 0, saturation: 0 },
      crop: { enabled: false, x: 0, y: 0, width: 1, height: 1 },
      fadeIn: 0,
      fadeOut: 0,
    }
    expect(clampTrimEnd(imageClip, 60, [])).toBe(60)
  })
})

describe('clampTrimStart', () => {
  it('returns trimmed values within source range', () => {
    // 先頭を1秒トリム: startTime 0→1, duration 5→4, sourceStart 0→1
    const result = clampTrimStart(baseVideoClip, 1, 4, 1, [videoAsset])
    expect(result).toEqual({ startTime: 1, duration: 4, sourceStart: 1, sourceDuration: 4 })
  })

  it('rejects duration below 0.2s', () => {
    expect(clampTrimStart(baseVideoClip, 4.9, 0.1, 4.9, [videoAsset])).toBeNull()
  })

  it('rejects negative sourceStart (extending before source head)', () => {
    // sourceStart 0 の状態から左へ広げようとした場合
    expect(clampTrimStart(baseVideoClip, -1, 6, -1, [videoAsset])).toBeNull()
  })

  it('rejects extension past source tail', () => {
    // 素材10秒: sourceStart 6 + duration 5 = 11 > 10 ではみ出す
    const clip = { ...baseVideoClip, sourceStart: 5 }
    expect(clampTrimStart(clip, 1, 5, 6, [videoAsset])).toBeNull()
  })

  it('clamps startTime to zero or above', () => {
    // テキストクリップは素材制約なし。startTime のみ 0 未満にならない
    const textClip: Clip = {
      id: 'tx1', trackId: 't3', type: 'text',
      startTime: 0.5, duration: 4, sourceStart: 0, sourceDuration: 4,
      text: { content: 'a', fontFamily: 'sans-serif', fontSize: 48, color: '#fff', strokeColor: '#000', strokeWidth: 0, shadowColor: '#000', shadowBlur: 0, textAlign: 'center', lineHeight: 1.2, verticalAlign: 'center', backgroundColor: '', backgroundPadding: 16, backgroundRadius: 8 },
      transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
      animation: { type: 'none', duration: 0 },
    }
    const result = clampTrimStart(textClip, -0.5, 5, -0.5, [])
    expect(result?.startTime).toBe(0)
    expect(result?.sourceStart).toBe(0)
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
