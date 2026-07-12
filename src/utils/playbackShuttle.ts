export const PLAYBACK_SHUTTLE_RATES = [1, 2, 4] as const
export type PlaybackShuttleRate = (typeof PLAYBACK_SHUTTLE_RATES)[number]

export function cycleForwardShuttleRate(current: PlaybackShuttleRate): PlaybackShuttleRate {
  if (current === 1) return 2
  if (current === 2) return 4
  return 4
}

export function clampPlaybackShuttleRate(rate: number): PlaybackShuttleRate {
  if (rate >= 4) return 4
  if (rate >= 2) return 2
  return 1
}

export function computeShuttleTimelineTime(
  anchorTimelineTime: number,
  anchorWallMs: number,
  rate: PlaybackShuttleRate,
  nowMs = performance.now(),
): number {
  return anchorTimelineTime + ((nowMs - anchorWallMs) / 1000) * rate
}
