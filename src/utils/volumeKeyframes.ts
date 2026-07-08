import type { AudioSettings, VolumeKeyframe } from '../types/project'

export function sortVolumeKeyframes(keyframes: VolumeKeyframe[]): VolumeKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

/** クリップ内ローカル時間(0〜clipDuration)での音量。キーフレーム間は線形補間 */
export function getVolumeAtLocalTime(audio: AudioSettings, localTime: number, clipDuration: number): number {
  const keyframes = audio.volumeKeyframes
  if (!keyframes?.length) return audio.volume

  const sorted = sortVolumeKeyframes(keyframes)
  const t = Math.max(0, Math.min(clipDuration, localTime))

  if (t <= sorted[0].time) return sorted[0].volume
  const last = sorted[sorted.length - 1]
  if (t >= last.time) return last.volume

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (t >= a.time && t <= b.time) {
      const span = b.time - a.time
      if (span <= 0) return b.volume
      const ratio = (t - a.time) / span
      return a.volume + (b.volume - a.volume) * ratio
    }
  }

  return audio.volume
}

/** Web Audio / OfflineAudioContext の GainNode.gain に音量カーブをスケジュール */
export function scheduleVolumeAutomation(
  gainParam: AudioParam,
  when: number,
  localOffset: number,
  segmentDuration: number,
  clipDuration: number,
  audio: AudioSettings,
): void {
  const { fadeIn, fadeOut } = audio
  const endLocal = localOffset + segmentDuration
  const hasKeyframes = (audio.volumeKeyframes?.length ?? 0) > 0

  if (!hasKeyframes) {
    const volume = audio.volume
    gainParam.setValueAtTime(volume, when)
    if (fadeIn > 0 && localOffset < fadeIn) {
      gainParam.setValueAtTime(0, when)
      gainParam.linearRampToValueAtTime(volume, when + Math.min(fadeIn - localOffset, segmentDuration))
    }
    if (fadeOut > 0) {
      const fadeStartLocal = clipDuration - fadeOut
      if (fadeStartLocal < endLocal && fadeStartLocal >= localOffset) {
        const wFade = when + (fadeStartLocal - localOffset)
        gainParam.setValueAtTime(volume, wFade)
        gainParam.linearRampToValueAtTime(0, when + segmentDuration)
      }
    }
    return
  }

  const sorted = sortVolumeKeyframes(audio.volumeKeyframes!)
  const times = new Set<number>([localOffset, endLocal])
  for (const kf of sorted) {
    if (kf.time > localOffset && kf.time < endLocal) times.add(kf.time)
  }
  const points = [...times].sort((a, b) => a - b)

  for (let i = 0; i < points.length - 1; i++) {
    const t0 = points[i]
    const t1 = points[i + 1]
    const v0 = getVolumeAtLocalTime(audio, t0, clipDuration)
    const v1 = getVolumeAtLocalTime(audio, t1, clipDuration)
    gainParam.setValueAtTime(v0, when + (t0 - localOffset))
    gainParam.linearRampToValueAtTime(v1, when + (t1 - localOffset))
  }
}
