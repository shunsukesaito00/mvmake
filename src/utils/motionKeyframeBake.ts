import type { TextClip, TransformKeyframe } from '../types/project'
import { createId } from './id'
import { getTextLineHeight } from './textLayout'
import { computeTextAnimationState, isMotionTextAnimation } from './textAnimation'

export const DEFAULT_BAKE_CANVAS_W = 1920
export const DEFAULT_BAKE_CANVAS_H = 1080

export function canBakeMotionToKeyframes(clip: TextClip): boolean {
  return isMotionTextAnimation(clip.animation.type)
}

/** MG プリセットアニメを transform キーフレーム 2 点に焼き込む */
export function bakeMotionPresetToKeyframes(
  clip: TextClip,
  canvasW = DEFAULT_BAKE_CANVAS_W,
  canvasH = DEFAULT_BAKE_CANVAS_H,
): TransformKeyframe[] {
  if (!canBakeMotionToKeyframes(clip)) {
    throw new Error('MG motion animation required for baking')
  }

  const { transform, animation } = clip
  const duration = Math.max(animation.duration, 0.01)
  const fontSize = clip.text.fontSize * (canvasW / 1920)
  const lineHeightPx = getTextLineHeight(fontSize, clip.text.lineHeight)

  const startState = computeTextAnimationState(clip, clip.startTime, canvasW, lineHeightPx)
  const endState = computeTextAnimationState(clip, clip.startTime + duration, canvasW, lineHeightPx)

  return [
    {
      id: createId(),
      time: 0,
      x: transform.x + startState.offsetX / canvasW,
      y: transform.y + startState.offsetY / canvasH,
      scale: transform.scale * startState.scale,
      rotation: transform.rotation,
      opacity: 0,
    },
    {
      id: createId(),
      time: duration,
      x: transform.x + endState.offsetX / canvasW,
      y: transform.y + endState.offsetY / canvasH,
      scale: transform.scale * endState.scale,
      rotation: transform.rotation,
      opacity: transform.opacity,
      easing: 'easeOut',
    },
  ]
}

export function applyBakedMotionKeyframes(
  clip: TextClip,
  canvasW?: number,
  canvasH?: number,
): Pick<TextClip, 'transformKeyframes' | 'animation'> {
  return {
    transformKeyframes: bakeMotionPresetToKeyframes(clip, canvasW, canvasH),
    animation: { type: 'keyframes', duration: clip.animation.duration },
  }
}
