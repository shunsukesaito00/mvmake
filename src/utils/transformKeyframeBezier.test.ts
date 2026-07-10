import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSFORM } from '../types/project'
import {
  defaultBezierHandleIn,
  defaultBezierHandleOut,
  getBezierHandleIn,
  getBezierHandleOut,
  sampleCubicBezierYAtX,
  shouldUseBezierForProperty,
} from './transformKeyframeBezier'

describe('transformKeyframeBezier', () => {
  const start = { id: '1', time: 0, x: 0, y: 0.5, scale: 1, rotation: 0, opacity: 1 }
  const end = { id: '2', time: 3, x: 1, y: 0.5, scale: 1, rotation: 0, opacity: 0 }

  it('shouldUseBezierForProperty は easing=bezier で true', () => {
    expect(shouldUseBezierForProperty(start, { ...end, easing: 'bezier' }, 'opacity')).toBe(true)
    expect(shouldUseBezierForProperty(start, end, 'opacity')).toBe(false)
  })

  it('デフォルトハンドルは区間の 1/3 位置', () => {
    expect(getBezierHandleOut(start, end, 'opacity')).toEqual(defaultBezierHandleOut(3))
    expect(getBezierHandleIn(end, start, 'opacity')).toEqual(defaultBezierHandleIn(3))
  })

  it('sampleCubicBezierYAtX は端点を返す', () => {
    const y0 = 1
    const y3 = 0
    expect(sampleCubicBezierYAtX(0, 1, 2, 3, 0, y0, 1, 0, y3)).toBe(y0)
    expect(sampleCubicBezierYAtX(0, 1, 2, 3, 3, y0, 1, 0, y3)).toBe(y3)
  })
})

describe('getTransformAtLocalTime bezier integration', () => {
  it('ベジェ easing でも他属性はデフォルト線形ベジェで補間', async () => {
    const { getTransformAtLocalTime } = await import('./transformKeyframes')
    const base = DEFAULT_TRANSFORM
    const keyframes = [
      { id: '1', time: 0, x: 0, y: 0.5, scale: 1, rotation: 0 },
      { id: '2', time: 4, x: 1, y: 0.5, scale: 2, rotation: 0, easing: 'bezier' as const },
    ]
    const mid = getTransformAtLocalTime(base, keyframes, 2, 10)
    expect(mid.x).toBeCloseTo(0.5)
    expect(mid.scale).toBeCloseTo(1.5)
  })
})
