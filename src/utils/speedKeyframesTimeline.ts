import type { SpeedKeyframe, VideoClip } from '../types/project'
import { createId } from './id'
import { SPEED_MAX, SPEED_MIN, getSpeedAtLocalTime, sortSpeedKeyframes } from './speedKeyframes'

export const SPEED_TIMELINE_LANE_HEIGHT = 24

export function speedToLaneY(speed: number, laneHeight: number): number {
  const clamped = Math.max(SPEED_MIN, Math.min(SPEED_MAX, speed))
  const ratio = (clamped - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)
  return laneHeight - ratio * laneHeight
}

export function laneYToSpeed(y: number, laneHeight: number): number {
  const clampedY = Math.max(0, Math.min(laneHeight, y))
  const ratio = (laneHeight - clampedY) / laneHeight
  return SPEED_MIN + ratio * (SPEED_MAX - SPEED_MIN)
}

export function keyframeToLanePoint(
  keyframe: SpeedKeyframe,
  clipDuration: number,
  width: number,
  laneHeight: number,
): { x: number; y: number } {
  const duration = Math.max(clipDuration, 0.001)
  return {
    x: (keyframe.time / duration) * width,
    y: speedToLaneY(keyframe.speed, laneHeight),
  }
}

export function buildSpeedCurvePath(
  clip: VideoClip,
  clipDuration: number,
  width: number,
  laneHeight: number,
): string {
  const keyframes = clip.speedKeyframes
  if (!keyframes?.length || width <= 0 || laneHeight <= 0) return ''

  const duration = Math.max(clipDuration, 0.001)
  const samples = Math.max(2, Math.min(80, Math.ceil(width / 3)))
  const parts: string[] = []

  for (let i = 0; i <= samples; i++) {
    const localTime = (i / samples) * duration
    const speed = getSpeedAtLocalTime(clip, localTime, duration)
    const x = (localTime / duration) * width
    const y = speedToLaneY(speed, laneHeight)
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  return parts.join(' ')
}

export function speedAtTimelineClick(
  clip: VideoClip,
  clipDuration: number,
  time: number,
  speed: number,
): number {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  const value = speed || getSpeedAtLocalTime(clip, localTime, clipDuration)
  return Math.max(SPEED_MIN, Math.min(SPEED_MAX, value))
}

export function createSpeedKeyframeAt(
  clip: VideoClip,
  clipDuration: number,
  time: number,
  speed: number,
): SpeedKeyframe[] {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  const clampedSpeed = speedAtTimelineClick(clip, clipDuration, localTime, speed)
  const next = [...(clip.speedKeyframes ?? []), { id: createId(), time: localTime, speed: clampedSpeed }]
  return sortSpeedKeyframes(next)
}

export function updateSpeedKeyframeList(
  keyframes: SpeedKeyframe[],
  id: string,
  patch: Partial<SpeedKeyframe>,
): SpeedKeyframe[] {
  return sortSpeedKeyframes(
    keyframes.map((kf) => {
      if (kf.id !== id) return kf
      const next = { ...kf, ...patch }
      if (patch.speed != null) next.speed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, patch.speed))
      return next
    }),
  )
}

/** クリップ分割時に速度キーフレームを両側へ再配分 */
export function splitSpeedKeyframes(
  keyframes: SpeedKeyframe[] | undefined,
  splitOffset: number,
): { first: SpeedKeyframe[] | undefined; second: SpeedKeyframe[] | undefined } {
  if (!keyframes?.length) return { first: undefined, second: undefined }

  const first: SpeedKeyframe[] = []
  const second: SpeedKeyframe[] = []

  for (const kf of sortSpeedKeyframes(keyframes)) {
    if (kf.time < splitOffset) {
      first.push(kf)
    } else if (kf.time > splitOffset) {
      second.push({ ...kf, id: createId(), time: kf.time - splitOffset })
    } else {
      first.push(kf)
      second.push({ ...kf, id: createId(), time: 0 })
    }
  }

  return {
    first: first.length ? first : undefined,
    second: second.length ? second : undefined,
  }
}
