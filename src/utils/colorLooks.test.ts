import { describe, expect, it } from 'vitest'
import { COLOR_LOOK_PRESETS, colorAdjustmentsEqual, matchColorLookPreset } from './colorLooks'

describe('colorLooks', () => {
  it('プリセット数が 10 種', () => {
    expect(COLOR_LOOK_PRESETS).toHaveLength(10)
  })

  it('colorAdjustmentsEqual が近似値を判定する', () => {
    expect(colorAdjustmentsEqual(
      { brightness: 0.08, contrast: 0.05, saturation: 0.12 },
      { brightness: 0.0800001, contrast: 0.05, saturation: 0.12 },
    )).toBe(true)
  })

  it('matchColorLookPreset が一致プリセット id を返す', () => {
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS[2].color)).toBe('film')
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS.find((p) => p.id === 'wedding-warm')!.color)).toBe('wedding-warm')
    expect(matchColorLookPreset({ brightness: 0.3, contrast: 0, saturation: 0 })).toBeNull()
  })
})
