import { describe, expect, it } from 'vitest'
import { COLOR_LOOK_PRESETS, colorAdjustmentsEqual, matchColorLookPreset } from './colorLooks'
import { DEFAULT_COLOR } from '../types/project'

describe('colorLooks', () => {
  it('プリセット数が 19 種', () => {
    expect(COLOR_LOOK_PRESETS).toHaveLength(19)
  })

  it('colorAdjustmentsEqual が近似値を判定する', () => {
    expect(colorAdjustmentsEqual(
      { ...DEFAULT_COLOR, brightness: 0.08, contrast: 0.05, saturation: 0.12 },
      { ...DEFAULT_COLOR, brightness: 0.0800001, contrast: 0.05, saturation: 0.12 },
    )).toBe(true)
  })

  it('rgbCurves が異なれば一致しない', () => {
    const film = COLOR_LOOK_PRESETS.find((p) => p.id === 'film')!.color
    const withRgbCurve = {
      ...film,
      rgbCurves: {
        ...film.rgbCurves,
        r: film.rgbCurves.r.map((point) => (
          point.x === 0.5 ? { ...point, y: 0.7 } : { ...point }
        )),
      },
    }
    expect(colorAdjustmentsEqual(film, withRgbCurve)).toBe(false)
    expect(matchColorLookPreset(withRgbCurve)).toBeNull()
  })

  it('rgbCurves まで一致すればマッチする', () => {
    const film = COLOR_LOOK_PRESETS.find((p) => p.id === 'film')!.color
    expect(matchColorLookPreset({ ...film })).toBe('film')
  })

  it('matchColorLookPreset が一致プリセット id を返す', () => {
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS[2].color)).toBe('film')
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS.find((p) => p.id === 'wedding-warm')!.color)).toBe('wedding-warm')
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS.find((p) => p.id === 'romantic-sunset')!.color)).toBe('romantic-sunset')
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS.find((p) => p.id === 'sakura-pink')!.color)).toBe('sakura-pink')
    expect(matchColorLookPreset(COLOR_LOOK_PRESETS.find((p) => p.id === 'bridal-white')!.color)).toBe('bridal-white')
    expect(matchColorLookPreset({ ...DEFAULT_COLOR, brightness: 0.3 })).toBeNull()
  })
})
