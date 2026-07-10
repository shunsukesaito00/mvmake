import { describe, expect, it } from 'vitest'
import type { TextClip } from '../types/project'
import { bakeMotionPresetToKeyframes, canBakeMotionToKeyframes, applyBakedMotionKeyframes } from './motionKeyframeBake'
import { usesCustomTextKeyframes } from './textAnimation'

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
    animation: { type: animationType, duration: 0.9 },
  }
}

describe('canBakeMotionToKeyframes', () => {
  it('allows MG animation types only', () => {
    expect(canBakeMotionToKeyframes(makeTextClip('motionReveal'))).toBe(true)
    expect(canBakeMotionToKeyframes(makeTextClip('fadeIn'))).toBe(false)
  })
})

describe('bakeMotionPresetToKeyframes', () => {
  it('creates start/end keyframes for motionReveal', () => {
    const clip = makeTextClip('motionReveal')
    const keyframes = bakeMotionPresetToKeyframes(clip)
    expect(keyframes).toHaveLength(2)
    expect(keyframes[0].time).toBe(0)
    expect(keyframes[0].opacity).toBe(0)
    expect(keyframes[0].y).toBeGreaterThan(keyframes[1].y)
    expect(keyframes[0].scale).toBeLessThan(keyframes[1].scale)
    expect(keyframes[1].time).toBe(0.9)
    expect(keyframes[1].easing).toBe('easeOut')
  })

  it('offsets slide-left motion on X', () => {
    const clip = makeTextClip('motionSlideLeft')
    const keyframes = bakeMotionPresetToKeyframes(clip)
    expect(keyframes[0].x).toBeLessThan(keyframes[1].x)
  })
})

describe('applyBakedMotionKeyframes', () => {
  it('switches animation type to keyframes', () => {
    const clip = makeTextClip('motionPop')
    const baked = applyBakedMotionKeyframes(clip)
    expect(baked.animation.type).toBe('keyframes')
    expect(baked.transformKeyframes).toHaveLength(2)
    expect(usesCustomTextKeyframes({ ...clip, ...baked })).toBe(true)
  })
})
