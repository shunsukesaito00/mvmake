import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clampTimelinePixelsPerSecond,
  computeFitTimelinePixelsPerSecond,
  computeTimelineScrollLeftForTime,
  computeZoomToClipPixelsPerSecond,
  isTimelineTimeVisible,
  TIMELINE_HEADER_WIDTH,
} from './timelineZoom'
import {
  loadTimelinePixelsPerSecond,
  saveTimelinePixelsPerSecond,
} from '../persistence/timelineZoom'

describe('timelineZoom utils', () => {
  it('clampTimelinePixelsPerSecond は範囲内に収める', () => {
    expect(clampTimelinePixelsPerSecond(10)).toBe(20)
    expect(clampTimelinePixelsPerSecond(150)).toBe(150)
    expect(clampTimelinePixelsPerSecond(400)).toBe(300)
  })

  it('computeFitTimelinePixelsPerSecond は全体が収まる倍率を返す', () => {
    const pps = computeFitTimelinePixelsPerSecond(10, 1000)
    expect(pps).toBeGreaterThan(0)
    expect(10 * pps).toBeLessThanOrEqual(1000 - TIMELINE_HEADER_WIDTH)

    const longPps = computeFitTimelinePixelsPerSecond(600, 1000)
    expect(longPps).toBe(20)
  })

  it('computeZoomToClipPixelsPerSecond は短いクリップほど高倍率になる', () => {
    const short = computeZoomToClipPixelsPerSecond(2, 1000)
    const long = computeZoomToClipPixelsPerSecond(60, 1000)
    expect(short).toBeGreaterThan(long)
  })

  it('computeTimelineScrollLeftForTime は再生位置を中央に置く', () => {
    expect(computeTimelineScrollLeftForTime(10, 80, 800)).toBe(10 * 80 + TIMELINE_HEADER_WIDTH - 400)
  })

  it('isTimelineTimeVisible は表示範囲を判定する', () => {
    expect(isTimelineTimeVisible(5, 80, 800, 0)).toBe(true)
    expect(isTimelineTimeVisible(100, 80, 800, 0)).toBe(false)
  })
})

describe('timelineZoom persistence', () => {
  const store: Record<string, string> = {}

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
    })
  })

  it('ズーム倍率を保存・読み込みできる', () => {
    expect(loadTimelinePixelsPerSecond()).toBeNull()
    saveTimelinePixelsPerSecond(120)
    expect(loadTimelinePixelsPerSecond()).toBe(120)
  })
})
