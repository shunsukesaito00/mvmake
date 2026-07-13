import { describe, expect, it } from 'vitest'
import type { VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM } from '../types/project'
import {
  getConstantVideoAudioPlaybackRate,
  getVideoAudioPlaybackMode,
  isSpeedAudioLinked,
  isSpeedPreservePitch,
  resolveVideoAudioSpeedSchedule,
  shouldScheduleVideoSpeedAutomation,
  shouldUsePitchPreservedStretch,
} from './speedAudioLink'

const baseVideo: VideoClip = {
  id: 'v1',
  type: 'video',
  trackId: 't1',
  mediaId: 'm1',
  startTime: 0,
  duration: 8,
  sourceStart: 0,
  sourceDuration: 8,
  transform: { ...DEFAULT_TRANSFORM },
  audio: { ...DEFAULT_AUDIO },
  speed: 1,
  color: { ...DEFAULT_COLOR },
  crop: { ...DEFAULT_CROP },
  fadeIn: 0,
  fadeOut: 0,
}

describe('speedAudioLink', () => {
  it('defaults to linked when speedAudioLinked is omitted', () => {
    expect(isSpeedAudioLinked(baseVideo)).toBe(true)
  })

  it('resolveVideoAudioSpeedSchedule integrates speed keyframes when linked', () => {
    const clip: VideoClip = {
      ...baseVideo,
      speedKeyframes: [
        { id: '1', time: 0, speed: 1 },
        { id: '2', time: 4, speed: 0.5 },
      ],
    }
    const schedule = resolveVideoAudioSpeedSchedule(clip, 0, 8)
    expect(schedule.linked).toBe(true)
    expect(schedule.timelineDuration).toBe(8)
    expect(schedule.bufferDuration).toBeGreaterThan(4)
    expect(schedule.bufferDuration).toBeLessThan(8)
  })

  it('unlinked schedule uses linear 1x source mapping', () => {
    const clip: VideoClip = {
      ...baseVideo,
      speedAudioLinked: false,
      speed: 0.5,
      speedKeyframes: [{ id: '1', time: 0, speed: 0.5 }],
    }
    const schedule = resolveVideoAudioSpeedSchedule(clip, 2, 6)
    expect(schedule).toEqual({
      sourceStart: 2,
      bufferDuration: 4,
      timelineDuration: 4,
      linked: false,
    })
  })

  it('shouldScheduleVideoSpeedAutomation is false when unlinked', () => {
    expect(shouldScheduleVideoSpeedAutomation({
      ...baseVideo,
      speedAudioLinked: false,
      speedKeyframes: [{ id: '1', time: 0, speed: 0.5 }],
    })).toBe(false)
  })

  it('getConstantVideoAudioPlaybackRate returns 1x when unlinked', () => {
    expect(getConstantVideoAudioPlaybackRate({ ...baseVideo, speed: 0.5, speedAudioLinked: false }, 2)).toBe(2)
  })

  it('pitch preserve uses stretch playback mode when linked', () => {
    const clip: VideoClip = {
      ...baseVideo,
      speedPreservePitch: true,
      speedKeyframes: [{ id: '1', time: 0, speed: 0.5 }],
    }
    expect(shouldUsePitchPreservedStretch(clip)).toBe(true)
    expect(getVideoAudioPlaybackMode(clip)).toBe('stretch')
    expect(shouldScheduleVideoSpeedAutomation(clip)).toBe(false)
    expect(isSpeedPreservePitch(clip)).toBe(true)
  })
})
