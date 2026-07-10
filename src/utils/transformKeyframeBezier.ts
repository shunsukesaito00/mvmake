import type {
  Transform,
  TransformBezierHandle,
  TransformKeyframe,
  TransformKeyframeProperty,
} from '../types/project'
import { keyframePropertyValue } from './transformKeyframesTimeline'

export function cubicBezierComponent(p0: number, p1: number, p2: number, p3: number, u: number): number {
  const t = 1 - u
  return t * t * t * p0 + 3 * t * t * u * p1 + 3 * t * u * u * p2 + u * u * u * p3
}

/** 時間軸 x でのベジェ曲線上の値 y をサンプル */
export function sampleCubicBezierYAtX(
  x0: number,
  x1: number,
  x2: number,
  x3: number,
  targetX: number,
  y0: number,
  y1: number,
  y2: number,
  y3: number,
): number {
  if (targetX <= x0) return y0
  if (targetX >= x3) return y3

  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    const x = cubicBezierComponent(x0, x1, x2, x3, mid)
    if (x < targetX) lo = mid
    else hi = mid
  }
  const u = (lo + hi) / 2
  return cubicBezierComponent(y0, y1, y2, y3, u)
}

export function shouldUseBezierForProperty(
  start: TransformKeyframe,
  end: TransformKeyframe,
  property: TransformKeyframeProperty,
): boolean {
  if (end.easing === 'bezier') return true
  return !!(
    start.bezierHandles?.[property]?.handleOut
    || end.bezierHandles?.[property]?.handleIn
  )
}

export function defaultBezierHandleOut(span: number): TransformBezierHandle {
  return { timeOffset: span / 3, valueOffset: 0 }
}

export function defaultBezierHandleIn(span: number): TransformBezierHandle {
  return { timeOffset: -span / 3, valueOffset: 0 }
}

export function getBezierHandleOut(
  keyframe: TransformKeyframe,
  partner: TransformKeyframe,
  property: TransformKeyframeProperty,
): TransformBezierHandle {
  return keyframe.bezierHandles?.[property]?.handleOut ?? defaultBezierHandleOut(partner.time - keyframe.time)
}

export function getBezierHandleIn(
  keyframe: TransformKeyframe,
  partner: TransformKeyframe,
  property: TransformKeyframeProperty,
): TransformBezierHandle {
  return keyframe.bezierHandles?.[property]?.handleIn ?? defaultBezierHandleIn(keyframe.time - partner.time)
}

export function samplePropertyWithBezier(
  start: TransformKeyframe,
  end: TransformKeyframe,
  property: TransformKeyframeProperty,
  base: Transform,
  localTime: number,
): number {
  const v0 = keyframePropertyValue(start, base, property)
  const v3 = keyframePropertyValue(end, base, property)
  const out = getBezierHandleOut(start, end, property)
  const inn = getBezierHandleIn(end, start, property)

  const x0 = start.time
  const x1 = start.time + out.timeOffset
  const x2 = end.time + inn.timeOffset
  const x3 = end.time

  const y0 = v0
  const y1 = v0 + out.valueOffset
  const y2 = v3 + inn.valueOffset
  const y3 = v3

  return sampleCubicBezierYAtX(x0, x1, x2, x3, localTime, y0, y1, y2, y3)
}

export function bezierHandleAbsoluteTime(
  keyframe: TransformKeyframe,
  handle: TransformBezierHandle,
): number {
  return keyframe.time + handle.timeOffset
}

export function bezierHandleAbsoluteValue(
  keyframe: TransformKeyframe,
  property: TransformKeyframeProperty,
  base: Transform,
  handle: TransformBezierHandle,
): number {
  return keyframePropertyValue(keyframe, base, property) + handle.valueOffset
}

export function patchBezierHandle(
  keyframe: TransformKeyframe,
  property: TransformKeyframeProperty,
  handleType: 'in' | 'out',
  timeOffset: number,
  valueOffset: number,
): TransformKeyframe {
  const prev = keyframe.bezierHandles?.[property] ?? {}
  const nextHandle = handleType === 'in'
    ? { ...prev, handleIn: { timeOffset, valueOffset } }
    : { ...prev, handleOut: { timeOffset, valueOffset } }
  return {
    ...keyframe,
    bezierHandles: {
      ...keyframe.bezierHandles,
      [property]: nextHandle,
    },
  }
}
