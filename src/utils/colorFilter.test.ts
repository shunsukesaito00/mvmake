import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR } from '../types/project'
import { buildColorFilterCss } from './colorFilter'

describe('colorFilter', () => {
  const neutral = { ...DEFAULT_COLOR }

  it('buildColorFilterCss は補正なしで undefined', () => {
    expect(buildColorFilterCss(neutral)).toBeUndefined()
  })

  it('buildColorFilterCss は brightness/contrast/saturate を生成する', () => {
    const css = buildColorFilterCss({ ...neutral, brightness: 0.1, contrast: 0.2, saturation: -0.3 })
    expect(css).toContain('brightness(105%)')
    expect(css).toContain('contrast(110%)')
    expect(css).toContain('saturate(70%)')
  })

  it('buildColorFilterCss は hue-rotate を生成する', () => {
    const css = buildColorFilterCss({ ...neutral, hue: 0.5 })
    expect(css).toContain('hue-rotate(90deg)')
  })
})
