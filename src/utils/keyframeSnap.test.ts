import { describe, expect, it } from 'vitest'
import {
  buildLocalKeyframeTimeSnapPoints,
  keyframeTimeSnapThreshold,
  snapLocalKeyframeTime,
  snapVolume,
} from './keyframeSnap'

describe('keyframeSnap', () => {
  it('buildLocalKeyframeTimeSnapPoints がグローバル点をローカルへ変換する', () => {
    const points = buildLocalKeyframeTimeSnapPoints(10, 20, [10, 25, 35], [5])
    expect(points).toContain(0)
    expect(points).toContain(20)
    expect(points).toContain(0) // 10 global -> 0 local
    expect(points).toContain(15) // 25 global
    expect(points).toContain(5) // sibling
    expect(points).not.toContain(25) // 35 global is past clip end
  })

  it('snapLocalKeyframeTime が近傍のスナップ点へ吸着する', () => {
    const result = snapLocalKeyframeTime(4.97, 0, 10, [5], [2], 200)
    expect(result.time).toBe(5)
    expect(result.snapped).toBe(true)
  })

  it('keyframeTimeSnapThreshold がズームに応じて狭くなる', () => {
    expect(keyframeTimeSnapThreshold(50)).toBeGreaterThan(keyframeTimeSnapThreshold(200))
  })

  it('snapVolume が 100% 付近へスナップする', () => {
    const result = snapVolume(0.98, 24)
    expect(result.volume).toBe(1)
    expect(result.snapped).toBe(true)
  })
})
