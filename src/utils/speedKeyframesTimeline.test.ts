import { describe, expect, it } from 'vitest'
import { splitSpeedKeyframes } from './speedKeyframesTimeline'

describe('splitSpeedKeyframes', () => {
  it('分割位置で両側に再配分する', () => {
    const keyframes = [
      { id: 'a', time: 1, speed: 1 },
      { id: 'b', time: 5, speed: 2 },
      { id: 'c', time: 8, speed: 0.5 },
    ]
    const { first, second } = splitSpeedKeyframes(keyframes, 5)
    expect(first?.map((k) => k.time)).toEqual([1, 5])
    expect(second?.map((k) => k.time)).toEqual([0, 3])
  })

  it('キーフレームがなければ undefined', () => {
    expect(splitSpeedKeyframes(undefined, 2)).toEqual({ first: undefined, second: undefined })
  })
})
