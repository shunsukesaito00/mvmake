import { describe, it, expect, beforeEach } from 'vitest'
import {
  VOLUME_KEYFRAME_STRESS_SPLIT_AT,
  VOLUME_KEYFRAME_TIMELINE_STRESS_COUNT,
  createVolumeKeyframeTimelineStressProject,
  getVolumeAtClipLocalTime,
  getVolumeKeyframeSplitCounts,
  getVolumeKeyframeTimelineStressStats,
  seedVolumeKeyframeTimelineStress,
  updateVolumeKeyframeById,
} from './volumeKeyframeTimelineStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('volumeKeyframeTimelineStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createVolumeKeyframeTimelineStressProject は6キーフレーム付き音声クリップを生成する', () => {
    const project = createVolumeKeyframeTimelineStressProject()
    const stats = getVolumeKeyframeTimelineStressStats(project)
    expect(stats.keyframeCount).toBe(VOLUME_KEYFRAME_TIMELINE_STRESS_COUNT)
    expect(stats.clipDuration).toBe(8)
    expect(stats.hasCurvePath).toBe(true)
    expect(stats.laneHeight).toBe(24)
  })

  it('分割点で3+3に再配分される', () => {
    const project = createVolumeKeyframeTimelineStressProject()
    const clip = project.tracks.find((t) => t.type === 'audio')?.clips[0]
    if (!clip || clip.type !== 'audio') throw new Error('clip missing')
    const counts = getVolumeKeyframeSplitCounts(clip.audio.volumeKeyframes, VOLUME_KEYFRAME_STRESS_SPLIT_AT)
    expect(counts.firstCount).toBe(3)
    expect(counts.secondCount).toBe(3)
  })

  it('中間時刻の補間音量が stats と一致する', () => {
    const stats = seedVolumeKeyframeTimelineStress()
    const volume = getVolumeAtClipLocalTime(stats.clipId, stats.midLocalTime)
    expect(volume).toBeCloseTo(stats.expectedMidVolume, 5)
    expect(volume).toBeGreaterThan(0.2)
    expect(volume).toBeLessThan(1)
  })

  it('キーフレーム変更を undo で復元できる', () => {
    const stats = seedVolumeKeyframeTimelineStress()
    const before = getVolumeAtClipLocalTime(stats.clipId, 0)
    updateVolumeKeyframeById(stats.clipId, stats.firstKeyframeId, { volume: 1.8 })
    expect(getVolumeAtClipLocalTime(stats.clipId, 0)).toBe(1.8)

    useProjectStore.getState().undo()
    expect(getVolumeAtClipLocalTime(stats.clipId, 0)).toBeCloseTo(before, 5)
  })

  it('splitClipAt 後も両クリップにキーフレームが残る', () => {
    const stats = seedVolumeKeyframeTimelineStress()
    useProjectStore.getState().setSelectedClipId(stats.clipId)
    useProjectStore.getState().splitClipAt(stats.clipId, stats.splitAt)

    const clips = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .filter((c) => c.type === 'audio')
    expect(clips).toHaveLength(2)
    const counts = clips.map((c) => (c.type === 'audio' ? c.audio.volumeKeyframes?.length ?? 0 : 0))
    expect(counts).toEqual([3, 3])
  })
})
