export const TIMELINE_MIN_PIXELS_PER_SECOND = 20
export const TIMELINE_MAX_PIXELS_PER_SECOND = 300
export const TIMELINE_HEADER_WIDTH = 110

export function clampTimelinePixelsPerSecond(pps: number): number {
  return Math.max(TIMELINE_MIN_PIXELS_PER_SECOND, Math.min(TIMELINE_MAX_PIXELS_PER_SECOND, pps))
}

export function computeFitTimelinePixelsPerSecond(
  duration: number,
  viewportWidth: number,
  headerWidth = TIMELINE_HEADER_WIDTH,
  padding = 40,
): number {
  if (duration <= 0 || viewportWidth <= headerWidth + padding) return 80
  const available = viewportWidth - headerWidth - padding
  return clampTimelinePixelsPerSecond(available / duration)
}

export function computeZoomToClipPixelsPerSecond(
  clipDuration: number,
  viewportWidth: number,
  headerWidth = TIMELINE_HEADER_WIDTH,
  padding = 48,
  minClipScreenFraction = 0.4,
): number {
  const available = viewportWidth - headerWidth - padding
  if (clipDuration <= 0 || available <= 0) return TIMELINE_MIN_PIXELS_PER_SECOND
  const targetWidth = Math.max(available * minClipScreenFraction, 120)
  return clampTimelinePixelsPerSecond(targetWidth / clipDuration)
}

export function computeTimelineScrollLeftForTime(
  time: number,
  pixelsPerSecond: number,
  viewportWidth: number,
  headerWidth = TIMELINE_HEADER_WIDTH,
): number {
  const centerX = headerWidth + time * pixelsPerSecond
  return Math.max(0, centerX - viewportWidth / 2)
}

export function isTimelineTimeVisible(
  time: number,
  pixelsPerSecond: number,
  viewportWidth: number,
  scrollLeft: number,
  headerWidth = TIMELINE_HEADER_WIDTH,
  edgePadding = 48,
): boolean {
  const x = headerWidth + time * pixelsPerSecond
  const left = scrollLeft + edgePadding
  const right = scrollLeft + viewportWidth - edgePadding
  return x >= left && x <= right
}
