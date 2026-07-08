import type { AudioSettings, VolumeKeyframe } from '../types/project'
import { createId } from './id'
import { getVolumeAtLocalTime, sortVolumeKeyframes } from './volumeKeyframes'

export const VOLUME_TIMELINE_MAX = 2
export const VOLUME_TIMELINE_LANE_HEIGHT = 24

export function volumeToLaneY(volume: number, laneHeight: number): number {
  const clamped = Math.max(0, Math.min(VOLUME_TIMELINE_MAX, volume))
  return laneHeight - (clamped / VOLUME_TIMELINE_MAX) * laneHeight
}

export function laneYToVolume(y: number, laneHeight: number): number {
  const clampedY = Math.max(0, Math.min(laneHeight, y))
  return ((laneHeight - clampedY) / laneHeight) * VOLUME_TIMELINE_MAX
}

export function keyframeToLanePoint(
  keyframe: VolumeKeyframe,
  clipDuration: number,
  width: number,
  laneHeight: number,
): { x: number; y: number } {
  const duration = Math.max(clipDuration, 0.001)
  return {
    x: (keyframe.time / duration) * width,
    y: volumeToLaneY(keyframe.volume, laneHeight),
  }
}

/** 線形補間に沿った SVG path (M/L) */
export function buildVolumeCurvePath(
  audio: AudioSettings,
  clipDuration: number,
  width: number,
  laneHeight: number,
): string {
  const keyframes = audio.volumeKeyframes
  if (!keyframes?.length || width <= 0 || laneHeight <= 0) return ''

  const duration = Math.max(clipDuration, 0.001)
  const samples = Math.max(2, Math.min(80, Math.ceil(width / 3)))
  const parts: string[] = []

  for (let i = 0; i <= samples; i++) {
    const localTime = (i / samples) * duration
    const volume = getVolumeAtLocalTime(audio, localTime, duration)
    const x = (localTime / duration) * width
    const y = volumeToLaneY(volume, laneHeight)
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  return parts.join(' ')
}

export function updateVolumeKeyframeList(
  keyframes: VolumeKeyframe[],
  id: string,
  patch: Partial<VolumeKeyframe>,
): VolumeKeyframe[] {
  return sortVolumeKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
}

export function createVolumeKeyframeAt(
  audio: AudioSettings,
  clipDuration: number,
  time: number,
  volume: number,
): VolumeKeyframe[] {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  const clampedVolume = Math.max(0, Math.min(2, volume))
  const next = [...(audio.volumeKeyframes ?? []), { id: createId(), time: localTime, volume: clampedVolume }]
  return sortVolumeKeyframes(next)
}

export function volumeAtTimelineClick(
  audio: AudioSettings,
  clipDuration: number,
  time: number,
  volume: number,
): number {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  return Math.max(0, Math.min(2, volume || getVolumeAtLocalTime(audio, localTime, clipDuration)))
}
