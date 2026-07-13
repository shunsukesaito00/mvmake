import { describe, expect, it } from 'vitest'
import {
  computePlaybackDrift,
  PLAYBACK_DRIFT_CORRECTION_MIN_INTERVAL_MS,
  PLAYBACK_DRIFT_CORRECTION_THRESHOLD_SEC,
  resolveMasterPlaybackTime,
  shouldCorrectPlaybackDrift,
  shouldUseAudioMasterClock,
} from './playbackMasterClock'

describe('playbackMasterClock', () => {
  it('順方向再生のみ Audio マスターを使う', () => {
    expect(shouldUseAudioMasterClock(true, 1)).toBe(true)
    expect(shouldUseAudioMasterClock(true, 2)).toBe(true)
    expect(shouldUseAudioMasterClock(true, -1)).toBe(false)
    expect(shouldUseAudioMasterClock(false, 1)).toBe(false)
  })

  it('resolveMasterPlaybackTime は Audio 再生中に audio を返す', () => {
    expect(resolveMasterPlaybackTime({
      playing: true,
      shuttleRate: 1,
      audioTimelineTime: 3.2,
      audioIsPlaying: false,
      wallTimelineTime: 3.0,
    })).toEqual({ time: 3.0, mode: 'audio' })

    expect(resolveMasterPlaybackTime({
      playing: true,
      shuttleRate: 1,
      audioTimelineTime: 3.2,
      audioIsPlaying: true,
      wallTimelineTime: 3.5,
    })).toEqual({ time: 3.2, mode: 'audio' })

    expect(resolveMasterPlaybackTime({
      playing: true,
      shuttleRate: -1,
      audioTimelineTime: 3.2,
      audioIsPlaying: false,
      wallTimelineTime: 2.8,
    })).toEqual({ time: 2.8, mode: 'wall' })

    expect(resolveMasterPlaybackTime({
      playing: false,
      shuttleRate: 1,
      audioTimelineTime: 1,
      audioIsPlaying: false,
      wallTimelineTime: 4,
    })).toEqual({ time: 4, mode: 'idle' })
  })

  it('ドリフト補正は閾値と間隔で判定する', () => {
    const now = 10_000
    expect(shouldCorrectPlaybackDrift(PLAYBACK_DRIFT_CORRECTION_THRESHOLD_SEC + 0.01, 0, now)).toBe(true)
    expect(shouldCorrectPlaybackDrift(0.01, 0, now)).toBe(false)
    expect(shouldCorrectPlaybackDrift(0.2, now - 100, now)).toBe(false)
    expect(shouldCorrectPlaybackDrift(0.2, now - PLAYBACK_DRIFT_CORRECTION_MIN_INTERVAL_MS, now)).toBe(true)
    expect(computePlaybackDrift(1.0, 1.08)).toBeCloseTo(0.08)
  })
})
