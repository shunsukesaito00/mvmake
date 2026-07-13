import { describe, expect, it } from 'vitest'
import {
  clampPlaybackShuttleRate,
  computeShuttleTimelineTime,
  cycleForwardShuttleRate,
  cycleReverseShuttleRate,
  formatShuttleRateLabel,
  isReverseShuttleRate,
  shouldShowShuttleRate,
} from './playbackShuttle'

describe('playbackShuttle', () => {
  it('cycleForwardShuttleRate advances 1→2→4 and caps at 4', () => {
    expect(cycleForwardShuttleRate(1)).toBe(2)
    expect(cycleForwardShuttleRate(2)).toBe(4)
    expect(cycleForwardShuttleRate(4)).toBe(4)
  })

  it('cycleForwardShuttleRate switches from reverse to forward 1x', () => {
    expect(cycleForwardShuttleRate(-2)).toBe(1)
  })

  it('cycleReverseShuttleRate advances -1→-2→-4 and caps at -4', () => {
    expect(cycleReverseShuttleRate(-1)).toBe(-2)
    expect(cycleReverseShuttleRate(-2)).toBe(-4)
    expect(cycleReverseShuttleRate(-4)).toBe(-4)
  })

  it('cycleReverseShuttleRate switches from forward to reverse -1x', () => {
    expect(cycleReverseShuttleRate(2)).toBe(-1)
  })

  it('clampPlaybackShuttleRate snaps to supported rates', () => {
    expect(clampPlaybackShuttleRate(0)).toBe(1)
    expect(clampPlaybackShuttleRate(3)).toBe(2)
    expect(clampPlaybackShuttleRate(8)).toBe(4)
    expect(clampPlaybackShuttleRate(-3)).toBe(-2)
    expect(clampPlaybackShuttleRate(-8)).toBe(-4)
  })

  it('computeShuttleTimelineTime scales elapsed wall time by rate', () => {
    const forward = computeShuttleTimelineTime(10, 1000, 2, 2500)
    expect(forward).toBeCloseTo(13, 5)
    const reverse = computeShuttleTimelineTime(10, 1000, -2, 2500)
    expect(reverse).toBeCloseTo(7, 5)
  })

  it('formats shuttle labels and visibility', () => {
    expect(formatShuttleRateLabel(-2)).toBe('◀ 2x')
    expect(formatShuttleRateLabel(4)).toBe('4x')
    expect(isReverseShuttleRate(-1)).toBe(true)
    expect(shouldShowShuttleRate(1)).toBe(false)
    expect(shouldShowShuttleRate(-1)).toBe(true)
  })
})
