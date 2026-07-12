import type { SpeedKeyframe, VideoClip } from '../types/project'
import { sampleSpeedWithBezier, shouldUseSpeedBezier } from './speedKeyframeBezier'

export const SPEED_MIN = 0.25
export const SPEED_MAX = 4

export function sortSpeedKeyframes(keyframes: SpeedKeyframe[]): SpeedKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

function interpolateSpeedAtSegment(
  start: SpeedKeyframe,
  end: SpeedKeyframe,
  localTime: number,
): number {
  if (shouldUseSpeedBezier(start, end)) {
    return sampleSpeedWithBezier(start, end, localTime)
  }

  const span = end.time - start.time
  if (span <= 0) return end.speed
  const ratio = (localTime - start.time) / span
  return start.speed + (end.speed - start.speed) * ratio
}

/** クリップ内ローカル時間(0〜clipDuration)での速度。キーフレーム間は線形/ベジェ補間 */
export function getSpeedAtLocalTime(clip: VideoClip, localTime: number, clipDuration?: number): number {
  const keyframes = clip.speedKeyframes
  const baseSpeed = clip.speed ?? 1
  if (!keyframes?.length) return baseSpeed

  const sorted = sortSpeedKeyframes(keyframes)
  const duration = clipDuration ?? clip.duration
  const t = Math.max(0, Math.min(duration, localTime))

  if (t <= sorted[0].time) return sorted[0].speed
  const last = sorted[sorted.length - 1]
  if (t >= last.time) return last.speed

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (t >= a.time && t <= b.time) {
      return interpolateSpeedAtSegment(a, b, t)
    }
  }

  return baseSpeed
}

/** クリップ先頭(ローカル0)から localTime まで素材内で進んだ秒数（数値積分） */
export function getSourceOffsetAtLocalTime(clip: VideoClip, localTime: number): number {
  const t = Math.max(0, localTime)
  if (!clip.speedKeyframes?.length) return t * (clip.speed ?? 1)

  const steps = Math.max(16, Math.ceil(t * 32))
  let offset = 0
  let prevT = 0
  let prevS = getSpeedAtLocalTime(clip, 0)
  for (let i = 1; i <= steps; i++) {
    const ti = (i / steps) * t
    const si = getSpeedAtLocalTime(clip, ti)
    offset += (ti - prevT) * (prevS + si) / 2
    prevT = ti
    prevS = si
  }

  return offset
}

export function getVideoSourceTimeAtLocalTime(clip: VideoClip, localTime: number): number {
  return clip.sourceStart + getSourceOffsetAtLocalTime(clip, localTime)
}

/** 利用可能な素材秒数に対する最大ローカル長 */
export function getMaxLocalDurationForSourceBudget(clip: VideoClip, sourceBudget: number): number {
  if (sourceBudget <= 0) return 0
  if (!clip.speedKeyframes?.length) {
    return sourceBudget / (clip.speed ?? 1)
  }

  let lo = 0
  let hi = Math.max(clip.duration, sourceBudget * 4)
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    if (getSourceOffsetAtLocalTime(clip, mid) <= sourceBudget) lo = mid
    else hi = mid
  }
  return lo
}

/** Web Audio の playbackRate に速度カーブをスケジュール */
export function scheduleSpeedAutomation(
  playbackRateParam: AudioParam,
  when: number,
  localOffset: number,
  segmentDuration: number,
  clip: VideoClip,
  shuttleRate = 1,
): void {
  const hasKeyframes = (clip.speedKeyframes?.length ?? 0) > 0
  const baseSpeed = (clip.speed ?? 1) * shuttleRate

  if (!hasKeyframes) {
    playbackRateParam.setValueAtTime(baseSpeed, when)
    return
  }

  const endLocal = localOffset + segmentDuration
  const steps = Math.max(8, Math.ceil(segmentDuration * 24))
  for (let i = 0; i <= steps; i++) {
    const localT = localOffset + (i / steps) * segmentDuration
    const speed = getSpeedAtLocalTime(clip, localT) * shuttleRate
    playbackRateParam.setValueAtTime(speed, when + (localT - localOffset))
  }
  if (segmentDuration > 0) {
    playbackRateParam.setValueAtTime(getSpeedAtLocalTime(clip, endLocal) * shuttleRate, when + segmentDuration)
  }
}
