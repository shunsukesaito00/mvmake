import type { SpeedKeyframe, VideoClip } from '../types/project'

export const SPEED_MIN = 0.25
export const SPEED_MAX = 4

export function sortSpeedKeyframes(keyframes: SpeedKeyframe[]): SpeedKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

/** クリップ内ローカル時間(0〜clipDuration)での速度。キーフレーム間は線形補間 */
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
      const span = b.time - a.time
      if (span <= 0) return b.speed
      const ratio = (t - a.time) / span
      return a.speed + (b.speed - a.speed) * ratio
    }
  }

  return baseSpeed
}

/** クリップ先頭(ローカル0)から localTime まで素材内で進んだ秒数（台形積分） */
export function getSourceOffsetAtLocalTime(clip: VideoClip, localTime: number): number {
  const t = Math.max(0, localTime)
  const keyframes = clip.speedKeyframes
  if (!keyframes?.length) return t * (clip.speed ?? 1)

  const sorted = sortSpeedKeyframes(keyframes)
  const breakpoints = [0, ...sorted.map((kf) => kf.time).filter((time) => time > 0 && time < t), t]
  const points = [...new Set(breakpoints.map((p) => +p.toFixed(6)))].sort((a, b) => a - b)

  let offset = 0
  for (let i = 0; i < points.length - 1; i++) {
    const t0 = points[i]
    const t1 = points[i + 1]
    const s0 = getSpeedAtLocalTime(clip, t0)
    const s1 = getSpeedAtLocalTime(clip, t1)
    offset += (t1 - t0) * (s0 + s1) / 2
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
): void {
  const hasKeyframes = (clip.speedKeyframes?.length ?? 0) > 0
  const baseSpeed = clip.speed ?? 1

  if (!hasKeyframes) {
    playbackRateParam.setValueAtTime(baseSpeed, when)
    return
  }

  const sorted = sortSpeedKeyframes(clip.speedKeyframes!)
  const endLocal = localOffset + segmentDuration
  const times = new Set<number>([localOffset, endLocal])
  for (const kf of sorted) {
    if (kf.time > localOffset && kf.time < endLocal) times.add(kf.time)
  }
  const points = [...times].sort((a, b) => a - b)

  for (let i = 0; i < points.length - 1; i++) {
    const t0 = points[i]
    const t1 = points[i + 1]
    const s0 = getSpeedAtLocalTime(clip, t0)
    const s1 = getSpeedAtLocalTime(clip, t1)
    playbackRateParam.setValueAtTime(s0, when + (t0 - localOffset))
    playbackRateParam.linearRampToValueAtTime(s1, when + (t1 - localOffset))
  }
}
