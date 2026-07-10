import type { SpeedKeyframe, TransformBezierHandle } from '../types/project'
import { SPEED_MAX, SPEED_MIN } from './speedKeyframes'
import { sampleCubicBezierYAtX } from './transformKeyframeBezier'

export function clampSpeedValue(speed: number): number {
  return Math.max(SPEED_MIN, Math.min(SPEED_MAX, speed))
}

export function shouldUseSpeedBezier(start: SpeedKeyframe, end: SpeedKeyframe): boolean {
  if (end.easing === 'bezier') return true
  return !!(start.bezierHandles?.handleOut || end.bezierHandles?.handleIn)
}

export function defaultSpeedBezierHandleOut(span: number): TransformBezierHandle {
  return { timeOffset: span / 3, valueOffset: 0 }
}

export function defaultSpeedBezierHandleIn(span: number): TransformBezierHandle {
  return { timeOffset: -span / 3, valueOffset: 0 }
}

export function getSpeedBezierHandleOut(
  keyframe: SpeedKeyframe,
  partner: SpeedKeyframe,
): TransformBezierHandle {
  return keyframe.bezierHandles?.handleOut ?? defaultSpeedBezierHandleOut(partner.time - keyframe.time)
}

export function getSpeedBezierHandleIn(
  keyframe: SpeedKeyframe,
  partner: SpeedKeyframe,
): TransformBezierHandle {
  return keyframe.bezierHandles?.handleIn ?? defaultSpeedBezierHandleIn(keyframe.time - partner.time)
}

export function sampleSpeedWithBezier(
  start: SpeedKeyframe,
  end: SpeedKeyframe,
  localTime: number,
): number {
  const v0 = start.speed
  const v3 = end.speed
  const out = getSpeedBezierHandleOut(start, end)
  const inn = getSpeedBezierHandleIn(end, start)

  const x0 = start.time
  const x1 = start.time + out.timeOffset
  const x2 = end.time + inn.timeOffset
  const x3 = end.time

  const y0 = v0
  const y1 = v0 + out.valueOffset
  const y2 = v3 + inn.valueOffset
  const y3 = v3

  return clampSpeedValue(sampleCubicBezierYAtX(x0, x1, x2, x3, localTime, y0, y1, y2, y3))
}

export function speedBezierHandleAbsoluteTime(
  keyframe: SpeedKeyframe,
  handle: TransformBezierHandle,
): number {
  return keyframe.time + handle.timeOffset
}

export function speedBezierHandleAbsoluteSpeed(
  keyframe: SpeedKeyframe,
  handle: TransformBezierHandle,
): number {
  return clampSpeedValue(keyframe.speed + handle.valueOffset)
}

export function patchSpeedBezierHandle(
  keyframe: SpeedKeyframe,
  handleType: 'in' | 'out',
  timeOffset: number,
  valueOffset: number,
): SpeedKeyframe {
  const prev = keyframe.bezierHandles ?? {}
  const nextHandle = handleType === 'in'
    ? { ...prev, handleIn: { timeOffset, valueOffset } }
    : { ...prev, handleOut: { timeOffset, valueOffset } }
  return {
    ...keyframe,
    bezierHandles: nextHandle,
  }
}
