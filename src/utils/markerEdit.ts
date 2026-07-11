import type { TimelineMarker } from '../types/project'
import { snapTime } from './time'

/** 構造化ウェディングテンプレの章マーカー数（ストレス/E2E 基準） */
export const STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT = 5

export function clampMarkerTime(time: number, projectDuration: number): number {
  return Math.max(0, Math.min(time, projectDuration))
}

export function normalizeMarkerUpdates(
  updates: Partial<Pick<TimelineMarker, 'label' | 'time'>>,
  projectDuration: number,
): Partial<Pick<TimelineMarker, 'label' | 'time'>> {
  if (updates.time === undefined) return updates
  return { ...updates, time: clampMarkerTime(updates.time, projectDuration) }
}

/** タイムライン上ドラッグ: クランプ後にスナップ */
export function resolveMarkerDragTime(
  rawTime: number,
  projectDuration: number,
  snapPoints: number[],
): number {
  const clamped = clampMarkerTime(rawTime, projectDuration)
  return snapTime(clamped, snapPoints)
}

export function findMarkerById(
  markers: TimelineMarker[],
  id: string,
): TimelineMarker | undefined {
  return markers.find((m) => m.id === id)
}
