import { describe, expect, it } from 'vitest'
import { buildLuminanceWaveformPath, sampleLuminanceWaveform } from './colorScope'

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
})
