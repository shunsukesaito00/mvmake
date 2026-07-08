import type { TimelineMarker } from '../types/project'

export interface MarkerChapterRange {
  markerId: string
  label: string
  start: number
  end: number
}

/** 各マーカーから次マーカー(なければプロジェクト末尾)までの章区間 */
export function getMarkerChapterRanges(
  markers: TimelineMarker[],
  projectDuration: number,
): MarkerChapterRange[] {
  const sorted = [...markers].sort((a, b) => a.time - b.time)
  return sorted.map((marker, index) => ({
    markerId: marker.id,
    label: marker.label,
    start: marker.time,
    end: index + 1 < sorted.length ? sorted[index + 1].time : projectDuration,
  }))
}

export function formatMarkerChapterRange(range: MarkerChapterRange): string {
  return `${range.label} (${range.start.toFixed(1)}–${range.end.toFixed(1)}s)`
}
