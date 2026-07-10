import { describe, expect, it } from 'vitest'
import { buildColorFilterCss } from './colorFilter'

describe('colorFilter', () => {
  it('buildColorFilterCss は補正なしで undefined', () => {
    expect(buildColorFilterCss({ brightness: 0, contrast: 0, saturation: 0 })).toBeUndefined()
  })

  it('buildColorFilterCss は brightness/contrast/saturate を生成する', () => {
    const css = buildColorFilterCss({ brightness: 0.1, contrast: 0.2, saturation: -0.3 })
    expect(css).toContain('brightness(105%)')
    expect(css).toContain('contrast(110%)')
    expect(css).toContain('saturate(70%)')
  })
})
