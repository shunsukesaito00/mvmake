import { describe, expect, it } from 'vitest'
import type { AudioClip, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP } from '../types/project'
import { rippleTrimClipsOnTrack } from './clipUtils'
import { splitSpeedKeyframes } from './speedKeyframesTimeline'
import { computeSlipClip, slideClipOnTrack } from './slipSlide'
import { splitTransformKeyframes } from './transformKeyframesTimeline'
import { splitVolumeKeyframes } from './volumeKeyframesTimeline'

const mediaAssets = [{ id: 'm1', duration: 30 }]

const transformKeyframes = [
  { id: 'kf1', time: 0, x: 0.2, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
  { id: 'kf2', time: 2, x: 0.8, y: 0.5, scale: 1.2, rotation: 0, opacity: 1 },
  { id: 'kf3', time: 4, x: 0.5, y: 0.5, scale: 1, rotation: 45, opacity: 0.8 },
]

const volumeKeyframes = [
  { id: 'v1', time: 0, volume: 0.2 },
  { id: 'v2', time: 2, volume: 1 },
  { id: 'v3', time: 4, volume: 0.5 },
]

const speedKeyframes = [
  { id: 's1', time: 0, speed: 0.5 },
  { id: 's2', time: 2, speed: 2 },
  { id: 's3', time: 4, speed: 1 },
]

describe('split keyframes at exact boundary', () => {
  it('duplicates transform keyframe at split point on both clips', () => {
    const { first, second } = splitTransformKeyframes(transformKeyframes, 2)
    expect(first?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.[0].x).toBe(0.8)
    expect(second?.[0].id).not.toBe('kf2')
  })

  it('duplicates volume keyframe at split point on both clips', () => {
    const { first, second } = splitVolumeKeyframes(volumeKeyframes, 2)
    expect(first?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.[0].volume).toBe(1)
    expect(second?.[0].id).not.toBe('v2')
  })

  it('duplicates speed keyframe at split point on both clips', () => {
    const { first, second } = splitSpeedKeyframes(speedKeyframes, 2)
    expect(first?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.[0].speed).toBe(2)
    expect(second?.[0].id).not.toBe('s2')
  })
})

describe('ripple trim preserves clip-local keyframes', () => {
  const baseVideo: VideoClip = {
    id: 'v1',
    type: 'video',
    trackId: 't1',
    mediaId: 'm1',
    startTime: 4,
    duration: 3,
    sourceStart: 0,
    sourceDuration: 3,
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    transformKeyframes,
    audio: { ...DEFAULT_AUDIO, volumeKeyframes },
    speed: 1,
    speedKeyframes,
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    fadeIn: 0,
    fadeOut: 0,
  }

  const baseAudio: AudioClip = {
    id: 'a1',
    type: 'audio',
    trackId: 't2',
    mediaId: 'm1',
    startTime: 4,
    duration: 3,
    sourceStart: 0,
    sourceDuration: 3,
    audio: { ...DEFAULT_AUDIO, volumeKeyframes },
    speed: 1,
    ducking: { enabled: false, amount: 0.3, fade: 0.5 },
  }

  it('shifts startTime only for subsequent clips', () => {
    const clips = rippleTrimClipsOnTrack(
      [
        { ...baseVideo, id: 'c1', startTime: 0, duration: 4, transformKeyframes: undefined, speedKeyframes: undefined, audio: { ...DEFAULT_AUDIO } },
        { ...baseVideo, id: 'c2' },
      ],
      'c1',
      4,
      -1,
    )
    const shifted = clips.find((c) => c.id === 'c2') as VideoClip
    expect(shifted.startTime).toBe(3)
    expect(shifted.transformKeyframes).toEqual(transformKeyframes)
    expect(shifted.speedKeyframes).toEqual(speedKeyframes)
  })

  it('keeps audio volume keyframes when ripple shifts clip', () => {
    const clips = rippleTrimClipsOnTrack(
      [
        { ...baseAudio, id: 'c1', startTime: 0, duration: 4, audio: { ...DEFAULT_AUDIO } },
        { ...baseAudio, id: 'c2' },
      ],
      'c1',
      4,
      -1,
    )
    const shifted = clips.find((c) => c.id === 'c2') as AudioClip
    expect(shifted.startTime).toBe(3)
    expect(shifted.audio.volumeKeyframes).toEqual(volumeKeyframes)
  })
})

describe('slip and slide preserve keyframes', () => {
  const videoWithKfs: VideoClip = {
    id: 'v1',
    type: 'video',
    trackId: 't1',
    mediaId: 'm1',
    startTime: 0,
    duration: 5,
    sourceStart: 2,
    sourceDuration: 5,
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    transformKeyframes: [transformKeyframes[0]],
    audio: { ...DEFAULT_AUDIO, volumeKeyframes: [volumeKeyframes[0]] },
    speed: 1,
    speedKeyframes: [speedKeyframes[0]],
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    fadeIn: 0,
    fadeOut: 0,
  }

  it('slip changes sourceStart but not keyframe times', () => {
    const slipped = computeSlipClip(videoWithKfs, 1, mediaAssets) as VideoClip
    expect(slipped?.sourceStart).toBe(3)
    expect(slipped?.transformKeyframes).toEqual(videoWithKfs.transformKeyframes)
    expect(slipped?.speedKeyframes).toEqual(videoWithKfs.speedKeyframes)
    expect(slipped?.audio.volumeKeyframes).toEqual(videoWithKfs.audio.volumeKeyframes)
  })

  it('slide shifts timeline but keeps selected clip keyframes', () => {
    const middle: VideoClip = {
      ...videoWithKfs,
      id: 'c2',
      startTime: 4,
      duration: 2,
      transformKeyframes: [transformKeyframes[1]],
    }
    const clips = [
      { ...videoWithKfs, id: 'c1', startTime: 0, duration: 4, transformKeyframes: undefined, speedKeyframes: undefined, audio: { ...DEFAULT_AUDIO } },
      middle,
      { ...videoWithKfs, id: 'c3', startTime: 6, duration: 3, transformKeyframes: undefined, speedKeyframes: undefined, audio: { ...DEFAULT_AUDIO } },
    ]
    const updated = slideClipOnTrack(clips, 'c2', 0.5, mediaAssets)
    expect(updated).not.toBeNull()
    const slid = updated!.find((c) => c.id === 'c2') as VideoClip
    expect(slid.startTime).toBe(4.5)
    expect(slid.transformKeyframes).toEqual(middle.transformKeyframes)
  })
})
