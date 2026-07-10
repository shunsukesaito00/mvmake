import type { TimelineMarker } from '../types/project'

export function isChapterMarker(marker: TimelineMarker): boolean {
  return marker.type !== 'beat'
}

export function filterChapterMarkers(markers: TimelineMarker[]): TimelineMarker[] {
  return markers.filter(isChapterMarker)
}

export function countBeatMarkers(markers: TimelineMarker[]): number {
  return markers.filter((m) => m.type === 'beat').length
}

/** start 以上 end 未満に interval 秒ごとのビート時刻を生成 */
export function generateBeatMarkerTimes(start: number, end: number, interval: number): number[] {
  if (interval <= 0 || end <= start) return []
  const times: number[] = []
  let t = start
  while (t < end - 0.001) {
    times.push(t)
    t += interval
  }
  return times
}

export function beatMarkerLabel(index: number): string {
  return `Beat ${index}`
}
