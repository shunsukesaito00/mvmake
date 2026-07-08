import { describe, expect, it } from 'vitest'
import type { TextClip } from '../types/project'
import {
  computeGuideSlideshowDurationPerImage,
  getPhotoGuideSlotLabel,
  isPhotoGuideClip,
} from './photoGuide'
import { formatPhotoGuideLabel } from './weddingTemplate'

function guideClip(content: string): TextClip {
  return {
    id: 'g1',
    trackId: 'text',
    type: 'text',
    startTime: 22,
    duration: 7,
    sourceStart: 0,
    sourceDuration: 7,
    text: {
      content,
      fontFamily: 'Noto Sans JP',
      fontSize: 24,
      color: '#9ca3af',
      strokeColor: '#000',
      strokeWidth: 0,
      shadowColor: '#000',
      shadowBlur: 0,
      textAlign: 'center',
      lineHeight: 1.2,
      verticalAlign: 'center',
    },
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
    animation: { type: 'none', duration: 0 },
  }
}

describe('photoGuide', () => {
  it('写真ガイドクリップを判定する', () => {
    expect(isPhotoGuideClip(guideClip(formatPhotoGuideLabel('新郎 幼少期')))).toBe(true)
    expect(isPhotoGuideClip(guideClip('Opening'))).toBe(false)
  })

  it('ガイドラベルを取得する', () => {
    expect(getPhotoGuideSlotLabel(formatPhotoGuideLabel('新郎 幼少期'))).toBe('新郎 幼少期')
  })

  it('区間内に均等配分する秒数を計算する', () => {
    expect(computeGuideSlideshowDurationPerImage(7, 2)).toBe(3.5)
    expect(computeGuideSlideshowDurationPerImage(1, 10)).toBe(0.2)
  })
})
