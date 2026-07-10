import type { Transform, TransformKeyframe } from '../types/project'
import { createId } from './id'
import { getTransformAtLocalTime, sortTransformKeyframes } from './transformKeyframes'
import {
  bezierHandleAbsoluteTime,
  bezierHandleAbsoluteValue,
  getBezierHandleIn,
  getBezierHandleOut,
  patchBezierHandle,
  shouldUseBezierForProperty,
} from './transformKeyframeBezier'

export const TRANSFORM_TIMELINE_LANE_HEIGHT = 24
export const TRANSFORM_TIMELINE_EXPANDED_LANE_HEIGHT = 36
export const TRANSFORM_TIMELINE_TAB_HEIGHT = 14
export const TRANSFORM_TIMELINE_LEGEND_HEIGHT = 10

export type TransformTimelineProperty = 'opacity' | 'x' | 'y' | 'scale' | 'rotation'

export const TRANSFORM_TIMELINE_PROPERTIES: TransformTimelineProperty[] = [
  'opacity',
  'x',
  'y',
  'scale',
  'rotation',
]

export const TRANSFORM_TIMELINE_PROPERTY_LABELS: Record<TransformTimelineProperty, string> = {
  opacity: '不透明度',
  x: 'X',
  y: 'Y',
  scale: 'スケール',
  rotation: '回転',
}

export const TRANSFORM_TIMELINE_PROPERTY_COLORS: Record<TransformTimelineProperty, string> = {
  opacity: 'rgba(56,189,248,0.9)',
  x: 'rgba(52,211,153,0.9)',
  y: 'rgba(251,191,36,0.9)',
  scale: 'rgba(167,139,250,0.9)',
  rotation: 'rgba(251,113,133,0.9)',
}

export function getTransformTimelineLaneHeight(showAllProperties: boolean): number {
  return showAllProperties ? TRANSFORM_TIMELINE_EXPANDED_LANE_HEIGHT : TRANSFORM_TIMELINE_LANE_HEIGHT
}

export function getTransformTimelineTotalHeight(showAllProperties: boolean): number {
  const legendHeight = showAllProperties ? TRANSFORM_TIMELINE_LEGEND_HEIGHT : 0
  return TRANSFORM_TIMELINE_TAB_HEIGHT + legendHeight + getTransformTimelineLaneHeight(showAllProperties)
}

export function getTransformTimelinePropertyRange(property: TransformTimelineProperty): { min: number; max: number } {
  switch (property) {
    case 'opacity':
    case 'x':
    case 'y':
      return { min: 0, max: 1 }
    case 'scale':
      return { min: 0.1, max: 3 }
    case 'rotation':
      return { min: -180, max: 180 }
  }
}

export function getTransformPropertyValue(transform: Transform, property: TransformTimelineProperty): number {
  return transform[property]
}

export function keyframePropertyValue(
  keyframe: TransformKeyframe,
  base: Transform,
  property: TransformTimelineProperty,
): number {
  if (property === 'opacity') return keyframe.opacity ?? base.opacity
  return keyframe[property]
}

export function clampTransformTimelinePropertyValue(
  property: TransformTimelineProperty,
  value: number,
): number {
  const { min, max } = getTransformTimelinePropertyRange(property)
  return Math.max(min, Math.min(max, value))
}

export function propertyToLaneNormalized(value: number, property: TransformTimelineProperty): number {
  const { min, max } = getTransformTimelinePropertyRange(property)
  if (max === min) return 0
  return (value - min) / (max - min)
}

export function laneNormalizedToProperty(normalized: number, property: TransformTimelineProperty): number {
  const { min, max } = getTransformTimelinePropertyRange(property)
  return clampTransformTimelinePropertyValue(property, min + normalized * (max - min))
}

export function applyTransformPropertyLaneDelta(
  original: number,
  deltaNormalized: number,
  property: TransformTimelineProperty,
): number {
  const { min, max } = getTransformTimelinePropertyRange(property)
  return clampTransformTimelinePropertyValue(property, original + deltaNormalized * (max - min))
}

export function formatTransformKeyframePropertyValue(
  property: TransformTimelineProperty,
  value: number,
): string {
  switch (property) {
    case 'opacity':
      return `${Math.round(value * 100)}%`
    case 'x':
    case 'y':
      return `${Math.round(value * 100)}%`
    case 'scale':
      return value.toFixed(2)
    case 'rotation':
      return `${Math.round(value)}°`
  }
}

export function formatTransformKeyframeTitle(
  keyframe: TransformKeyframe,
  base: Transform,
  property: TransformTimelineProperty,
): string {
  const value = keyframePropertyValue(keyframe, base, property)
  const label = TRANSFORM_TIMELINE_PROPERTY_LABELS[property]
  return `${keyframe.time.toFixed(1)}s · ${label} ${formatTransformKeyframePropertyValue(property, value)}`
}

export function keyframeToTimelineX(keyframe: TransformKeyframe, clipDuration: number, width: number): number {
  const duration = Math.max(clipDuration, 0.001)
  return (keyframe.time / duration) * width
}

export function timelineXToTime(x: number, width: number, clipDuration: number): number {
  const duration = Math.max(clipDuration, 0.001)
  return Math.max(0, Math.min(clipDuration, (x / width) * duration))
}

export function keyframeOpacityValue(keyframe: TransformKeyframe, base: Transform): number {
  return keyframe.opacity ?? base.opacity
}

export function opacityToLaneY(opacity: number, laneHeight: number): number {
  const clamped = Math.max(0, Math.min(1, opacity))
  return laneHeight - clamped * laneHeight
}

export function laneYToOpacity(y: number, laneHeight: number): number {
  return laneNormalizedToProperty((laneHeight - Math.max(0, Math.min(laneHeight, y))) / laneHeight, 'opacity')
}

export function propertyToLaneY(value: number, property: TransformTimelineProperty, laneHeight: number): number {
  const normalized = propertyToLaneNormalized(value, property)
  return laneHeight - normalized * laneHeight
}

export function laneYToProperty(y: number, property: TransformTimelineProperty, laneHeight: number): number {
  const clampedY = Math.max(0, Math.min(laneHeight, y))
  const normalized = (laneHeight - clampedY) / laneHeight
  return laneNormalizedToProperty(normalized, property)
}

export function keyframeToLanePoint(
  keyframe: TransformKeyframe,
  base: Transform,
  clipDuration: number,
  width: number,
  laneHeight: number,
  property: TransformTimelineProperty = 'opacity',
): { x: number; y: number } {
  return {
    x: keyframeToTimelineX(keyframe, clipDuration, width),
    y: propertyToLaneY(keyframePropertyValue(keyframe, base, property), property, laneHeight),
  }
}

export function bezierHandleToLanePoint(
  keyframe: TransformKeyframe,
  partner: TransformKeyframe,
  handleType: 'in' | 'out',
  base: Transform,
  clipDuration: number,
  width: number,
  laneHeight: number,
  property: TransformTimelineProperty,
): { x: number; y: number } {
  const handle = handleType === 'out'
    ? getBezierHandleOut(keyframe, partner, property)
    : getBezierHandleIn(keyframe, partner, property)
  const time = bezierHandleAbsoluteTime(keyframe, handle)
  const value = bezierHandleAbsoluteValue(keyframe, property, base, handle)
  return {
    x: (time / Math.max(clipDuration, 0.001)) * width,
    y: propertyToLaneY(value, property, laneHeight),
  }
}

export function updateTransformBezierHandle(
  keyframes: TransformKeyframe[],
  keyframeId: string,
  handleType: 'in' | 'out',
  property: TransformTimelineProperty,
  timeOffset: number,
  valueOffset: number,
): TransformKeyframe[] {
  const sorted = sortTransformKeyframes(keyframes)
  const index = sorted.findIndex((kf) => kf.id === keyframeId)
  if (index < 0) return keyframes

  const target = sorted[index]
  const patched = patchBezierHandle(target, property, handleType, timeOffset, valueOffset)
  const endIndex = handleType === 'out' ? index + 1 : index
  const withEasing = endIndex < sorted.length && endIndex > 0
    ? sorted.map((kf, i) => (i === endIndex ? { ...kf, easing: 'bezier' as const } : kf))
    : sorted

  return sortTransformKeyframes(
    withEasing.map((kf) => (kf.id === keyframeId ? patched : kf)),
  )
}

export function segmentUsesBezier(
  start: TransformKeyframe,
  end: TransformKeyframe,
  property: TransformTimelineProperty,
): boolean {
  return shouldUseBezierForProperty(start, end, property)
}

/** 選択属性の補間に沿った SVG path (M/L) */
export function buildTransformPropertyCurvePath(
  transform: Transform,
  keyframes: TransformKeyframe[] | undefined,
  clipDuration: number,
  width: number,
  laneHeight: number,
  property: TransformTimelineProperty,
): string {
  if (!keyframes?.length || width <= 0 || laneHeight <= 0) return ''

  const duration = Math.max(clipDuration, 0.001)
  const samples = Math.max(2, Math.min(80, Math.ceil(width / 3)))
  const parts: string[] = []

  for (let i = 0; i <= samples; i++) {
    const localTime = (i / samples) * duration
    const resolved = getTransformAtLocalTime(transform, keyframes, localTime, duration)
    const value = getTransformPropertyValue(resolved, property)
    const x = (localTime / duration) * width
    const y = propertyToLaneY(value, property, laneHeight)
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  return parts.join(' ')
}

export function buildAllTransformPropertyCurvePaths(
  transform: Transform,
  keyframes: TransformKeyframe[] | undefined,
  clipDuration: number,
  width: number,
  laneHeight: number,
): { property: TransformTimelineProperty; path: string }[] {
  if (!keyframes?.length || width <= 0 || laneHeight <= 0) return []

  return TRANSFORM_TIMELINE_PROPERTIES.map((property) => ({
    property,
    path: buildTransformPropertyCurvePath(transform, keyframes, clipDuration, width, laneHeight, property),
  })).filter((entry) => entry.path.length > 0)
}

/** @deprecated buildTransformPropertyCurvePath を使用 */
export function buildTransformOpacityCurvePath(
  transform: Transform,
  keyframes: TransformKeyframe[] | undefined,
  clipDuration: number,
  width: number,
  laneHeight: number,
): string {
  return buildTransformPropertyCurvePath(transform, keyframes, clipDuration, width, laneHeight, 'opacity')
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
  property: TransformTimelineProperty = 'opacity',
  propertyValue?: number,
): TransformKeyframe[] {
  const localTime = Math.max(0, Math.min(clipDuration, time))
  const resolved = getTransformAtLocalTime(transform, keyframes, localTime, clipDuration)
  const values = {
    x: resolved.x,
    y: resolved.y,
    scale: resolved.scale,
    rotation: resolved.rotation,
    opacity: resolved.opacity,
  }
  if (propertyValue != null) {
    if (property === 'opacity') values.opacity = clampTransformTimelinePropertyValue(property, propertyValue)
    else values[property] = clampTransformTimelinePropertyValue(property, propertyValue)
  }
  return upsertTransformKeyframeAt(transform, keyframes, clipDuration, localTime, values)
}

export const TRANSFORM_KEYFRAME_TIME_EPSILON = 0.05

/** 指定時間付近のキーフレームがあれば更新、なければ追加 */
export function upsertTransformKeyframeAt(
  _transform: Transform,
  keyframes: TransformKeyframe[] | undefined,
  clipDuration: number,
  time: number,
  values: Pick<TransformKeyframe, 'x' | 'y' | 'scale' | 'rotation' | 'opacity'>,
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
