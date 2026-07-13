import type { VideoClip } from '../types/project'
import { getSourceOffsetAtLocalTime } from './speedKeyframes'

export interface VideoAudioSpeedSchedule {
  sourceStart: number
  bufferDuration: number
  timelineDuration: number
  linked: boolean
}

/** 内蔵音声が速度キーフレーム/clip.speed に連動するか（既定: 連動） */
export function isSpeedAudioLinked(clip: VideoClip): boolean {
  return clip.speedAudioLinked !== false
}

export function resolveVideoAudioSpeedSchedule(
  clip: VideoClip,
  localStart: number,
  localEnd: number,
): VideoAudioSpeedSchedule {
  const local0 = Math.max(0, localStart)
  const local1 = Math.min(clip.duration, localEnd)
  const timelineDuration = Math.max(0, local1 - local0)

  if (!isSpeedAudioLinked(clip)) {
    return {
      sourceStart: clip.sourceStart + local0,
      bufferDuration: timelineDuration,
      timelineDuration,
      linked: false,
    }
  }

  const sourceStart = clip.sourceStart + getSourceOffsetAtLocalTime(clip, local0)
  const sourceEnd = clip.sourceStart + getSourceOffsetAtLocalTime(clip, local1)
  return {
    sourceStart,
    bufferDuration: Math.max(0, sourceEnd - sourceStart),
    timelineDuration,
    linked: true,
  }
}

/** 速度オートメーションが必要か（連動時のみ） */
export function shouldScheduleVideoSpeedAutomation(clip: VideoClip): boolean {
  if (!isSpeedAudioLinked(clip)) return false
  return (clip.speedKeyframes?.length ?? 0) > 0
}

export function getConstantVideoAudioPlaybackRate(clip: VideoClip, shuttleRate = 1): number {
  if (!isSpeedAudioLinked(clip)) return shuttleRate
  return (clip.speed ?? 1) * shuttleRate
}
