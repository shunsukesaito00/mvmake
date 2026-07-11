import { describe, it, expect, beforeEach } from 'vitest'
import {
  VOLUME_KEYFRAME_CORE_AUDIO_MID_TIME,
  VOLUME_KEYFRAME_CORE_SPLIT_AT,
  VOLUME_KEYFRAME_CORE_VIDEO_MID_TIME,
  VOLUME_KEYFRAME_STRESS_AUDIO_KF_COUNT,
  VOLUME_KEYFRAME_STRESS_CLIP_COUNT,
  VOLUME_KEYFRAME_STRESS_VIDEO_KF_COUNT,
  countVolumeAutomationEvents,
  createVolumeKeyframeStressProject,
  getVolumeAtClipLocalTime,
  getVolumeKeyframeSplitCounts,
  getVolumeKeyframeStressStats,
  seedVolumeKeyframeStress,
  updateClipVolumeKeyframe,
} from './volumeKeyframeStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('volumeKeyframeStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createVolumeKeyframeStressProject は音声4KF・動画2KFを生成する', () => {
    const project = createVolumeKeyframeStressProject()
    const stats = getVolumeKeyframeStressStats(project)
    expect(stats.clipCount).toBe(VOLUME_KEYFRAME_STRESS_CLIP_COUNT)
    expect(stats.audioKeyframeCount).toBe(VOLUME_KEYFRAME_STRESS_AUDIO_KF_COUNT)
    expect(stats.videoKeyframeCount).toBe(VOLUME_KEYFRAME_STRESS_VIDEO_KF_COUNT)
    expect(stats.automationEventCount).toBeGreaterThanOrEqual(2)
  })

  it('中間時刻の補間音量が Audio/Video で一致する', () => {
    const stats = seedVolumeKeyframeStress()
    expect(getVolumeAtClipLocalTime(stats.audioClipId, stats.audioMidLocalTime)).toBeCloseTo(stats.audioMidVolume, 5)
    expect(getVolumeAtClipLocalTime(stats.videoClipId, stats.videoMidLocalTime)).toBeCloseTo(stats.videoMidVolume, 5)
    expect(stats.audioMidVolume).toBeCloseTo(0.3, 2)
    expect(stats.videoMidVolume).toBeCloseTo(0.6, 2)
  })

  it('scheduleVolumeAutomation がキーフレーム区間をスケジュールする', () => {
    const project = createVolumeKeyframeStressProject()
    const audioClip = project.tracks.find((t) => t.type === 'audio')?.clips[0]
    if (!audioClip || audioClip.type !== 'audio') throw new Error('clip missing')
    const count = countVolumeAutomationEvents(audioClip.audio, audioClip.duration)
    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('分割点で2+2に再配分される', () => {
    const project = createVolumeKeyframeStressProject()
    const audioClip = project.tracks.find((t) => t.type === 'audio')?.clips[0]
    if (!audioClip || audioClip.type !== 'audio') throw new Error('clip missing')
    const counts = getVolumeKeyframeSplitCounts(audioClip.audio.volumeKeyframes, VOLUME_KEYFRAME_CORE_SPLIT_AT)
    expect(counts.firstCount).toBe(2)
    expect(counts.secondCount).toBe(2)
  })

  it('キーフレーム変更を undo で復元できる', () => {
    const stats = seedVolumeKeyframeStress()
    const before = getVolumeAtClipLocalTime(stats.audioClipId, VOLUME_KEYFRAME_CORE_AUDIO_MID_TIME)
    updateClipVolumeKeyframe(stats.audioClipId, stats.firstAudioKeyframeId, { volume: 1.9 })
    expect(getVolumeAtClipLocalTime(stats.audioClipId, 0)).toBe(1.9)

    useProjectStore.getState().undo()
    expect(getVolumeAtClipLocalTime(stats.audioClipId, VOLUME_KEYFRAME_CORE_AUDIO_MID_TIME)).toBeCloseTo(before, 5)
  })

  it('splitClipAt 後も音声クリップにキーフレームが残る', () => {
    const stats = seedVolumeKeyframeStress()
    useProjectStore.getState().setSelectedClipId(stats.audioClipId)
    useProjectStore.getState().splitClipAt(stats.audioClipId, stats.splitAt)

    const clips = useProjectStore.getState().project.tracks
      .find((t) => t.type === 'audio')?.clips
      .filter((c) => c.type === 'audio') ?? []
    expect(clips).toHaveLength(2)
    const counts = clips.map((c) => c.audio.volumeKeyframes?.length ?? 0)
    expect(counts).toEqual([2, 2])
  })
})
