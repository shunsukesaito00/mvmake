import { describe, it, expect, beforeEach } from 'vitest'
import {
  AUDIO_NORMALIZE_STRESS_CLIP_COUNT,
  createAudioNormalizeStressProject,
  getAudioNormalizeStressStats,
  seedAudioNormalizeStress,
} from './audioNormalizeStressSetup'
import { applyVolumeNormalizeToAudio } from './audioNormalize'
import { useProjectStore } from '../store/projectStore'

describe('audioNormalizeStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createAudioNormalizeStressProject は BGM/ナレーション/キーフレーム付き3クリップを生成する', () => {
    const project = createAudioNormalizeStressProject()
    const stats = getAudioNormalizeStressStats(project)
    expect(stats.clipCount).toBe(AUDIO_NORMALIZE_STRESS_CLIP_COUNT)
    expect(project.mediaAssets).toHaveLength(AUDIO_NORMALIZE_STRESS_CLIP_COUNT)
    expect(project.mediaAssets.every((a) => a.type === 'audio' && a.blob.size > 44)).toBe(true)
  })

  it('seedAudioNormalizeStress 後に正規化適用を undo で復元できる', () => {
    const stats = seedAudioNormalizeStress()
    const before = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === stats.bgmClipId)
    if (!before || before.type !== 'audio') throw new Error('bgm clip missing')

    const { audio } = applyVolumeNormalizeToAudio(before.audio, stats.bgmPeak)
    useProjectStore.getState().updateClip(stats.bgmClipId, { audio }, true)
    useProjectStore.getState().undo()

    const after = useProjectStore.getState().project.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === stats.bgmClipId)
    if (!after || after.type !== 'audio') throw new Error('bgm clip missing after undo')
    expect(after.audio.volume).toBe(before.audio.volume)
  })
})
