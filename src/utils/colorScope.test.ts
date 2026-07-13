import { describe, expect, it } from 'vitest'
import {
  buildLuminanceWaveformPath,
  mapVectorScopeToCanvas,
  rgbToChromaUv,
  sampleLuminanceWaveform,
  sampleVectorScopePoints,
} from './colorScope'

describe('colorScope', () => {
  it('samples luminance waveform bins from image data', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255,
    ])
    const imageData = { data, width: 2, height: 1, colorSpace: 'srgb' } as ImageData
    const values = sampleLuminanceWaveform(imageData, 2)
    expect(values[0]).toBeCloseTo(0, 1)
    expect(values[1]).toBeCloseTo(1, 1)
    expect(buildLuminanceWaveformPath(values, 100, 40)).toContain('M')
  })

  it('samples vector scope chroma points from image data', () => {
    const red = rgbToChromaUv(255, 0, 0)
    expect(red.v).toBeGreaterThan(0.3)
    expect(red.u).toBeLessThan(0)

    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
    ])
    const imageData = { data, width: 2, height: 1, colorSpace: 'srgb' } as ImageData
    const points = sampleVectorScopePoints(imageData, 10)
    expect(points).toHaveLength(2)

    const mapped = mapVectorScopeToCanvas(0, 0.2, 100)
    expect(mapped.x).toBeCloseTo(50, 1)
    expect(mapped.y).toBeCloseTo(32, 0)
  })
})
