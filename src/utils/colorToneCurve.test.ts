import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR } from '../types/project'
import {
  applyToneCurveToImageData,
  highlightWeight,
  isPixelToneCurveActive,
  midtoneWeight,
  shadowWeight,
} from './colorToneCurve'

describe('tone curve weights', () => {
  it('shadow weight peaks in dark tones', () => {
    expect(shadowWeight(0)).toBe(1)
    expect(shadowWeight(0.5)).toBe(0)
    expect(shadowWeight(1)).toBe(0)
  })

  it('highlight weight peaks in bright tones', () => {
    expect(highlightWeight(0)).toBe(0)
    expect(highlightWeight(0.5)).toBe(0)
    expect(highlightWeight(1)).toBe(1)
  })

  it('midtone weight peaks at center', () => {
    expect(midtoneWeight(0.5)).toBe(1)
    expect(midtoneWeight(0)).toBe(0)
    expect(midtoneWeight(1)).toBe(0)
  })
})

describe('isPixelToneCurveActive', () => {
  it('is false when all neutral', () => {
    expect(isPixelToneCurveActive({ ...DEFAULT_COLOR })).toBe(false)
  })

  it('is true when highlights adjusted', () => {
    expect(isPixelToneCurveActive({ ...DEFAULT_COLOR, highlights: 0.2 })).toBe(true)
  })
})

describe('applyToneCurveToImageData', () => {
  function makeGray(value: number): ImageData {
    return {
      data: new Uint8ClampedArray([value, value, value, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
  }

  it('lifts shadows on dark pixels', () => {
    const dark = makeGray(30)
    applyToneCurveToImageData(dark, 1, 0, 0)
    expect(dark.data[0]).toBeGreaterThan(30)
  })

  it('lifts highlights on bright pixels', () => {
    const bright = makeGray(220)
    applyToneCurveToImageData(bright, 0, 0, 1)
    expect(bright.data[0]).toBeGreaterThan(220)
  })

  it('leaves mid-gray unchanged when only highlights adjusted', () => {
    const mid = makeGray(128)
    applyToneCurveToImageData(mid, 0, 0, 1)
    expect(mid.data[0]).toBe(128)
  })
})
