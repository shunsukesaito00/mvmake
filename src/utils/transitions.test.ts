import { describe, expect, it } from 'vitest'
import { TRANSITION_DEFINITIONS, easeSmoothstep } from './transitions'

describe('transitions', () => {
  it('定義済みトランジションが 29 種', () => {
    expect(TRANSITION_DEFINITIONS).toHaveLength(29)
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('dissolve')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('iris')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('ribbonCut')
  })

  it('全トランジションに category がある', () => {
    for (const def of TRANSITION_DEFINITIONS) {
      expect(['dissolve', 'wedding', 'motion']).toContain(def.category)
    }
  })

  it('easeSmoothstep が 0〜1 を滑らかに補間する', () => {
    expect(easeSmoothstep(0)).toBe(0)
    expect(easeSmoothstep(1)).toBe(1)
    expect(easeSmoothstep(0.5)).toBeGreaterThan(0.4)
    expect(easeSmoothstep(0.5)).toBeLessThan(0.6)
  })
})
