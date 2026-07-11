import type { Clip } from '../types/project'
import { PHOTO_GUIDE_PREFIX } from './weddingTemplate'

export const MIN_GUIDE_SLIDESHOW_IMAGE_DURATION = 0.2

export function isPhotoGuideClip(clip: Clip): boolean {
  return clip.type === 'text' && clip.text.content.startsWith(PHOTO_GUIDE_PREFIX)
}

export function getPhotoGuideSlotLabel(content: string): string {
  if (!content.startsWith(PHOTO_GUIDE_PREFIX)) return content
  return content.slice(PHOTO_GUIDE_PREFIX.length)
}

/** ガイド区間内に均等配分する1枚あたり秒数（枚数が多いときは区間内に必ず収める） */
export function computeGuideSlideshowDurationPerImage(guideDuration: number, imageCount: number): number {
  const count = Math.max(imageCount, 1)
  const evenSplit = guideDuration / count
  if (count * MIN_GUIDE_SLIDESHOW_IMAGE_DURATION > guideDuration) return evenSplit
  return Math.max(MIN_GUIDE_SLIDESHOW_IMAGE_DURATION, evenSplit)
}
