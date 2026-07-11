import { describe, expect, it } from 'vitest'
import {
  CHAPTER_EXPORT_E2E_SPEC,
  CHAPTER_EXPORT_STRESS_SPEC,
  CHAPTER_STRESS_CLIP_COUNT,
  createChapterExportE2eProject,
  createChapterExportStressProject,
  getChapterExportStressProjectStats,
  meetsChapterExportStressThreshold,
} from './chapterExportStressProject'

describe('chapterExportStressProject', () => {
  it('ストレス版は 50+ クリップと 6 章を満たす', () => {
    const project = createChapterExportStressProject()
    const stats = getChapterExportStressProjectStats(project)
    expect(stats.totalClips).toBeGreaterThanOrEqual(50)
    expect(stats.chapterCount).toBe(CHAPTER_EXPORT_STRESS_SPEC.chapterCount)
    expect(stats.exportableChapterCount).toBe(CHAPTER_EXPORT_STRESS_SPEC.chapterCount)
    expect(meetsChapterExportStressThreshold(stats)).toBe(true)
    expect(stats.totalClips).toBe(CHAPTER_STRESS_CLIP_COUNT)
  })

  it('E2E 版は 52 映像クリップと 6 章の短尺構成', () => {
    const project = createChapterExportE2eProject()
    const stats = getChapterExportStressProjectStats(project)
    expect(stats.imageClips).toBe(CHAPTER_EXPORT_E2E_SPEC.imageClipCount)
    expect(stats.chapterCount).toBe(CHAPTER_EXPORT_E2E_SPEC.chapterTimes.length)
    expect(stats.durationSec).toBeGreaterThan(10)
    expect(stats.durationSec).toBeLessThan(20)
  })
})
