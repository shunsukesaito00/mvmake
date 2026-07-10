import { describe, expect, it } from 'vitest'
import { TRANSITION_DEFINITIONS, easeSmoothstep } from './transitions'

describe('transitions', () => {
  it('定義済みトランジションが 26 種', () => {
    expect(TRANSITION_DEFINITIONS).toHaveLength(26)
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('dissolve')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('iris')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('fadeWarm')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('lightLeak')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('softFocus')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('crossDissolveWarm')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('filmBurn')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('gentleZoom')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('petalFall')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('goldenShimmer')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('softWipe')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('candleGlow')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('dreamyBlur')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('paperConfetti')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('silkFade')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('starlight')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('laceReveal')
  })

  it('easeSmoothstep が 0〜1 を滑らかに補間する', () => {
    expect(easeSmoothstep(0)).toBe(0)
    expect(easeSmoothstep(1)).toBe(1)
    expect(easeSmoothstep(0.5)).toBeGreaterThan(0.4)
    expect(easeSmoothstep(0.5)).toBeLessThan(0.6)
  })
})
