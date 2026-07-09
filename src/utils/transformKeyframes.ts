import type { Transform, TransformKeyframe, TransformKeyframeEasing } from '../types/project'

export function sortTransformKeyframes(keyframes: TransformKeyframe[]): TransformKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

function lerp(a: number, b: number, ratio: number): number {
  return a + (b - a) * ratio
}

function keyframeOpacity(kf: TransformKeyframe, base: Transform): number {
  return kf.opacity ?? base.opacity
}

/** 0〜1 の線形進捗をイージング曲線に変換 */
export function applyTransformEasing(t: number, easing: TransformKeyframeEasing = 'linear'): number {
  const clamped = Math.max(0, Math.min(1, t))
  switch (easing) {
    case 'easeIn':
      return clamped * clamped
    case 'easeOut':
      return 1 - (1 - clamped) ** 2
    case 'easeInOut':
      return clamped < 0.5 ? 2 * clamped * clamped : 1 - (-2 * clamped + 2) ** 2 / 2
    default:
      return clamped
  }
}

/** クリップ内ローカル時間(0〜clipDuration)での transform。キーフレーム間は補間（イージング・不透明度対応） */
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
      const span = b.time - a.time
      if (span <= 0) {
        return {
          ...base,
          x: b.x,
          y: b.y,
          scale: b.scale,
          rotation: b.rotation,
          opacity: keyframeOpacity(b, base),
        }
      }
      const ratio = (t - a.time) / span
      const eased = applyTransformEasing(ratio, b.easing ?? 'linear')
      return {
        ...base,
        x: lerp(a.x, b.x, eased),
        y: lerp(a.y, b.y, eased),
        scale: lerp(a.scale, b.scale, eased),
        rotation: lerp(a.rotation, b.rotation, eased),
        opacity: lerp(keyframeOpacity(a, base), keyframeOpacity(b, base), eased),
      }
    }
  }

  return base
}
