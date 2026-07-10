import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSFORM } from '../types/project'
import {
  buildTransformOpacityCurvePath,
  buildTransformPropertyCurvePath,
  createTransformKeyframeAt,
  keyframeToLanePoint,
  laneYToOpacity,
  laneYToProperty,
  opacityToLaneY,
  propertyToLaneY,
  splitTransformKeyframes,
  upsertTransformKeyframeAt,
} from './transformKeyframesTimeline'

describe('transform timeline lane', () => {
  it('不透明度とレーンYを相互変換する', () => {
    expect(opacityToLaneY(1, 24)).toBe(0)
    expect(opacityToLaneY(0, 24)).toBe(24)
    expect(laneYToOpacity(12, 24)).toBeCloseTo(0.5)
  })

  it('キーフレームをレーン座標へ変換する', () => {
    const kf = { id: 'a', time: 2, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 0.25 }
    const point = keyframeToLanePoint(kf, DEFAULT_TRANSFORM, 4, 100, 24)
    expect(point.x).toBe(50)
    expect(point.y).toBe(opacityToLaneY(0.25, 24))
  })

  it('不透明度カーブ path を生成する', () => {
    const keyframes = [
      { id: 'a', time: 0, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
      { id: 'b', time: 2, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 0 },
    ]
    const path = buildTransformOpacityCurvePath(DEFAULT_TRANSFORM, keyframes, 2, 40, 24)
    expect(path.startsWith('M')).toBe(true)
    expect(path.includes('L')).toBe(true)
  })

  it('ダブルクリック追加時に不透明度を指定できる', () => {
    const next = createTransformKeyframeAt(DEFAULT_TRANSFORM, undefined, 4, 1, 'opacity', 0.3)
    expect(next).toHaveLength(1)
    expect(next[0].opacity).toBe(0.3)
  })

  it('スケールカーブ path を生成する', () => {
    const keyframes = [
      { id: 'a', time: 0, x: 0.5, y: 0.5, scale: 0.5, rotation: 0, opacity: 1 },
      { id: 'b', time: 2, x: 0.5, y: 0.5, scale: 2, rotation: 0, opacity: 1 },
    ]
    const path = buildTransformPropertyCurvePath(DEFAULT_TRANSFORM, keyframes, 2, 40, 24, 'scale')
    expect(path.startsWith('M')).toBe(true)
    expect(path.includes('L')).toBe(true)
  })

  it('レーンYとスケール値を相互変換する', () => {
    expect(propertyToLaneY(2, 'scale', 24)).toBeLessThan(propertyToLaneY(0.5, 'scale', 24))
    expect(laneYToProperty(12, 'scale', 24)).toBeGreaterThan(0.5)
  })
})

describe('upsertTransformKeyframeAt', () => {
  it('近い時間のキーフレームがあれば更新する', () => {
    const keyframes = [{ id: 'kf1', time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0 }]
    const next = upsertTransformKeyframeAt(DEFAULT_TRANSFORM, keyframes, 4, 1.02, {
      x: 0.2,
      y: 0.5,
      scale: 1,
      rotation: 0,
    })
    expect(next).toHaveLength(1)
    expect(next[0].x).toBe(0.2)
  })

  it('近いキーフレームがなければ追加する', () => {
    const keyframes = [{ id: 'kf1', time: 0, x: 0.5, y: 0.5, scale: 1, rotation: 0 }]
    const next = upsertTransformKeyframeAt(DEFAULT_TRANSFORM, keyframes, 4, 2, {
      x: 0.8,
      y: 0.5,
      scale: 1.5,
      rotation: 45,
    })
    expect(next).toHaveLength(2)
    expect(next[1].x).toBe(0.8)
    expect(next[1].rotation).toBe(45)
  })
})

describe('splitTransformKeyframes', () => {
  it('分割点で両クリップに再配分する', () => {
    const keyframes = [
      { id: 'a', time: 0, x: 0.2, y: 0.5, scale: 1, rotation: 0 },
      { id: 'b', time: 2, x: 0.8, y: 0.5, scale: 1, rotation: 0 },
      { id: 'c', time: 4, x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    ]
    const { first, second } = splitTransformKeyframes(keyframes, 2)
    expect(first?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.[1].x).toBe(0.5)
  })

  it('キーフレームがなければ undefined を返す', () => {
    expect(splitTransformKeyframes(undefined, 1)).toEqual({ first: undefined, second: undefined })
  })
})
