import { describe, it, expect, beforeEach } from 'vitest'
import {
  MEDIA_REPLACE_STRESS_AUDIO_COUNT,
  MEDIA_REPLACE_STRESS_VISUAL_COUNT,
  createMediaReplaceStressProject,
  getMediaReplaceStressStats,
  seedMediaReplaceStress,
} from './mediaReplaceStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('mediaReplaceStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createMediaReplaceStressProject は映像10件+音声3件と2クリップを配置する', () => {
    const project = createMediaReplaceStressProject()
    const stats = getMediaReplaceStressStats(project)
    expect(project.mediaAssets).toHaveLength(MEDIA_REPLACE_STRESS_VISUAL_COUNT + MEDIA_REPLACE_STRESS_AUDIO_COUNT)
    expect(stats.visualAssetCount).toBe(MEDIA_REPLACE_STRESS_VISUAL_COUNT)
    expect(stats.imageCandidateCount).toBe(MEDIA_REPLACE_STRESS_VISUAL_COUNT)
    expect(stats.videoCandidateCount).toBe(MEDIA_REPLACE_STRESS_VISUAL_COUNT)
  })

  it('seedMediaReplaceStress でストアへ投入する', () => {
    const stats = seedMediaReplaceStress()
    expect(stats.imageCandidateCount).toBe(10)
    expect(useProjectStore.getState().project.tracks.find((t) => t.name === '映像 1')?.clips).toHaveLength(2)
  })

  it('差し替え先 ID が現在の mediaId と異なる', () => {
    const stats = getMediaReplaceStressStats(createMediaReplaceStressProject())
    expect(stats.imageReplaceTargetId).not.toBe(stats.imageClipMediaId)
    expect(stats.videoReplaceTargetId).not.toBe(stats.videoClipMediaId)
  })
})
