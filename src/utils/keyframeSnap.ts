import { snapTime } from './time'
import { VOLUME_TIMELINE_MAX } from './volumeKeyframesTimeline'

/** タイムライン上のスナップ幅（秒）。ズームに応じて約 8px 相当にスケール */
export function keyframeTimeSnapThreshold(pixelsPerSecond: number, pixelThreshold = 8): number {
  return Math.max(0.02, pixelThreshold / Math.max(pixelsPerSecond, 1))
}

/** グローバル秒をクリップ内ローカル秒のスナップ候補へ変換 */
export function buildLocalKeyframeTimeSnapPoints(
  clipStartTime: number,
  clipDuration: number,
  globalSnapPoints: number[],
  siblingKeyframeTimes: number[] = [],
): number[] {
  const points = new Set<number>([0, clipDuration])
  for (const global of globalSnapPoints) {
    const local = global - clipStartTime
    if (local >= 0 && local <= clipDuration) points.add(local)
  }
  for (const local of siblingKeyframeTimes) {
    if (local >= 0 && local <= clipDuration) points.add(local)
  }
  return Array.from(points)
}

/** クリップ内のキーフレーム時間をスナップ */
export function snapLocalKeyframeTime(
  localTime: number,
  clipStartTime: number,
  clipDuration: number,
  globalSnapPoints: number[],
  siblingKeyframeTimes: number[] = [],
  pixelsPerSecond = 100,
): { time: number; snapped: boolean } {
  const clamped = Math.max(0, Math.min(clipDuration, localTime))
  const snapPoints = buildLocalKeyframeTimeSnapPoints(
    clipStartTime,
    clipDuration,
    globalSnapPoints,
    siblingKeyframeTimes,
  )
  const threshold = keyframeTimeSnapThreshold(pixelsPerSecond)
  const snapped = snapTime(clamped, snapPoints, threshold)
  return { time: snapped, snapped: snapped !== clamped }
}

export const VOLUME_SNAP_LEVELS = [0, 0.25, 0.5, 0.75, 1, 1.5, 2] as const

export function volumeSnapThreshold(laneHeight: number, pixelThreshold = 4): number {
  return (pixelThreshold / Math.max(laneHeight, 1)) * VOLUME_TIMELINE_MAX
}

/** 音量レベルを近傍の定番値へスナップ（最も近い候補を優先） */
export function snapVolume(
  volume: number,
  laneHeight = 24,
  pixelThreshold = 4,
): { volume: number; snapped: boolean } {
  const clamped = Math.max(0, Math.min(VOLUME_TIMELINE_MAX, volume))
  const threshold = volumeSnapThreshold(laneHeight, pixelThreshold)
  let nearest: number | null = null
  let nearestDistance = threshold
  for (const level of VOLUME_SNAP_LEVELS) {
    const distance = Math.abs(clamped - level)
    if (distance < nearestDistance) {
      nearest = level
      nearestDistance = distance
    }
  }
  if (nearest !== null) {
    return { volume: nearest, snapped: true }
  }
  return { volume: clamped, snapped: false }
}
