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
  return upsertTransformKeyframeAt(transform, keyframes, clipDuration, localTime, {
    x: resolved.x,
    y: resolved.y,
    scale: resolved.scale,
    rotation: resolved.rotation,
  })
}

export const TRANSFORM_KEYFRAME_TIME_EPSILON = 0.05

/** 指定時間付近のキーフレームがあれば更新、なければ追加 */
export function upsertTransformKeyframeAt(
  _transform: Transform,
  keyframes: TransformKeyframe[] | undefined,
  clipDuration: number,
  time: number,
  values: Pick<TransformKeyframe, 'x' | 'y' | 'scale' | 'rotation'>,
): TransformKeyframe[] {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  const list = keyframes ?? []
  const existing = list.find((kf) => Math.abs(kf.time - localTime) < TRANSFORM_KEYFRAME_TIME_EPSILON)
  if (existing) {
    return sortTransformKeyframes(
      list.map((kf) => (kf.id === existing.id ? { ...kf, ...values, time: localTime } : kf)),
    )
  }
  return sortTransformKeyframes([
    ...list,
    { id: createId(), time: localTime, ...values },
  ])
}

/** クリップ分割時に transform キーフレームを両側へ再配分 */
export function splitTransformKeyframes(
  keyframes: TransformKeyframe[] | undefined,
  splitOffset: number,
): { first: TransformKeyframe[] | undefined; second: TransformKeyframe[] | undefined } {
  if (!keyframes?.length) return { first: undefined, second: undefined }

  const first: TransformKeyframe[] = []
  const second: TransformKeyframe[] = []

  for (const kf of sortTransformKeyframes(keyframes)) {
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
