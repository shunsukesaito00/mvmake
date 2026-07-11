import type { TimelineMarker } from '../types/project'
import { getExportAudioSampleRange } from './audioPathAudit'
import { getMarkerChapterRanges, type MarkerChapterRange } from './markerExport'

/** 章区間・In/Out 部分書き出しの最短尺（秒） */
export const MIN_RANGE_EXPORT_DURATION = 0.01

export interface RangeExportParams {
  startTime: number
  endTime: number
  duration: number
  isPartial: boolean
}

export function isExportableRangeDuration(
  duration: number,
  minDuration = MIN_RANGE_EXPORT_DURATION,
): boolean {
  return duration >= minDuration
}

export function isExportableChapterRange(
  start: number,
  end: number,
  minDuration = MIN_RANGE_EXPORT_DURATION,
): boolean {
  return isExportableRangeDuration(end - start, minDuration)
}

/** In/Out とプロジェクト尺から書き出し startTime / duration を解決。短すぎる場合は null */
export function resolveRangeExportParams(
  inPoint: number | null,
  outPoint: number | null,
  projectDuration: number,
  minDuration = MIN_RANGE_EXPORT_DURATION,
): RangeExportParams | null {
  const startTime = inPoint ?? 0
  const endTime = outPoint ?? projectDuration
  const duration = endTime - startTime
  if (!isExportableRangeDuration(duration, minDuration)) return null
  return {
    startTime,
    endTime,
    duration,
    isPartial: inPoint !== null || outPoint !== null,
  }
}

export function findChapterRangeByMarkerId(
  markerId: string,
  markers: TimelineMarker[],
  projectDuration: number,
): MarkerChapterRange | undefined {
  return getMarkerChapterRanges(markers, projectDuration).find((r) => r.markerId === markerId)
}

export function formatRangeExportSummary(inPoint: number | null, outPoint: number | null): string {
  return `書き出し範囲: ${inPoint?.toFixed(1) ?? '—'}–${outPoint?.toFixed(1) ?? '—'}s`
}

/** exporter / mixAudioOffline と整合するオーディオサンプル範囲 */
export function getChapterRangeAudioSampleRange(
  params: RangeExportParams,
  sampleRate: number,
  bufferLength: number,
) {
  return getExportAudioSampleRange(params.startTime, params.duration, sampleRate, bufferLength)
}
