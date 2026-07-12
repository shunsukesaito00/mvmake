export const TIMELINE_TRACK_HEIGHTS_KEY = 'fable-timeline-track-heights'

export const DEFAULT_TRACK_HEIGHT = 52
export const MIN_TRACK_HEIGHT = 32
export const MAX_TRACK_HEIGHT = 120

export interface TimelineTrackHeightSettings {
  defaultHeight: number
  byTrackId: Record<string, number>
}

const DEFAULT_SETTINGS: TimelineTrackHeightSettings = {
  defaultHeight: DEFAULT_TRACK_HEIGHT,
  byTrackId: {},
}

export function clampTrackHeight(height: number): number {
  return Math.max(MIN_TRACK_HEIGHT, Math.min(MAX_TRACK_HEIGHT, height))
}

export function loadTimelineTrackHeightSettings(): TimelineTrackHeightSettings {
  try {
    const raw = localStorage.getItem(TIMELINE_TRACK_HEIGHTS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<TimelineTrackHeightSettings>
    return {
      defaultHeight: clampTrackHeight(parsed.defaultHeight ?? DEFAULT_TRACK_HEIGHT),
      byTrackId: parsed.byTrackId ?? {},
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveTimelineTrackHeightSettings(settings: TimelineTrackHeightSettings): void {
  try {
    localStorage.setItem(TIMELINE_TRACK_HEIGHTS_KEY, JSON.stringify(settings))
  } catch {
    // 保存失敗は無視
  }
}

export function getTrackHeight(trackId: string, settings: TimelineTrackHeightSettings): number {
  const stored = settings.byTrackId[trackId]
  return clampTrackHeight(stored ?? settings.defaultHeight)
}

export function resolveTrackHeights(
  trackIds: string[],
  settings: TimelineTrackHeightSettings,
): number[] {
  return trackIds.map((id) => getTrackHeight(id, settings))
}

export function sumTrackHeights(heights: number[]): number {
  return heights.reduce((sum, h) => sum + h, 0)
}

export function findTrackIndexAtY(y: number, heights: number[]): number {
  if (y < 0) return -1
  let offset = 0
  for (let i = 0; i < heights.length; i++) {
    offset += heights[i]
    if (y < offset) return i
  }
  return -1
}
