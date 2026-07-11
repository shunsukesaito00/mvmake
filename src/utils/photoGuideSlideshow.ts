import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  type ImageClip,
  type TransitionType,
} from '../types/project'
import { createId } from './id'
import { computeGuideSlideshowDurationPerImage } from './photoGuide'

export const PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT = 52

export interface GuideSlideshowPlacementOptions {
  transitionType: TransitionType | 'none'
  transitionDuration: number
  kenBurns: boolean
}

/** ガイド区間内に配置したスライドショーの終了時刻（秒） */
export function getGuideSlideshowEndTime(
  guideStartTime: number,
  guideDuration: number,
  imageCount: number,
): number {
  const perImage = computeGuideSlideshowDurationPerImage(guideDuration, imageCount)
  return guideStartTime + perImage * imageCount
}

export function guideSlideshowFitsRegion(guideDuration: number, imageCount: number): boolean {
  if (imageCount <= 0) return true
  const perImage = computeGuideSlideshowDurationPerImage(guideDuration, imageCount)
  return perImage * imageCount <= guideDuration + 1e-6
}

export function buildGuideSlideshowImageClips(
  guideStartTime: number,
  guideDuration: number,
  trackId: string,
  mediaIds: string[],
  options: GuideSlideshowPlacementOptions,
  idFactory: () => string = createId,
): ImageClip[] {
  if (mediaIds.length === 0) return []

  const durationPerImage = computeGuideSlideshowDurationPerImage(guideDuration, mediaIds.length)
  let cursor = guideStartTime

  return mediaIds.map((mediaId, i) => {
    const clip: ImageClip = {
      id: idFactory(),
      trackId,
      startTime: cursor,
      duration: durationPerImage,
      sourceStart: 0,
      sourceDuration: durationPerImage,
      type: 'image',
      mediaId,
      transform: { ...DEFAULT_TRANSFORM },
      kenBurns: { ...DEFAULT_KEN_BURNS, enabled: options.kenBurns },
      color: { ...DEFAULT_COLOR },
      crop: { ...DEFAULT_CROP },
      ...DEFAULT_VISUAL_FADE,
    }
    if (i > 0 && options.transitionType !== 'none') {
      clip.transition = { type: options.transitionType, duration: options.transitionDuration }
    }
    cursor += durationPerImage
    return clip
  })
}

export function createStressImageAssets(count: number): { id: string; name: string; type: 'image'; blob: Blob; url: string; duration: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `stress-photo-${i}`,
    name: `photo-${String(i + 1).padStart(3, '0')}.jpg`,
    type: 'image' as const,
    blob: new Blob(),
    url: `blob:stress-photo-${i}`,
    duration: 5,
  }))
}
