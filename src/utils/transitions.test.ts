import { describe, expect, it } from 'vitest'
import { TRANSITION_DEFINITIONS, easeSmoothstep } from './transitions'

describe('transitions', () => {
  it('定義済みトランジションが 11 種', () => {
    expect(TRANSITION_DEFINITIONS).toHaveLength(11)
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('dissolve')
    expect(TRANSITION_DEFINITIONS.map((d) => d.type)).toContain('iris')
  })

  it('easeSmoothstep が 0〜1 を滑らかに補間する', () => {
    expect(easeSmoothstep(0)).toBe(0)
    expect(easeSmoothstep(1)).toBe(1)
    expect(easeSmoothstep(0.5)).toBeGreaterThan(0.4)
    expect(easeSmoothstep(0.5)).toBeLessThan(0.6)
  })
})
