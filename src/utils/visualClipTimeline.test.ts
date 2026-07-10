import { describe, expect, it } from 'vitest'
import { getCandidateVisualClipIndices } from './visualClipTimeline'

describe('getCandidateVisualClipIndices', () => {
  const sorted = Array.from({ length: 100 }, (_, i) => ({
    startTime: i * 8,
    duration: 8,
  }))

  it('returns a small window around the active clip', () => {
    const indices = getCandidateVisualClipIndices(sorted, 400)
    expect(indices.length).toBeLessThanOrEqual(4)
    expect(indices).toContain(50)
  })

  it('includes previous clip near transition boundary', () => {
    const indices = getCandidateVisualClipIndices(sorted, 80)
    expect(indices).toContain(9)
    expect(indices).toContain(10)
  })

  it('handles start and end of timeline', () => {
    expect(getCandidateVisualClipIndices(sorted, 0)).toEqual([0, 1, 2])
    expect(getCandidateVisualClipIndices(sorted, 900)[0]).toBeGreaterThanOrEqual(97)
  })
})
