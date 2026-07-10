import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR } from '../types/project'
import { applyTemperatureTintToImageData, isPixelHslActive } from './colorHsl'

describe('isPixelHslActive', () => {
  it('is false for neutral color', () => {
    expect(isPixelHslActive({ ...DEFAULT_COLOR })).toBe(false)
  })

  it('is true when temperature is set', () => {
    expect(isPixelHslActive({ ...DEFAULT_COLOR, temperature: 0.2 })).toBe(true)
  })
})

describe('applyTemperatureTintToImageData', () => {
  function makeGray(value: number): ImageData {
    return {
      data: new Uint8ClampedArray([value, value, value, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    } as ImageData
  }

  it('warms neutral gray', () => {
    const imageData = makeGray(128)
    applyTemperatureTintToImageData(imageData, 1, 0)
    expect(imageData.data[0]).toBeGreaterThan(imageData.data[2])
  })

  it('applies magenta tint', () => {
    const imageData = makeGray(128)
    applyTemperatureTintToImageData(imageData, 0, 1)
    expect(imageData.data[0]).toBeGreaterThan(imageData.data[1])
    expect(imageData.data[2]).toBeGreaterThan(imageData.data[1])
  })
})
