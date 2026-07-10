import { describe, expect, it } from 'vitest'
import { DEFAULT_RGB_CURVES, RGB_CURVE_INPUTS } from '../types/project'
import {
  applyRgbCurvesToImageData,
  buildRgbCurveLookup,
  isRgbCurvesActive,
  mergeRgbCurves,
  sampleRgbCurve,
  updateRgbCurvePoint,
} from './colorRgbCurve'

describe('sampleRgbCurve', () => {
  it('returns identity mapping for default points', () => {
    expect(sampleRgbCurve(RGB_CURVE_INPUTS, 0)).toBe(0)
    expect(sampleRgbCurve(RGB_CURVE_INPUTS, 0.5)).toBe(0.5)
    expect(sampleRgbCurve(RGB_CURVE_INPUTS, 1)).toBe(1)
  })

  it('interpolates between control points', () => {
    const lifted: [number, number, number, number, number] = [0, 0.35, 0.6, 0.8, 1]
    expect(sampleRgbCurve(lifted, 0.25)).toBeCloseTo(0.35)
    expect(sampleRgbCurve(lifted, 0.125)).toBeCloseTo(0.175)
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
    expect(merged.g[2]).toBeCloseTo(0.6)
  })
})

describe('buildRgbCurveLookup', () => {
  it('builds 256 entries', () => {
    expect(buildRgbCurveLookup(RGB_CURVE_INPUTS)).toHaveLength(256)
  })
})
