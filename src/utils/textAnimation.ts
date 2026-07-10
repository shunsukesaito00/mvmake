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
  motionElegant: 'MG: エレガント',
  motionCurtain: 'MG: カーテン',
  motionGlow: 'MG: グローイン',
  motionSparkle: 'MG: スパークル',
  motionRibbon: 'MG: リボン',
  motionHeartbeat: 'MG: ハートビート',
  motionPetals: 'MG: 花びら舞',
  motionShimmer: 'MG: シマー',
  motionVows: 'MG: 誓い',
  keyframes: 'カスタム（キーフレーム）',
}

const MOTION_TEXT_ANIMATIONS = new Set<TextAnimationType>([
  'motionReveal',
  'motionSlideLeft',
  'motionPop',
  'motionDrift',
  'motionElegant',
  'motionCurtain',
  'motionGlow',
  'motionSparkle',
  'motionRibbon',
  'motionHeartbeat',
  'motionPetals',
  'motionShimmer',
  'motionVows',
])

const FADE_IN_TYPES = new Set<TextAnimationType>([
  'fadeIn',
  'slideUp',
  'scaleIn',
  ...MOTION_TEXT_ANIMATIONS,
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
  return MOTION_TEXT_ANIMATIONS.has(type)
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
    case 'motionElegant':
      state.offsetY = (1 - eased) * lineHeightPx * 1.2
      state.scale = 0.9 + 0.1 * eased
      break
    case 'motionCurtain':
      state.offsetY = -(1 - eased) * lineHeightPx * 2.5
      break
    case 'motionGlow':
      state.scale = 1.12 - 0.12 * eased
      break
    case 'motionSparkle':
      state.offsetY = -(1 - eased) * lineHeightPx * 0.6
      state.scale = 1.18 - 0.18 * eased
      break
    case 'motionRibbon':
      state.offsetX = (1 - eased) * canvasW * 0.1
      state.scale = 0.9 + 0.1 * eased
      break
    case 'motionHeartbeat':
      state.scale = 0.82 + 0.18 * eased + Math.sin(eased * Math.PI) * 0.1
      break
    case 'motionPetals':
      state.offsetX = -(1 - eased) * canvasW * 0.05
      state.offsetY = -(1 - eased) * lineHeightPx * 0.9
      state.scale = 0.88 + 0.12 * eased
      break
    case 'motionShimmer':
      state.offsetX = Math.sin(eased * Math.PI * 3) * canvasW * 0.012 * (1 - eased)
      state.scale = 0.94 + 0.06 * eased + Math.sin(eased * Math.PI * 2) * 0.035
      break
    case 'motionVows':
      state.offsetY = (1 - eased) * lineHeightPx * 2.2
      state.scale = 0.84 + 0.16 * eased
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
