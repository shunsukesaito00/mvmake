import { describe, expect, it } from 'vitest'
import { getTextBackgroundRect, hasTextBackground } from './textBackground'

describe('textBackground', () => {
  it('背景色があるときのみ字幕帯を描画対象にする', () => {
    expect(hasTextBackground({ backgroundColor: 'rgba(0,0,0,0.6)' })).toBe(true)
    expect(hasTextBackground({ backgroundColor: '' })).toBe(false)
  })

  it('中央揃えテキストの背景矩形を計算する', () => {
    const rect = getTextBackgroundRect([100], 24, 80, 200, 'center', 8)
    expect(rect.width).toBe(96)
    expect(rect.height).toBe(40)
    expect(rect.x).toBe(200 - 40 - 8)
    expect(rect.y).toBe(100 - 12 - 8)
  })

  it('複数行の背景高さを行数に合わせる', () => {
    const rect = getTextBackgroundRect([90, 114], 24, 60, 100, 'left', 10)
    expect(rect.height).toBe(24 + 24 + 20)
  })
})
