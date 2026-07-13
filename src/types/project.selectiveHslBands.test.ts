import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SELECTIVE_HSL,
  normalizeColorAdjustments,
  normalizeSelectiveHslBands,
} from './project'

describe('normalizeSelectiveHslBands', () => {
  it('migrates legacy selectiveHsl to a single band', () => {
    const bands = normalizeSelectiveHslBands({
      selectiveHsl: { ...DEFAULT_SELECTIVE_HSL, enabled: true, saturation: 0.3 },
    })
    expect(bands).toHaveLength(1)
    expect(bands[0].enabled).toBe(true)
    expect(bands[0].saturation).toBe(0.3)
  })

  it('normalizes up to three bands', () => {
    const bands = normalizeSelectiveHslBands({
      selectiveHslBands: [
        { enabled: true, targetHue: 10, hueRange: 20, hueShift: 0, saturation: 0.1, luminance: 0 },
        { enabled: false, targetHue: 120, hueRange: 30, hueShift: 0, saturation: 0, luminance: 0 },
        { enabled: true, targetHue: 200, hueRange: 40, hueShift: 0.2, saturation: 0, luminance: 0 },
        { enabled: true, targetHue: 300, hueRange: 40, hueShift: 0, saturation: 0, luminance: 0 },
      ],
    })
    expect(bands).toHaveLength(3)
    expect(bands[2].targetHue).toBe(200)
  })

  it('normalizeColorAdjustments uses selectiveHslBands', () => {
    const color = normalizeColorAdjustments({
      selectiveHsl: { ...DEFAULT_SELECTIVE_HSL, enabled: true },
    })
    expect(color.selectiveHslBands).toHaveLength(1)
    expect(color.selectiveHslBands[0].enabled).toBe(true)
  })
})
