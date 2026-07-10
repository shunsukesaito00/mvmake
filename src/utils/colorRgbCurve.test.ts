import { describe, expect, it } from 'vitest'
import { DEFAULT_RGB_CURVES, normalizeRgbCurveChannel, normalizeRgbCurves } from '../types/project'
import {
  addRgbCurvePoint,
  applyRgbCurvesToImageData,
  buildRgbCurveLookup,
  isRgbCurvesActive,
  mergeRgbCurves,
  moveRgbCurvePoint,
  removeRgbCurvePoint,
  sampleRgbCurve,
  updateRgbCurvePoint,
} from './colorRgbCurve'

describe('normalizeRgbCurveChannel', () => {
  it('migrates legacy 5-element tuples', () => {
    const migrated = normalizeRgbCurveChannel([0, 0.35, 0.6, 0.8, 1])
    expect(migrated).toHaveLength(5)
    expect(migrated[2]).toEqual({ x: 0.5, y: 0.6 })
  })

  it('normalizes free control points', () => {
    const migrated = normalizeRgbCurveChannel([
      { x: 1, y: 1 },
      { x: 0.3, y: 0.4 },
      { x: 0, y: 0 },
    ])
    expect(migrated[0]).toEqual({ x: 0, y: 0 })
    expect(migrated[migrated.length - 1]).toEqual({ x: 1, y: 1 })
    expect(migrated[1].x).toBeLessThan(migrated[2].x)
  })
})

describe('sampleRgbCurve', () => {
  it('returns identity mapping for default points', () => {
    expect(sampleRgbCurve(DEFAULT_RGB_CURVES.r, 0)).toBe(0)
    expect(sampleRgbCurve(DEFAULT_RGB_CURVES.r, 0.5)).toBeCloseTo(0.5)
    expect(sampleRgbCurve(DEFAULT_RGB_CURVES.r, 1)).toBe(1)
  })

  it('interpolates smoothly between control points', () => {
    const lifted = normalizeRgbCurveChannel([0, 0.35, 0.6, 0.8, 1])
    expect(sampleRgbCurve(lifted, 0.25)).toBeCloseTo(0.35)
    expect(sampleRgbCurve(lifted, 0.125)).toBeGreaterThan(0.1)
    expect(sampleRgbCurve(lifted, 0.125)).toBeLessThan(0.35)
  })

  it('stays monotonic for lifted midtones', () => {
    const lifted = updateRgbCurvePoint(DEFAULT_RGB_CURVES, 'r', 2, 0.7).r
    const samples = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    let prev = 0
    for (const input of samples) {
      const value = sampleRgbCurve(lifted, input)
      expect(value).toBeGreaterThanOrEqual(prev - 0.001)
      prev = value
    }
  })
})

describe('isRgbCurvesActive', () => {
  it('is false for identity curves', () => {
    expect(isRgbCurvesActive(DEFAULT_RGB_CURVES)).toBe(false)
  })

  it('is true when a channel is adjusted', () => {
    const curves = updateRgbCurvePoint(DEFAULT_RGB_CURVES, 'r', 2, 0.65)
    expect(isRgbCurvesActive(curves)).toBe(true)
  })
})

describe('applyRgbCurvesToImageData', () => {
  function makeGray(value: number): ImageData {
    return {
      data: new Uint8ClampedArray([value, value, value, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
  }

  it('lifts red channel midtones', () => {
    const curves = updateRgbCurvePoint(DEFAULT_RGB_CURVES, 'r', 2, 0.7)
    const imageData = makeGray(128)
    applyRgbCurvesToImageData(imageData, curves)
    expect(imageData.data[0]).toBeGreaterThan(128)
    expect(imageData.data[1]).toBe(128)
  })
})

describe('mergeRgbCurves', () => {
  it('adds overlay delta from identity', () => {
    const overlay = updateRgbCurvePoint(DEFAULT_RGB_CURVES, 'g', 2, 0.6)
    const merged = mergeRgbCurves(DEFAULT_RGB_CURVES, overlay)
    const mid = merged.g.find((point) => Math.abs(point.x - 0.5) < 0.001)
    expect(mid?.y).toBeCloseTo(0.6)
  })
})

describe('add/remove/move control points', () => {
  it('adds and removes interior points', () => {
    const added = addRgbCurvePoint(DEFAULT_RGB_CURVES, 'r', 0.4, 0.55)
    expect(added.r).toHaveLength(6)
    const index = added.r.findIndex((point) => Math.abs(point.x - 0.4) < 0.001)
    const removed = removeRgbCurvePoint(added, 'r', index)
    expect(removed.r).toHaveLength(5)
  })

  it('moves interior point in X and Y', () => {
    const moved = moveRgbCurvePoint(DEFAULT_RGB_CURVES, 'r', 2, 0.55, 0.62)
    const point = moved.r.find((p) => Math.abs(p.x - 0.55) < 0.001)
    expect(point?.y).toBeCloseTo(0.62)
  })
})

describe('normalizeRgbCurves', () => {
  it('migrates legacy project rgbCurves', () => {
    const normalized = normalizeRgbCurves({
      r: normalizeRgbCurveChannel([0, 0.25, 0.65, 0.75, 1]),
      g: normalizeRgbCurveChannel([0, 0.25, 0.5, 0.75, 1]),
      b: normalizeRgbCurveChannel([0, 0.25, 0.5, 0.75, 1]),
    })
    expect(normalized.r[2].y).toBeCloseTo(0.65)
    expect(normalized.g[2].y).toBeCloseTo(0.5)
  })

  it('migrates legacy tuples loaded from persisted projects', () => {
    const legacy = {
      r: [0, 0.25, 0.65, 0.75, 1],
      g: [0, 0.25, 0.5, 0.75, 1],
      b: [0, 0.25, 0.5, 0.75, 1],
    }
    const normalized = normalizeRgbCurves(legacy as never)
    expect(normalized.r[2].y).toBeCloseTo(0.65)
  })
})

describe('buildRgbCurveLookup', () => {
  it('builds 256 entries', () => {
    expect(buildRgbCurveLookup(DEFAULT_RGB_CURVES.r)).toHaveLength(256)
  })
})
