import { describe, expect, it } from 'vitest'
import {
  buildVolumeCurvePath,
  keyframeToLanePoint,
  laneYToVolume,
  splitVolumeKeyframes,
  updateVolumeKeyframeList,
  volumeToLaneY,
} from './volumeKeyframesTimeline'

describe('volumeKeyframesTimeline', () => {
  it('volumeToLaneY / laneYToVolume が往復できる', () => {
    expect(volumeToLaneY(1, 24)).toBe(12)
    expect(laneYToVolume(12, 24)).toBeCloseTo(1)
  })

  it('keyframeToLanePoint がクリップ内位置を返す', () => {
    const point = keyframeToLanePoint({ id: '1', time: 2, volume: 2 }, 4, 100, 24)
    expect(point.x).toBe(50)
    expect(point.y).toBe(0)
  })

  it('buildVolumeCurvePath がキーフレーム間を結ぶ', () => {
    const path = buildVolumeCurvePath(
      {
        volume: 1,
        fadeIn: 0,
        fadeOut: 0,
        volumeKeyframes: [
          { id: '1', time: 0, volume: 0 },
          { id: '2', time: 2, volume: 2 },
        ],
      },
      2,
      40,
      24,
    )
    expect(path.startsWith('M')).toBe(true)
    expect(path).toContain('L')
  })

  it('updateVolumeKeyframeList で時間順に並べ替える', () => {
    const next = updateVolumeKeyframeList(
      [
        { id: 'a', time: 2, volume: 1 },
        { id: 'b', time: 0, volume: 0.5 },
      ],
      'a',
      { time: 3 },
    )
    expect(next.map((kf) => kf.id)).toEqual(['b', 'a'])
  })

  it('splitVolumeKeyframes が分割点で両クリップに再配分する', () => {
    const keyframes = [
      { id: 'a', time: 0, volume: 0.2 },
      { id: 'b', time: 2, volume: 1 },
      { id: 'c', time: 4, volume: 0.5 },
    ]
    const { first, second } = splitVolumeKeyframes(keyframes, 2)
    expect(first?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.map((kf) => kf.time)).toEqual([0, 2])
    expect(second?.[1].volume).toBe(0.5)
  })
})
