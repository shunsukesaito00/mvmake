import { describe, expect, it } from 'vitest'
import { DEFAULT_SELECTIVE_HSL } from '../types/project'
import {
  applySelectiveHslBandsToImageData,
  applySelectiveHslToImageData,
  isAnySelectiveHslActive,
  isSelectiveHslActive,
} from './colorSelectiveHsl'

function makeRgbImage(r: number, g: number, b: number): ImageData {
  return {
    data: new Uint8ClampedArray([r, g, b, 255]),
    width: 1,
    height: 1,
    colorSpace: 'srgb',
  } as ImageData
}

describe('colorSelectiveHsl', () => {
  it('is inactive when disabled', () => {
    expect(isSelectiveHslActive(DEFAULT_SELECTIVE_HSL)).toBe(false)
  })

  it('shifts matched hue pixels when enabled', () => {
    const image = makeRgbImage(255, 80, 40)
    const before = new Uint8ClampedArray(image.data)
    applySelectiveHslToImageData(image, {
      ...DEFAULT_SELECTIVE_HSL,
      enabled: true,
      targetHue: 20,
      hueRange: 40,
      hueShift: 0.5,
      saturation: 0.2,
      luminance: 0.1,
    })
    expect(image.data).not.toEqual(before)
  })

  it('applies multiple active bands in sequence', () => {
    const image = makeRgbImage(255, 80, 40)
    const before = new Uint8ClampedArray(image.data)
    applySelectiveHslBandsToImageData(image, [
      {
        ...DEFAULT_SELECTIVE_HSL,
        enabled: true,
        targetHue: 20,
        hueRange: 40,
        hueShift: 0.2,
        saturation: 0,
        luminance: 0,
      },
      {
        ...DEFAULT_SELECTIVE_HSL,
        enabled: true,
        targetHue: 20,
        hueRange: 40,
        hueShift: 0,
        saturation: 0.3,
        luminance: 0,
      },
    ])
    expect(image.data).not.toEqual(before)
    expect(isAnySelectiveHslActive([
      { ...DEFAULT_SELECTIVE_HSL, enabled: false },
      { ...DEFAULT_SELECTIVE_HSL, enabled: true, saturation: 0.2 },
    ])).toBe(true)
  })
})
