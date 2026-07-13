import type { ExportQuality } from '../engine/exporter'

export type ExportMemoryPressureLevel = 'none' | 'caution' | 'high'

export interface ExportMemoryPressure {
  level: ExportMemoryPressureLevel
  message: string | null
}

const UHD_PIXELS = 3840 * 2160
const LONG_DURATION_SEC = 600
const CHAPTER_BATCH_CAUTION = 4

/** 書き出し前のメモリ圧迫リスクを簡易見積もりする */
export function estimateExportMemoryPressure(params: {
  width: number
  height: number
  durationSec: number
  quality: ExportQuality
  chapterCount?: number
}): ExportMemoryPressure {
  const pixels = params.width * params.height
  const is4k = pixels >= UHD_PIXELS
  const isLong = params.durationSec >= LONG_DURATION_SEC
  const chapterCount = params.chapterCount ?? 0
  const isChapterHeavy = chapterCount >= CHAPTER_BATCH_CAUTION

  if (is4k && (isLong || isChapterHeavy || params.quality === 'high')) {
    return {
      level: 'high',
      message: '4K・長尺のためメモリ使用量が大きくなります。他のタブを閉じるか、720p・軽量品質を検討してください。',
    }
  }

  if (is4k || isLong || isChapterHeavy) {
    return {
      level: 'caution',
      message: '長尺または章一括書き出しのため、書き出しに時間がかかることがあります。',
    }
  }

  return { level: 'none', message: null }
}
