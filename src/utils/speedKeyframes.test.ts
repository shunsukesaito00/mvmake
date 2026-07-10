import { describe, expect, it } from 'vitest'
import type { VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM } from '../types/project'
import {
  getMaxLocalDurationForSourceBudget,
  getSourceOffsetAtLocalTime,
  getSpeedAtLocalTime,
  getVideoSourceTimeAtLocalTime,
  sortSpeedKeyframes,
} from './speedKeyframes'

const baseClip: VideoClip = {
  id: 'v1',
  type: 'video',
  trackId: 't1',
  mediaId: 'm1',
  startTime: 0,
  duration: 10,
  sourceStart: 0,
  sourceDuration: 10,
  transform: { ...DEFAULT_TRANSFORM },
  audio: { ...DEFAULT_AUDIO },
  speed: 1,
  color: { ...DEFAULT_COLOR },
  crop: { ...DEFAULT_CROP },
  fadeIn: 0,
  fadeOut: 0,
}

describe('getSpeedAtLocalTime', () => {
  it('キーフレームがなければ speed を返す', () => {
    expect(getSpeedAtLocalTime({ ...baseClip, speed: 2 }, 3)).toBe(2)
  })

  it('2点間を線形補間する', () => {
    const clip: VideoClip = {
      ...baseClip,
      speedKeyframes: [
        { id: '1', time: 0, speed: 1 },
        { id: '2', time: 4, speed: 3 },
      ],
    }
    expect(getSpeedAtLocalTime(clip, 2)).toBeCloseTo(2)
    expect(getSpeedAtLocalTime(clip, 0)).toBe(1)
    expect(getSpeedAtLocalTime(clip, 8)).toBe(3)
  })

  it('ベジェ区間は線形と異なる中間値になる', () => {
    const clip: VideoClip = {
      ...baseClip,
      speedKeyframes: [
        { id: '1', time: 0, speed: 1, bezierHandles: { handleOut: { timeOffset: 1, valueOffset: 2 } } },
        { id: '2', time: 4, speed: 3, easing: 'bezier' },
      ],
    }
    expect(getSpeedAtLocalTime(clip, 2)).not.toBeCloseTo(2, 1)
  })
})

describe('getSourceOffsetAtLocalTime', () => {
  it('キーフレームなしは一定速度の積分', () => {
    expect(getSourceOffsetAtLocalTime({ ...baseClip, speed: 2 }, 3)).toBe(6)
  })

  it('線形速度変化は台形積分', () => {
    const clip: VideoClip = {
      ...baseClip,
      speedKeyframes: [
        { id: '1', time: 0, speed: 1 },
        { id: '2', time: 4, speed: 3 },
      ],
    }
    // 0〜4s: 平均速度 2 → 8 source seconds
    expect(getSourceOffsetAtLocalTime(clip, 4)).toBeCloseTo(8)
  })

  it('getVideoSourceTimeAtLocalTime は sourceStart を加算', () => {
    const clip = { ...baseClip, sourceStart: 5, speed: 2 }
    expect(getVideoSourceTimeAtLocalTime(clip, 2)).toBe(9)
  })
})

describe('getMaxLocalDurationForSourceBudget', () => {
  it('一定速度で素材長から逆算', () => {
    expect(getMaxLocalDurationForSourceBudget({ ...baseClip, speed: 2 }, 10)).toBe(5)
  })
})

describe('sortSpeedKeyframes', () => {
  it('time 昇順に並べる', () => {
    const sorted = sortSpeedKeyframes([
      { id: 'b', time: 5, speed: 2 },
      { id: 'a', time: 1, speed: 1 },
    ])
    expect(sorted.map((k) => k.time)).toEqual([1, 5])
  })
})
