export const PLAYBACK_SHUTTLE_FORWARD_RATES = [1, 2, 4] as const
export const PLAYBACK_SHUTTLE_REVERSE_RATES = [-1, -2, -4] as const
export const PLAYBACK_SHUTTLE_RATES = [-4, -2, -1, 1, 2, 4] as const
export type PlaybackShuttleRate = (typeof PLAYBACK_SHUTTLE_RATES)[number]

export function cycleForwardShuttleRate(current: PlaybackShuttleRate): PlaybackShuttleRate {
  if (current <= 0) return 1
  if (current === 1) return 2
  if (current === 2) return 4
  return 4
}

export function cycleReverseShuttleRate(current: PlaybackShuttleRate): PlaybackShuttleRate {
  if (current >= 0) return -1
  if (current === -1) return -2
  if (current === -2) return -4
  return -4
}

export function isReverseShuttleRate(rate: PlaybackShuttleRate): boolean {
  return rate < 0
}

export function formatShuttleRateLabel(rate: PlaybackShuttleRate): string {
  const magnitude = Math.abs(rate)
  return rate < 0 ? `◀ ${magnitude}x` : `${magnitude}x`
}

export function shouldShowShuttleRate(rate: PlaybackShuttleRate): boolean {
  return rate !== 1
}

export function clampPlaybackShuttleRate(rate: number): PlaybackShuttleRate {
  const abs = Math.abs(rate)
  const magnitude = abs >= 4 ? 4 : abs >= 2 ? 2 : 1
  return rate < 0 ? (-magnitude as PlaybackShuttleRate) : (magnitude as PlaybackShuttleRate)
}

export function computeShuttleTimelineTime(
  anchorTimelineTime: number,
  anchorWallMs: number,
  rate: PlaybackShuttleRate,
  nowMs = performance.now(),
): number {
  return anchorTimelineTime + ((nowMs - anchorWallMs) / 1000) * rate
}
