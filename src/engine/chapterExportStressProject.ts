import type { Project, TimelineMarker } from '../types/project'
import { createId } from '../utils/id'
import { getMarkerChapterRanges } from '../utils/markerExport'
import { getProjectDuration } from '../utils/time'
import {
  createStressTestProject,
  getStressTestProjectStats,
  STRESS_TEST_SPEC,
  type StressTestProjectStats,
} from './stressTestProject'

export const CHAPTER_EXPORT_STRESS_SPEC = {
  chapterCount: 6,
  chapterLabels: [
    'オープニング',
    '新郎プロフィール',
    '新婦プロフィール',
    '二人の歩み',
    '披露宴',
    'エンディング',
  ],
  /** 章マーカー配置間隔（秒）— 合計尺は imageClipCount × imageClipDurationSec に合わせる */
  chapterIntervalSec: 10,
} as const

/** E2E 用の短尺版（章 ZIP 実エクスポートスモーク向け） */
export const CHAPTER_EXPORT_E2E_SPEC = {
  imageClipCount: 52,
  textClipCount: 4,
  audioClipCount: 2,
  imageClipDurationSec: 0.25,
  chapterTimes: [0, 2, 4, 6, 8, 10] as const,
  chapterLabels: CHAPTER_EXPORT_STRESS_SPEC.chapterLabels,
} as const

export interface ChapterExportStressProjectStats extends StressTestProjectStats {
  chapterCount: number
  exportableChapterCount: number
}

function buildChapterMarkers(times: readonly number[], labels: readonly string[]): TimelineMarker[] {
  return times.map((time, index) => ({
    id: createId(),
    time,
    label: labels[index] ?? `章 ${index + 1}`,
    type: 'chapter' as const,
  }))
}

/**
 * 章 6・クリップ 55+ の章 ZIP 検証用プロジェクト。
 * stressTestProject をベースに章マーカーを付与（プレースホルダー資産・IndexedDB 不要）。
 */
export function createChapterExportStressProject(): Project {
  const project = createStressTestProject()
  const duration = getProjectDuration(project.tracks)
  const interval = duration / CHAPTER_EXPORT_STRESS_SPEC.chapterCount
  const times = Array.from({ length: CHAPTER_EXPORT_STRESS_SPEC.chapterCount }, (_, i) =>
    Math.min(i * interval, duration - 0.01),
  )

  return {
    ...project,
    id: createId(),
    name: '章ZIPストレステスト',
    markers: buildChapterMarkers(times, CHAPTER_EXPORT_STRESS_SPEC.chapterLabels),
  }
}

/** 短尺・52 クリップ。WebCodecs 対応環境での章 ZIP スモーク向け */
export function createChapterExportE2eProject(): Project {
  const duration =
    CHAPTER_EXPORT_E2E_SPEC.imageClipCount * CHAPTER_EXPORT_E2E_SPEC.imageClipDurationSec
  const base = createStressTestProject()
  const videoTrack = base.tracks.find((t) => t.type === 'video')
  const textTrack = base.tracks.find((t) => t.type === 'text')
  const audioTrack = base.tracks.find((t) => t.type === 'audio')
  if (!videoTrack || !textTrack || !audioTrack) {
    throw new Error('chapter export e2e project: missing tracks')
  }

  const assets = base.mediaAssets.slice(0, CHAPTER_EXPORT_E2E_SPEC.imageClipCount + CHAPTER_EXPORT_E2E_SPEC.audioClipCount)
  videoTrack.clips = videoTrack.clips
    .slice(0, CHAPTER_EXPORT_E2E_SPEC.imageClipCount)
    .map((clip, i) => ({
      ...clip,
      id: createId(),
      startTime: i * CHAPTER_EXPORT_E2E_SPEC.imageClipDurationSec,
      duration: CHAPTER_EXPORT_E2E_SPEC.imageClipDurationSec,
      sourceDuration: CHAPTER_EXPORT_E2E_SPEC.imageClipDurationSec,
    }))
  textTrack.clips = textTrack.clips.slice(0, CHAPTER_EXPORT_E2E_SPEC.textClipCount).map((clip, i) => ({
    ...clip,
    id: createId(),
    startTime: i * (duration / CHAPTER_EXPORT_E2E_SPEC.textClipCount),
    duration: 2,
    sourceDuration: 2,
  }))
  audioTrack.clips = audioTrack.clips.slice(0, CHAPTER_EXPORT_E2E_SPEC.audioClipCount).map((clip, i) => ({
    ...clip,
    id: createId(),
    startTime: i * (duration / CHAPTER_EXPORT_E2E_SPEC.audioClipCount),
    duration: duration / CHAPTER_EXPORT_E2E_SPEC.audioClipCount,
    sourceDuration: duration / CHAPTER_EXPORT_E2E_SPEC.audioClipCount,
  }))

  return {
    ...base,
    id: createId(),
    name: '章ZIP E2E',
    mediaAssets: assets,
    tracks: [videoTrack, textTrack, audioTrack],
    markers: buildChapterMarkers(CHAPTER_EXPORT_E2E_SPEC.chapterTimes, CHAPTER_EXPORT_E2E_SPEC.chapterLabels),
  }
}

export function getChapterExportStressProjectStats(project: Project): ChapterExportStressProjectStats {
  const base = getStressTestProjectStats(project)
  const chapters = getMarkerChapterRanges(project.markers ?? [], base.durationSec)
  return {
    ...base,
    chapterCount: chapters.length,
    exportableChapterCount: chapters.filter((c) => c.end - c.start >= 0.01).length,
  }
}

export function meetsChapterExportStressThreshold(stats: ChapterExportStressProjectStats): boolean {
  return (
    stats.totalClips >= 50 &&
    stats.chapterCount >= CHAPTER_EXPORT_STRESS_SPEC.chapterCount &&
    stats.exportableChapterCount >= CHAPTER_EXPORT_STRESS_SPEC.chapterCount
  )
}

/** stressTestProject の既定クリップ数（ドキュメント用） */
export const CHAPTER_STRESS_CLIP_COUNT =
  STRESS_TEST_SPEC.imageClipCount + STRESS_TEST_SPEC.textClipCount + STRESS_TEST_SPEC.audioClipCount
