import type { MediaAsset, MediaType } from '../types/project'
import { useProjectStore } from '../store/projectStore'

/** E2E/ストレス用メディア件数（婚礼アルバム規模） */
export const MEDIA_LIST_STRESS_COUNT = 52

const IMAGE_COUNT = 45
const AUDIO_COUNT = 5
const VIDEO_COUNT = MEDIA_LIST_STRESS_COUNT - IMAGE_COUNT - AUDIO_COUNT

function stressAsset(id: string, name: string, type: MediaType, duration: number): MediaAsset {
  return {
    id,
    name,
    type,
    blob: new Blob(),
    url: `blob:${id}`,
    duration,
  }
}

export function createStressMediaListAssets(count = MEDIA_LIST_STRESS_COUNT): MediaAsset[] {
  const assets: MediaAsset[] = []
  const imageSlots = count - AUDIO_COUNT - VIDEO_COUNT

  for (let i = 0; i < imageSlots - 2; i++) {
    assets.push(stressAsset(
      `stress-media-img-${i}`,
      `photo-${String(i + 1).padStart(3, '0')}.jpg`,
      'image',
      5,
    ))
  }
  assets.push(stressAsset('stress-media-alpha', 'alpha-cover.jpg', 'image', 5))
  assets.push(stressAsset('stress-media-zebra', 'zebra-outro.jpg', 'image', 5))

  for (let i = 0; i < AUDIO_COUNT; i++) {
    assets.push(stressAsset(
      `stress-media-audio-${i}`,
      `bgm-${String(i + 1).padStart(2, '0')}.wav`,
      'audio',
      30,
    ))
  }

  for (let i = 0; i < VIDEO_COUNT; i++) {
    assets.push(stressAsset(
      `stress-media-video-${i}`,
      `clip-${String(i + 1).padStart(2, '0')}.mp4`,
      'video',
      12,
    ))
  }

  if (assets.length !== count) {
    throw new Error(`expected ${count} stress media assets, got ${assets.length}`)
  }
  return assets
}

export interface MediaListStressStats {
  mediaCount: number
  imageCount: number
  audioCount: number
  videoCount: number
}

export function seedMediaListStress(count = MEDIA_LIST_STRESS_COUNT): MediaListStressStats {
  const store = useProjectStore.getState()
  const assets = createStressMediaListAssets(count)
  for (const asset of assets) {
    store.addMediaAsset(asset)
  }
  return {
    mediaCount: assets.length,
    imageCount: assets.filter((a) => a.type === 'image').length,
    audioCount: assets.filter((a) => a.type === 'audio').length,
    videoCount: assets.filter((a) => a.type === 'video').length,
  }
}
