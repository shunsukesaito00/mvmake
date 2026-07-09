import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSFORM } from '../types/project'
import { applyTransformEasing, getTransformAtLocalTime, sortTransformKeyframes } from './transformKeyframes'

describe('applyTransformEasing', () => {
  it('easeOut は中間点で線形より進む', () => {
    expect(applyTransformEasing(0.5, 'easeOut')).toBeGreaterThan(0.5)
    expect(applyTransformEasing(0.5, 'easeIn')).toBeLessThan(0.5)
    expect(applyTransformEasing(0.5, 'easeInOut')).toBeCloseTo(0.5)
  })
})

describe('getTransformAtLocalTime', () => {
  it('キーフレームがなければベース transform を返す', () => {
    const base = { ...DEFAULT_TRANSFORM, x: 0.3, scale: 1.5 }
    expect(getTransformAtLocalTime(base, undefined, 2, 10)).toEqual(base)
  })

  it('1点のキーフレームは全区間でその値', () => {
    const base = DEFAULT_TRANSFORM
    const keyframes = [{ id: '1', time: 2, x: 0.2, y: 0.8, scale: 2, rotation: 45 }]
    expect(getTransformAtLocalTime(base, keyframes, 0, 10).x).toBe(0.2)
    expect(getTransformAtLocalTime(base, keyframes, 9, 10).rotation).toBe(45)
    expect(getTransformAtLocalTime(base, keyframes, 5, 10).opacity).toBe(base.opacity)
  })

  it('2点間を線形補間する', () => {
    const base = DEFAULT_TRANSFORM
    const keyframes = [
      { id: '1', time: 0, x: 0, y: 0.5, scale: 1, rotation: 0 },
      { id: '2', time: 4, x: 1, y: 0.5, scale: 2, rotation: 90 },
    ]
    const mid = getTransformAtLocalTime(base, keyframes, 2, 10)
    expect(mid.x).toBeCloseTo(0.5)
    expect(mid.scale).toBeCloseTo(1.5)
    expect(mid.rotation).toBeCloseTo(45)
  })

  it('easeOut イージングで中間点が線形より進む', () => {
    const base = DEFAULT_TRANSFORM
    const keyframes = [
      { id: '1', time: 0, x: 0, y: 0.5, scale: 1, rotation: 0 },
      { id: '2', time: 4, x: 1, y: 0.5, scale: 1, rotation: 0, easing: 'easeOut' as const },
    ]
    const mid = getTransformAtLocalTime(base, keyframes, 2, 10)
    expect(mid.x).toBeGreaterThan(0.5)
    expect(mid.x).toBeCloseTo(0.75)
  })
})

describe('sortTransformKeyframes', () => {
  it('time 昇順に並べる', () => {
    const sorted = sortTransformKeyframes([
      { id: 'b', time: 5, x: 0.5, y: 0.5, scale: 1, rotation: 0 },
      { id: 'a', time: 1, x: 0.2, y: 0.5, scale: 1, rotation: 0 },
    ])
    expect(sorted.map((k) => k.time)).toEqual([1, 5])
  })
})
