import { PROJECT_TEMPLATES } from '../types/project'
import { isPhotoGuideClip } from '../utils/photoGuide'
import { createStressImageAssets, PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT } from '../utils/photoGuideSlideshow'
import { useProjectStore } from '../store/projectStore'

export interface PhotoGuideSlideshowStressStats {
  imageCount: number
  guideCount: number
  guideClipIds: string[]
}

export function seedPhotoGuideSlideshowStress(
  imageCount = PHOTO_GUIDE_SLIDESHOW_STRESS_IMAGE_COUNT,
): PhotoGuideSlideshowStressStats {
  const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')
  if (!template) throw new Error('structured-wedding template missing')

  const store = useProjectStore.getState()
  store.applyTemplate(template)
  for (const asset of createStressImageAssets(imageCount)) {
    store.addMediaAsset(asset)
  }

  const guideClipIds = store.project.tracks
    .flatMap((t) => t.clips)
    .filter((c) => isPhotoGuideClip(c))
    .map((c) => c.id)

  return { imageCount, guideCount: guideClipIds.length, guideClipIds }
}
