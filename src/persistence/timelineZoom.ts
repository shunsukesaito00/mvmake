import { clampTimelinePixelsPerSecond } from '../utils/timelineZoom'

const STORAGE_KEY = 'fable-timeline-zoom'

export function loadTimelinePixelsPerSecond(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = Number(JSON.parse(raw))
    if (!Number.isFinite(parsed)) return null
    return clampTimelinePixelsPerSecond(parsed)
  } catch {
    return null
  }
}

export function saveTimelinePixelsPerSecond(pps: number): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clampTimelinePixelsPerSecond(pps)))
}
