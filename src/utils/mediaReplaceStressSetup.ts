import type { ImageClip, MediaAsset, Project, Track, VideoClip } from '../types/project'
import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { getMediaReplaceCandidates } from './clipUtils'
import { createId } from './id'
import { useProjectStore } from '../store/projectStore'

/** 差し替え候補検証用の映像・画像メディア数 */
export const MEDIA_REPLACE_STRESS_VISUAL_COUNT = 10
/** 音声差し替え検証用（映像候補に混ぜない） */
export const MEDIA_REPLACE_STRESS_AUDIO_COUNT = 3

const IMAGE_COUNT = 8
const VIDEO_COUNT = MEDIA_REPLACE_STRESS_VISUAL_COUNT - IMAGE_COUNT

function stressVisualAsset(index: number, type: 'image' | 'video'): MediaAsset {
  const isImage = type === 'image'
  return {
    id: `stress-replace-${type}-${index}`,
    name: isImage
      ? `replace-photo-${String(index + 1).padStart(2, '0')}.jpg`
      : `replace-clip-${String(index + 1).padStart(2, '0')}.mp4`,
    type,
    blob: new Blob(),
    url: `blob:stress-replace-${type}-${index}`,
    duration: isImage ? 8 : 12,
  }
}

function stressAudioAsset(index: number): MediaAsset {
  return {
    id: `stress-replace-audio-${index}`,
    name: `replace-bgm-${String(index + 1).padStart(2, '0')}.wav`,
    type: 'audio',
    blob: new Blob(),
    url: `blob:stress-replace-audio-${index}`,
    duration: 30,
  }
}

export function createMediaReplaceStressAssets(): MediaAsset[] {
  const images = Array.from({ length: IMAGE_COUNT }, (_, i) => stressVisualAsset(i, 'image'))
  const videos = Array.from({ length: VIDEO_COUNT }, (_, i) => stressVisualAsset(i, 'video'))
  const audios = Array.from({ length: MEDIA_REPLACE_STRESS_AUDIO_COUNT }, (_, i) => stressAudioAsset(i))
  return [...images, ...videos, ...audios]
}

const CUSTOM_KEN_BURNS = {
  enabled: true,
  startScale: 1.1,
  endScale: 1.4,
  startX: 0.4,
  startY: 0.45,
  endX: 0.6,
  endY: 0.55,
}

export function createMediaReplaceStressProject(): Project {
  const assets = createMediaReplaceStressAssets()
  const imageMedia = assets.find((a) => a.type === 'image')!
  const videoMedia = assets.find((a) => a.type === 'video')!

  const videoTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }

  const imageClip: ImageClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'image',
    mediaId: imageMedia.id,
    startTime: 0,
    duration: 5,
    sourceStart: 0,
    sourceDuration: 5,
    transform: { x: 0.42, y: 0.58, scale: 1.05, rotation: 3, opacity: 1 },
    kenBurns: { ...CUSTOM_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    transition: { type: 'crossfade', duration: 0.5 },
    ...DEFAULT_VISUAL_FADE,
  }

  const videoClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoMedia.id,
    startTime: 6,
    duration: 6,
    sourceStart: 0,
    sourceDuration: 6,
    transform: { ...DEFAULT_TRANSFORM },
    audio: { volume: 0.42, fadeIn: 0.8, fadeOut: 0.5 },
    speed: 1.5,
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    transition: { type: 'fadeBlack', duration: 0.6 },
    ...DEFAULT_VISUAL_FADE,
  }

  videoTrack.clips = [imageClip, videoClip]

  const audioTrack: Track = {
    id: createId(),
    name: 'BGM',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
  }

  return normalizeProject({
    id: createId(),
    name: 'ストレス差し替え検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: assets,
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      audioTrack,
    ],
  })
}

export interface MediaReplaceStressStats {
  imageClipId: string
  videoClipId: string
  imageClipMediaId: string
  videoClipMediaId: string
  imageReplaceTargetId: string
  videoReplaceTargetId: string
  imageCandidateCount: number
  videoCandidateCount: number
  visualAssetCount: number
}

export function getMediaReplaceStressStats(project: Project): MediaReplaceStressStats {
  const videoTrack = project.tracks.find((t) => t.name === '映像 1' && t.type === 'video')
  if (!videoTrack) throw new Error('media replace stress project: missing video track')

  const imageClip = videoTrack.clips.find((c) => c.type === 'image')
  const videoClip = videoTrack.clips.find((c) => c.type === 'video')
  if (!imageClip || imageClip.type !== 'image' || !videoClip || videoClip.type !== 'video') {
    throw new Error('media replace stress project: missing image/video clips')
  }

  const secondImage = project.mediaAssets.find(
    (a) => a.type === 'image' && a.id !== imageClip.mediaId,
  )!
  const secondVideo = project.mediaAssets.find(
    (a) => a.type === 'video' && a.id !== videoClip.mediaId,
  )!

  return {
    imageClipId: imageClip.id,
    videoClipId: videoClip.id,
    imageClipMediaId: imageClip.mediaId,
    videoClipMediaId: videoClip.mediaId,
    imageReplaceTargetId: secondImage.id,
    videoReplaceTargetId: secondVideo.id,
    imageCandidateCount: getMediaReplaceCandidates(imageClip, project.mediaAssets).length,
    videoCandidateCount: getMediaReplaceCandidates(videoClip, project.mediaAssets).length,
    visualAssetCount: project.mediaAssets.filter((a) => a.type === 'image' || a.type === 'video').length,
  }
}

export function seedMediaReplaceStress(): MediaReplaceStressStats {
  const project = createMediaReplaceStressProject()
  useProjectStore.getState().loadProject(project)
  return getMediaReplaceStressStats(project)
}
