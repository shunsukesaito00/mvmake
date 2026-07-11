import { describe, it, expect, beforeEach } from 'vitest'
import {
  STRUCTURED_WEDDING_CHAPTER_LABELS,
  STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT,
  STRUCTURED_WEDDING_TEXT_CLIP_COUNT,
  STRUCTURED_WEDDING_TOTAL_CLIP_COUNT,
  getStructuredWeddingTemplateStressStats,
  seedStructuredWeddingTemplateStress,
} from './structuredWeddingTemplateStressSetup'
import { STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT } from './markerEdit'
import { useProjectStore } from '../store/projectStore'

describe('structuredWeddingTemplateStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('seedStructuredWeddingTemplateStress は11クリップ・5章マーカーを配置する', () => {
    const stats = seedStructuredWeddingTemplateStress()
    expect(stats.textClipCount).toBe(STRUCTURED_WEDDING_TEXT_CLIP_COUNT)
    expect(stats.photoGuideCount).toBe(STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT)
    expect(stats.markerCount).toBe(STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT)
    expect(stats.totalClipCount).toBe(STRUCTURED_WEDDING_TOTAL_CLIP_COUNT)
    expect(stats.projectName).toBe('結婚式ムービー')
    expect(stats.chapterLabels).toEqual([...STRUCTURED_WEDDING_CHAPTER_LABELS])
  })

  it('適用を undo で空プロジェクトに復元できる', () => {
    seedStructuredWeddingTemplateStress()
    useProjectStore.getState().undo()
    const stats = getStructuredWeddingTemplateStressStats()
    expect(stats.totalClipCount).toBe(0)
    expect(stats.markerCount).toBe(0)
  })

  it('undo 後に再適用すると11クリップ・5章マーカーが復元される', () => {
    seedStructuredWeddingTemplateStress()
    useProjectStore.getState().undo()
    const stats = seedStructuredWeddingTemplateStress()
    expect(stats.totalClipCount).toBe(STRUCTURED_WEDDING_TOTAL_CLIP_COUNT)
    expect(stats.markerCount).toBe(STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT)
    expect(stats.chapterLabels).toContain('新郎プロフィール')
  })
})
