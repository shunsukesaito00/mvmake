import { describe, expect, it } from 'vitest'
import { computeGuideSlideshowDurationPerImage } from './photoGuide'
import {
  buildGuideSlideshowImageClips,
  getGuideSlideshowEndTime,
  guideSlideshowFitsRegion,
  PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT,
} from './photoGuideSlideshow'

describe('photoGuideSlideshow', () => {
  const options = { transitionType: 'crossfade' as const, transitionDuration: 0.6, kenBurns: true }

  it('52 枚でもガイド区間内に収まる', () => {
    const guideDuration = 7
    const count = PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT
    expect(guideSlideshowFitsRegion(guideDuration, count)).toBe(true)
    const perImage = computeGuideSlideshowDurationPerImage(guideDuration, count)
    expect(getGuideSlideshowEndTime(22, guideDuration, count)).toBeCloseTo(22 + guideDuration, 5)
    expect(perImage * count).toBeCloseTo(guideDuration, 5)
  })

  it('buildGuideSlideshowImageClips は区間先頭から連続配置する', () => {
    const clips = buildGuideSlideshowImageClips(22, 7, 'video-1', ['a', 'b', 'c'], options, () => 'id')
    expect(clips).toHaveLength(3)
    expect(clips[0].startTime).toBe(22)
    expect(clips[1].transition?.type).toBe('crossfade')
    expect(getGuideSlideshowEndTime(22, 7, 3)).toBeCloseTo(29, 5)
  })

  it('枚数が少ないときは MIN 秒数を維持する', () => {
    expect(computeGuideSlideshowDurationPerImage(7, 2)).toBe(3.5)
    expect(guideSlideshowFitsRegion(7, 2)).toBe(true)
  })

  it('枚数が多いときは evenSplit で区間内に収める', () => {
    expect(computeGuideSlideshowDurationPerImage(1, 10)).toBeCloseTo(0.1, 5)
    expect(guideSlideshowFitsRegion(1, 10)).toBe(true)
  })
})
