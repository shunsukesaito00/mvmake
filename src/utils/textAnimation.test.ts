import { describe, expect, it } from 'vitest'
import type { TextClip } from '../types/project'
import { computeTextAnimationState, getTextAnimProgress, getTextOpacity, isMotionTextAnimation, usesCustomTextKeyframes } from './textAnimation'

function makeTextClip(animationType: TextClip['animation']['type']): TextClip {
  return {
    id: 't1',
    trackId: 'track',
    type: 'text',
    startTime: 0,
    duration: 5,
    sourceStart: 0,
    sourceDuration: 5,
    text: {
      content: 'Test',
      fontFamily: 'Noto Sans JP',
      fontSize: 48,
      color: '#fff',
      strokeColor: '#000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 0,
      textAlign: 'center',
      lineHeight: 1.2,
      verticalAlign: 'center',
      backgroundColor: '',
      backgroundPadding: 16,
      backgroundRadius: 8,
    },
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    animation: { type: animationType, duration: 1 },
  }
}

describe('usesCustomTextKeyframes', () => {
  it('is true for keyframes animation type', () => {
    const clip = makeTextClip('keyframes')
    expect(usesCustomTextKeyframes(clip)).toBe(true)
  })

  it('is true when transform keyframes exist', () => {
    const clip = makeTextClip('motionReveal')
    clip.transformKeyframes = [{ id: 'k1', time: 0, x: 0.5, y: 0.5, scale: 1, rotation: 0 }]
    expect(usesCustomTextKeyframes(clip)).toBe(true)
  })

  it('skips procedural opacity when using custom keyframes', () => {
    const clip = makeTextClip('keyframes')
    clip.transformKeyframes = [
      { id: 'k1', time: 0, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 0 },
      { id: 'k2', time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    ]
    expect(getTextOpacity(clip, 0)).toBe(1)
    expect(computeTextAnimationState(clip, 0, 1920, 48).offsetY).toBe(0)
  })
})

describe('getTextOpacity', () => {
  it('fades in motion reveal at clip start', () => {
    const clip = makeTextClip('motionReveal')
    expect(getTextOpacity(clip, 0)).toBe(0)
    expect(getTextOpacity(clip, 0.5)).toBeGreaterThan(0)
    expect(getTextOpacity(clip, 1)).toBe(1)
  })

  it('fades in motion glow at clip start', () => {
    const clip = makeTextClip('motionGlow')
    expect(getTextOpacity(clip, 0)).toBe(0)
    expect(getTextOpacity(clip, 1)).toBe(1)
  })
})

describe('computeTextAnimationState', () => {
  it('combines slide and scale for motionReveal', () => {
    const clip = makeTextClip('motionReveal')
    const state = computeTextAnimationState(clip, 0, 1920, 48)
    expect(state.offsetY).toBeGreaterThan(0)
    expect(state.scale).toBeLessThan(1)
  })

  it('slides from left for motionSlideLeft', () => {
    const clip = makeTextClip('motionSlideLeft')
    const state = computeTextAnimationState(clip, 0, 1920, 48)
    expect(state.offsetX).toBeLessThan(0)
  })

  it('settles to identity after animation ends', () => {
    const clip = makeTextClip('motionPop')
    const state = computeTextAnimationState(clip, 2, 1920, 48)
    expect(state.scale).toBe(1)
    expect(state.offsetX).toBe(0)
    expect(state.offsetY).toBe(0)
  })

  it('rises gently for motionElegant', () => {
    const clip = makeTextClip('motionElegant')
    const state = computeTextAnimationState(clip, 0, 1920, 48)
    expect(state.offsetY).toBeGreaterThan(0)
    expect(state.scale).toBeLessThan(1)
  })

  it('drops from above for motionCurtain', () => {
    const clip = makeTextClip('motionCurtain')
    const state = computeTextAnimationState(clip, 0, 1920, 48)
    expect(state.offsetY).toBeLessThan(0)
  })

  it('zooms out softly for motionGlow', () => {
    const clip = makeTextClip('motionGlow')
    const state = computeTextAnimationState(clip, 0, 1920, 48)
    expect(state.scale).toBeGreaterThan(1)
  })
})

describe('isMotionTextAnimation', () => {
  it('detects MG animation types', () => {
    expect(isMotionTextAnimation('motionReveal')).toBe(true)
    expect(isMotionTextAnimation('motionElegant')).toBe(true)
    expect(isMotionTextAnimation('motionCurtain')).toBe(true)
    expect(isMotionTextAnimation('motionGlow')).toBe(true)
    expect(isMotionTextAnimation('fadeIn')).toBe(false)
  })
})

describe('getTextAnimProgress', () => {
  it('reaches 1 after duration', () => {
    const clip = makeTextClip('motionDrift')
    expect(getTextAnimProgress(clip, 1)).toBe(1)
  })
})
