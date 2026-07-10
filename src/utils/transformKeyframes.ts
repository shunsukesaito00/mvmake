import type { Transform, TransformKeyframe, TransformKeyframeProperty } from '../types/project'
import {
  samplePropertyWithBezier,
  shouldUseBezierForProperty,
} from './transformKeyframeBezier'
import { keyframePropertyValue } from './transformKeyframesTimeline'

export function sortTransformKeyframes(keyframes: TransformKeyframe[]): TransformKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

function lerp(a: number, b: number, ratio: number): number {
  return a + (b - a) * ratio
}

function keyframeOpacity(kf: TransformKeyframe, base: Transform): number {
  return kf.opacity ?? base.opacity
}

const TRANSFORM_PROPERTIES: TransformKeyframeProperty[] = ['x', 'y', 'scale', 'rotation', 'opacity']

/** 0〜1 の線形進捗をイージング曲線に変換 */
export function applyTransformEasing(t: number, easing: TransformKeyframe['easing'] = 'linear'): number {
  const clamped = Math.max(0, Math.min(1, t))
  switch (easing) {
    case 'easeIn':
      return clamped * clamped
    case 'easeOut':
      return 1 - (1 - clamped) ** 2
    case 'easeInOut':
      return clamped < 0.5 ? 2 * clamped * clamped : 1 - (-2 * clamped + 2) ** 2 / 2
    case 'bezier':
      return clamped
    default:
      return clamped
  }
}

function interpolatePropertyAtSegment(
  start: TransformKeyframe,
  end: TransformKeyframe,
  property: TransformKeyframeProperty,
  base: Transform,
  localTime: number,
): number {
  if (shouldUseBezierForProperty(start, end, property)) {
    return samplePropertyWithBezier(start, end, property, base, localTime)
  }

  const span = end.time - start.time
  if (span <= 0) {
    return keyframePropertyValue(end, base, property)
  }

  const ratio = (localTime - start.time) / span
  const eased = applyTransformEasing(ratio, end.easing ?? 'linear')
  const v0 = keyframePropertyValue(start, base, property)
  const v1 = keyframePropertyValue(end, base, property)
  return lerp(v0, v1, eased)
}

/** クリップ内ローカル時間(0〜clipDuration)での transform。キーフレーム間は補間（イージング・ベジェ・不透明度対応） */
export function getTransformAtLocalTime(
  base: Transform,
  keyframes: TransformKeyframe[] | undefined,
  localTime: number,
  clipDuration: number,
): Transform {
  if (!keyframes?.length) return base

  const sorted = sortTransformKeyframes(keyframes)
  const t = Math.max(0, Math.min(clipDuration, localTime))

  if (t <= sorted[0].time) {
    const kf = sorted[0]
    return {
      ...base,
      x: kf.x,
      y: kf.y,
      scale: kf.scale,
      rotation: kf.rotation,
      opacity: keyframeOpacity(kf, base),
    }
  }

  const last = sorted[sorted.length - 1]
  if (t >= last.time) {
    return {
      ...base,
      x: last.x,
      y: last.y,
      scale: last.scale,
      rotation: last.rotation,
      opacity: keyframeOpacity(last, base),
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (t >= a.time && t <= b.time) {
      const values = Object.fromEntries(
        TRANSFORM_PROPERTIES.map((property) => [
          property,
          interpolatePropertyAtSegment(a, b, property, base, t),
        ]),
      ) as Record<TransformKeyframeProperty, number>

      return {
        ...base,
        x: values.x,
        y: values.y,
        scale: values.scale,
        rotation: values.rotation,
        opacity: values.opacity,
      }
    }
  }

  return base
}
