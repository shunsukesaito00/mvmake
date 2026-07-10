import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSFORM } from '../types/project'
import {
  cubicBezierComponent,
  defaultBezierHandleIn,
  defaultBezierHandleOut,
  sampleCubicBezierYAtX,
  samplePropertyWithBezier,
} from './transformKeyframeBezier'
import { applyTransformEasing, getTransformAtLocalTime, sortTransformKeyframes } from './transformKeyframes'

describe('cubicBezierComponent', () => {
  it('端点で p0 / p3 を返す', () => {
    expect(cubicBezierComponent(0, 0.3, 0.7, 1, 0)).toBe(0)
    expect(cubicBezierComponent(0, 0.3, 0.7, 1, 1)).toBe(1)
  })
})

describe('sampleCubicBezierYAtX', () => {
  it('線形ベジェは中間点で線形補間と一致する', () => {
    const y = sampleCubicBezierYAtX(0, 4 / 3, 8 / 3, 4, 2, 0, 2 / 3, 4 / 3, 2)
    expect(y).toBeCloseTo(1)
  })
})

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
    const keyframes = [{ id: '1', time: 2, x: 0.2, y: 0.8, scale: 2, rotation: 45, opacity: 0.3 }]
    expect(getTransformAtLocalTime(base, keyframes, 0, 10).x).toBe(0.2)
    expect(getTransformAtLocalTime(base, keyframes, 9, 10).rotation).toBe(45)
    expect(getTransformAtLocalTime(base, keyframes, 5, 10).opacity).toBe(0.3)
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

  it('ベジェハンドルで不透明度がカーブ補間される', () => {
    const base = DEFAULT_TRANSFORM
    const keyframes = [
      {
        id: '1',
        time: 0,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        opacity: 1,
        bezierHandles: {
          opacity: { handleOut: defaultBezierHandleOut(4) },
        },
      },
      {
        id: '2',
        time: 4,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        opacity: 0,
        easing: 'bezier' as const,
        bezierHandles: {
          opacity: { handleIn: defaultBezierHandleIn(4) },
        },
      },
    ]
    const linearMid = 0.5
    const curvedMid = getTransformAtLocalTime(base, keyframes, 2, 4).opacity
    expect(curvedMid).toBeCloseTo(linearMid)

    const eased = getTransformAtLocalTime(base, keyframes.map((kf, i) => (
      i === 0
        ? {
            ...kf,
            bezierHandles: {
              opacity: { handleOut: { timeOffset: 4 / 3, valueOffset: -0.5 } },
            },
          }
        : {
            ...kf,
            bezierHandles: {
              opacity: { handleIn: { timeOffset: -4 / 3, valueOffset: 0 } },
            },
          }
    )), 2, 4).opacity
    expect(eased).toBeLessThan(0.5)
  })

  it('不透明度をキーフレーム間で補間する', () => {
    const base = DEFAULT_TRANSFORM
    const keyframes = [
      { id: '1', time: 0, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
      { id: '2', time: 2, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 0 },
    ]
    const mid = getTransformAtLocalTime(base, keyframes, 1, 4)
    expect(mid.opacity).toBeCloseTo(0.5)
  })
})

describe('samplePropertyWithBezier', () => {
  it('カスタムハンドルで値が曲線的に変化する', () => {
    const base = DEFAULT_TRANSFORM
    const start = {
      id: '1',
      time: 0,
      x: 0,
      y: 0.5,
      scale: 1,
      rotation: 0,
      bezierHandles: { x: { handleOut: { timeOffset: 1.33, valueOffset: 0.4 } } },
    }
    const end = {
      id: '2',
      time: 4,
      x: 1,
      y: 0.5,
      scale: 1,
      rotation: 0,
      easing: 'bezier' as const,
      bezierHandles: { x: { handleIn: { timeOffset: -1.33, valueOffset: 0 } } },
    }
    const mid = samplePropertyWithBezier(start, end, 'x', base, 2)
    expect(mid).toBeGreaterThan(0.5)
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
