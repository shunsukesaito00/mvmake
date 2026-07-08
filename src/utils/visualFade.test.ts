import { describe, expect, it } from 'vitest'
import { clampVisualFadeValues, getVisualFadeMultiplier } from './visualFade'

describe('getVisualFadeMultiplier', () => {
  it('フェードなしなら 1', () => {
    expect(getVisualFadeMultiplier(2, 5, 0, 0)).toBe(1)
  })

  it('フェードイン開始時は 0', () => {
    expect(getVisualFadeMultiplier(0, 5, 1, 0)).toBe(0)
  })

  it('フェードイン完了後は 1', () => {
    expect(getVisualFadeMultiplier(1, 5, 1, 0)).toBe(1)
  })

  it('フェードアウト終端で 0', () => {
    expect(getVisualFadeMultiplier(5, 5, 0, 1)).toBe(0)
  })

  it('中間点で線形補間', () => {
    expect(getVisualFadeMultiplier(0.5, 5, 1, 0)).toBeCloseTo(0.5)
    expect(getVisualFadeMultiplier(4.5, 5, 0, 1)).toBeCloseTo(0.5)
  })
})

describe('clampVisualFadeValues', () => {
  it('クリップ長の半分を超えない', () => {
    expect(clampVisualFadeValues(3, 3, 4)).toEqual({ fadeIn: 2, fadeOut: 2 })
  })
})
