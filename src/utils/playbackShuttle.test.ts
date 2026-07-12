import { describe, expect, it } from 'vitest'
import {
  clampPlaybackShuttleRate,
  computeShuttleTimelineTime,
  cycleForwardShuttleRate,
} from './playbackShuttle'

describe('playbackShuttle', () => {
  it('cycleForwardShuttleRate advances 1→2→4 and caps at 4', () => {
    expect(cycleForwardShuttleRate(1)).toBe(2)
    expect(cycleForwardShuttleRate(2)).toBe(4)
    expect(cycleForwardShuttleRate(4)).toBe(4)
  })

  it('clampPlaybackShuttleRate snaps to supported rates', () => {
    expect(clampPlaybackShuttleRate(0)).toBe(1)
    expect(clampPlaybackShuttleRate(3)).toBe(2)
    expect(clampPlaybackShuttleRate(8)).toBe(4)
  })

  it('computeShuttleTimelineTime scales elapsed wall time by rate', () => {
    const t = computeShuttleTimelineTime(10, 1000, 2, 2500)
    expect(t).toBeCloseTo(13, 5)
  })
})
