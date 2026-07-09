import type { Transform, TransformKeyframe } from '../types/project'
import { createId } from './id'
import { getTransformAtLocalTime, sortTransformKeyframes } from './transformKeyframes'

export const TRANSFORM_TIMELINE_LANE_HEIGHT = 16

export function keyframeToTimelineX(keyframe: TransformKeyframe, clipDuration: number, width: number): number {
  const duration = Math.max(clipDuration, 0.001)
  return (keyframe.time / duration) * width
}

export function timelineXToTime(x: number, width: number, clipDuration: number): number {
  const duration = Math.max(clipDuration, 0.001)
  return Math.max(0, Math.min(clipDuration, (x / width) * duration))
}

export function updateTransformKeyframeList(
  keyframes: TransformKeyframe[],
  id: string,
  patch: Partial<TransformKeyframe>,
): TransformKeyframe[] {
  return sortTransformKeyframes(keyframes.map((kf) => (kf.id === id ? { ...kf, ...patch } : kf)))
}

export function createTransformKeyframeAt(
  transform: Transform,
  keyframes: TransformKeyframe[] | undefined,
  clipDuration: number,
  time: number,
): TransformKeyframe[] {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  const resolved = getTransformAtLocalTime(transform, keyframes, localTime, clipDuration)
  const next = [
    ...(keyframes ?? []),
    { id: createId(), time: localTime, x: resolved.x, y: resolved.y, scale: resolved.scale, rotation: resolved.rotation },
  ]
  return sortTransformKeyframes(next)
}
