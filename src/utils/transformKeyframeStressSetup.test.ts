import { describe, it, expect, beforeEach } from 'vitest'
import {
  TRANSFORM_KEYFRAME_STRESS_COUNT,
  TRANSFORM_KEYFRAME_STRESS_SPLIT_AT,
  createTransformKeyframeStressProject,
  getTransformKeyframeSplitCounts,
  getTransformKeyframeStressStats,
  seedTransformKeyframeStress,
} from './transformKeyframeStressSetup'
import { getTransformAtLocalTime } from './transformKeyframes'
import { useProjectStore } from '../store/projectStore'

describe('transformKeyframeStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createTransformKeyframeStressProject は8キーフレーム付き映像クリップを生成する', () => {
    const project = createTransformKeyframeStressProject()
    const stats = getTransformKeyframeStressStats(project)
    expect(stats.keyframeCount).toBe(TRANSFORM_KEYFRAME_STRESS_COUNT)
    expect(stats.clipDuration).toBe(10)
  })

  it('分割点で4+4に再配分される', () => {
    const project = createTransformKeyframeStressProject()
    const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.type === 'image')
    if (!clip || clip.type !== 'image') throw new Error('clip missing')
    const counts = getTransformKeyframeSplitCounts(clip.transformKeyframes, TRANSFORM_KEYFRAME_STRESS_SPLIT_AT)
    expect(counts.firstCount).toBe(4)
    expect(counts.secondCount).toBe(4)
  })

  it('中間時刻の補間値が stats と一致する', () => {
    const stats = seedTransformKeyframeStress()
    const clip = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === stats.clipId)
    if (!clip || clip.type !== 'image') throw new Error('clip missing')

    const mid = getTransformAtLocalTime(
      clip.transform,
      clip.transformKeyframes,
      stats.midLocalTime,
      clip.duration,
    )
    expect(mid.x).toBeCloseTo(stats.expectedMidX, 5)
    expect(mid.opacity).toBeCloseTo(stats.expectedMidOpacity, 5)
  })

  it('splitClipAt 後も両クリップにキーフレームが残る', () => {
    const stats = seedTransformKeyframeStress()
    useProjectStore.getState().setSelectedClipId(stats.clipId)
    useProjectStore.getState().splitClipAt(stats.clipId, stats.splitAt)

    const clips = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .filter((c) => c.type === 'image')
    expect(clips).toHaveLength(2)
    const counts = clips.map((c) => (c.type === 'image' ? c.transformKeyframes?.length ?? 0 : 0))
    expect(counts).toEqual([4, 4])
  })
})
