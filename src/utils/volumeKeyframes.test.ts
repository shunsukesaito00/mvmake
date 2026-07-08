import { describe, expect, it } from 'vitest'
import { DEFAULT_AUDIO } from '../types/project'
import { getVolumeAtLocalTime, sortVolumeKeyframes } from './volumeKeyframes'

describe('getVolumeAtLocalTime', () => {
  it('キーフレームがなければ volume を返す', () => {
    expect(getVolumeAtLocalTime({ ...DEFAULT_AUDIO, volume: 0.8 }, 2, 10)).toBe(0.8)
  })

  it('1点のキーフレームは全区間でその音量', () => {
    const audio = {
      ...DEFAULT_AUDIO,
      volumeKeyframes: [{ id: '1', time: 3, volume: 0.5 }],
    }
    expect(getVolumeAtLocalTime(audio, 0, 10)).toBe(0.5)
    expect(getVolumeAtLocalTime(audio, 9, 10)).toBe(0.5)
  })

  it('2点間を線形補間する', () => {
    const audio = {
      ...DEFAULT_AUDIO,
      volumeKeyframes: [
        { id: '1', time: 0, volume: 0 },
        { id: '2', time: 4, volume: 1 },
      ],
    }
    expect(getVolumeAtLocalTime(audio, 2, 10)).toBeCloseTo(0.5)
    expect(getVolumeAtLocalTime(audio, -1, 10)).toBe(0)
    expect(getVolumeAtLocalTime(audio, 10, 10)).toBe(1)
  })
})

describe('sortVolumeKeyframes', () => {
  it('time 昇順に並べる', () => {
    const sorted = sortVolumeKeyframes([
      { id: 'b', time: 5, volume: 1 },
      { id: 'a', time: 1, volume: 0.5 },
    ])
    expect(sorted.map((k) => k.time)).toEqual([1, 5])
  })
})
