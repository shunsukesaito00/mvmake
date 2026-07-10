import { describe, expect, it } from 'vitest'
import type { SpeedKeyframe } from '../types/project'
import {
  clampSpeedValue,
  getSpeedBezierHandleIn,
  getSpeedBezierHandleOut,
  patchSpeedBezierHandle,
  sampleSpeedWithBezier,
  shouldUseSpeedBezier,
} from './speedKeyframeBezier'

const kf0: SpeedKeyframe = { id: 'a', time: 0, speed: 1 }
const kf4: SpeedKeyframe = { id: 'b', time: 4, speed: 3 }

describe('shouldUseSpeedBezier', () => {
  it('easing が bezier なら true', () => {
    expect(shouldUseSpeedBezier(kf0, { ...kf4, easing: 'bezier' })).toBe(true)
  })

  it('ハンドルがなければ false', () => {
    expect(shouldUseSpeedBezier(kf0, kf4)).toBe(false)
  })
})

describe('sampleSpeedWithBezier', () => {
  it('端点でキーフレーム速度を返す', () => {
    const end: SpeedKeyframe = { ...kf4, easing: 'bezier' }
    expect(sampleSpeedWithBezier(kf0, end, 0)).toBeCloseTo(1)
    expect(sampleSpeedWithBezier(kf0, end, 4)).toBeCloseTo(3)
  })

  it('カスタムハンドルで中間値が変わる', () => {
    const start: SpeedKeyframe = {
      ...kf0,
      bezierHandles: { handleOut: { timeOffset: 1, valueOffset: 2 } },
    }
    const end: SpeedKeyframe = { ...kf4, easing: 'bezier' }
    const linearMid = 1 + (3 - 1) * 0.5
    const bezierMid = sampleSpeedWithBezier(start, end, 2)
    expect(bezierMid).not.toBeCloseTo(linearMid, 1)
  })
})

describe('patchSpeedBezierHandle', () => {
  it('handleOut を更新する', () => {
    const patched = patchSpeedBezierHandle(kf0, 'out', 1.5, 0.5)
    expect(patched.bezierHandles?.handleOut).toEqual({ timeOffset: 1.5, valueOffset: 0.5 })
  })
})

describe('default handles', () => {
  it('span の 1/3 を timeOffset に使う', () => {
    expect(getSpeedBezierHandleOut(kf0, kf4).timeOffset).toBeCloseTo(4 / 3)
    expect(getSpeedBezierHandleIn(kf4, kf0).timeOffset).toBeCloseTo(-4 / 3)
  })
})

describe('clampSpeedValue', () => {
  it('0.25〜4 にクランプ', () => {
    expect(clampSpeedValue(0.1)).toBe(0.25)
    expect(clampSpeedValue(5)).toBe(4)
  })
})
