import { describe, expect, it } from 'vitest'
import { TRANSITION_DEFINITIONS, easeSmoothstep } from './transitions'

describe('transitions', () => {
  it('定義済みトランジションが 17 種', () => {
    expect(TRANSITION_DEFINITIONS).toHaveLength(17)
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('dissolve')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('iris')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('fadeWarm')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('lightLeak')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('softFocus')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('crossDissolveWarm')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('filmBurn')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('gentleZoom')
  })

  it('easeSmoothstep が 0〜1 を滑らかに補間する', () => {
    expect(easeSmoothstep(0)).toBe(0)
    expect(easeSmoothstep(1)).toBe(1)
    expect(easeSmoothstep(0.5)).toBeGreaterThan(0.4)
    expect(easeSmoothstep(0.5)).toBeLessThan(0.6)
  })
})
