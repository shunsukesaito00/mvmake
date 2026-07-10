import type { ClipAnimation, TextAnimationType, TextClip } from '../types/project'

export const TEXT_ANIMATION_LABELS: Record<TextAnimationType, string> = {
  none: 'アニメーションなし',
  fadeIn: 'フェードイン',
  fadeOut: 'フェードアウト',
  slideUp: 'スライドアップ',
  typewriter: 'タイプライター',
  scaleIn: 'スケールイン',
  motionReveal: 'MG: リビール',
  motionSlideLeft: 'MG: スライドイン',
  motionPop: 'MG: ポップ',
  motionDrift: 'MG: ドリフト',
  keyframes: 'カスタム（キーフレーム）',
}

const FADE_IN_TYPES = new Set<TextAnimationType>([
  'fadeIn',
  'slideUp',
  'scaleIn',
  'motionReveal',
  'motionSlideLeft',
  'motionPop',
  'motionDrift',
])

export interface TextAnimationState {
  progress: number
  eased: number
  opacity: number
  offsetX: number
  offsetY: number
  scale: number
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function getTextAnimProgress(clip: TextClip, time: number): number {
  const duration = Math.max(clip.animation.duration, 0.01)
  return Math.max(0, Math.min(1, (time - clip.startTime) / duration))
}

export function isMotionTextAnimation(type: TextAnimationType): boolean {
  return type === 'motionReveal' || type === 'motionSlideLeft' || type === 'motionPop' || type === 'motionDrift'
}

/** transform キーフレームでモーションを駆動する場合、手続き型アニメをスキップする */
export function usesCustomTextKeyframes(clip: TextClip): boolean {
  return clip.animation.type === 'keyframes' || (clip.transformKeyframes?.length ?? 0) > 0
}

export function getTextOpacity(clip: TextClip, time: number): number {
  if (usesCustomTextKeyframes(clip)) return 1
  let opacity = 1
  const localTime = time - clip.startTime
  const animType = clip.animation.type

  if (FADE_IN_TYPES.has(animType) && localTime < clip.animation.duration) {
    const progress = getTextAnimProgress(clip, time)
    if (animType === 'fadeIn' || isMotionTextAnimation(animType)) {
      opacity *= easeOutCubic(progress)
    } else if (animType === 'slideUp' || animType === 'scaleIn') {
      opacity *= progress
    }
  }

  const remaining = clip.duration - localTime
  if (animType === 'fadeOut' && remaining < clip.animation.duration) {
    opacity *= remaining / clip.animation.duration
  }

  return opacity
}

export function computeTextAnimationState(
  clip: TextClip,
  time: number,
  canvasW: number,
  lineHeightPx: number,
): TextAnimationState {
  if (usesCustomTextKeyframes(clip)) {
    return { progress: 1, eased: 1, opacity: 1, offsetX: 0, offsetY: 0, scale: 1 }
  }

  const animType = clip.animation.type
  const progress = getTextAnimProgress(clip, time)
  const eased = easeOutCubic(progress)
  const state: TextAnimationState = {
    progress,
    eased,
    opacity: 1,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  }

  if (progress >= 1) return state

  switch (animType) {
    case 'slideUp':
      state.offsetY = (1 - eased) * lineHeightPx
      break
    case 'scaleIn':
      state.scale = 0.5 + 0.5 * eased
      break
    case 'motionReveal':
      state.offsetY = (1 - eased) * lineHeightPx * 2
      state.scale = 0.85 + 0.15 * eased
      break
    case 'motionSlideLeft':
      state.offsetX = -(1 - eased) * canvasW * 0.08
      break
    case 'motionPop':
      state.scale = 0.4 + 0.6 * eased
      break
    case 'motionDrift':
      state.offsetY = -(1 - eased) * lineHeightPx * 1.5
      state.scale = 0.92 + 0.08 * eased
      break
    default:
      break
  }

  return state
}

export function normalizeClipAnimation(animation?: Partial<ClipAnimation>): ClipAnimation {
  return {
    type: animation?.type ?? 'fadeIn',
    duration: animation?.duration ?? 0.8,
  }
}
