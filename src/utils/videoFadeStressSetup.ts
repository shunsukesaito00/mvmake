import type { ImageClip, MediaAsset, Project, Track, VideoClip } from '../types/project'
import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { createId } from './id'
import { getMediaVisualOpacityAtTime } from './visualFade'
import { useProjectStore } from '../store/projectStore'

export const VIDEO_FADE_STRESS_CLIP_COUNT = 2
export const VIDEO_FADE_STRESS_IMAGE_FADE_IN = 1
export const VIDEO_FADE_STRESS_IMAGE_FADE_OUT = 0.5
export const VIDEO_FADE_STRESS_VIDEO_FADE_IN = 0.5
export const VIDEO_FADE_STRESS_VIDEO_FADE_OUT = 1
export const VIDEO_FADE_STRESS_IMAGE_DURATION = 5
export const VIDEO_FADE_STRESS_VIDEO_DURATION = 6

export interface VideoFadeStressStats {
  imageClipId: string
  videoClipId: string
  imageClipName: string
  videoClipName: string
  clipCount: number
  imageFadeIn: number
  imageFadeOut: number
  videoFadeIn: number
  videoFadeOut: number
  imageOpacityAtStart: number
  imageOpacityAtMid: number
  videoOpacityAtEnd: number
}

function findVisualClip(project: Project, clipId: string): ImageClip | VideoClip | null {
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.id === clipId && (clip.type === 'image' || clip.type === 'video')) {
        return clip
      }
    }
  }
  return null
}

export function getMediaVisualOpacityForClip(clipId: string, time: number): number {
  const clip = findVisualClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`video fade stress: clip not found: ${clipId}`)
  return getMediaVisualOpacityAtTime(clip, time)
}

export function getClipFadeValues(clipId: string): { fadeIn: number; fadeOut: number } {
  const clip = findVisualClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`video fade stress: clip not found: ${clipId}`)
  return { fadeIn: clip.fadeIn, fadeOut: clip.fadeOut }
}

export function applyClipFade(clipId: string, fadeIn: number, fadeOut: number): { fadeIn: number; fadeOut: number } {
  useProjectStore.getState().updateClip(clipId, { fadeIn, fadeOut }, true)
  return getClipFadeValues(clipId)
}

export function createVideoFadeStressProject(): Project {
  const imageAsset: MediaAsset = {
    id: createId(),
    name: 'stress-fade-image.png',
    type: 'image',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: VIDEO_FADE_STRESS_IMAGE_DURATION,
  }

  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-fade-video.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: VIDEO_FADE_STRESS_VIDEO_DURATION,
  }

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
    mediaId: imageAsset.id,
    startTime: 0,
    duration: VIDEO_FADE_STRESS_IMAGE_DURATION,
    sourceStart: 0,
    sourceDuration: VIDEO_FADE_STRESS_IMAGE_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    fadeIn: VIDEO_FADE_STRESS_IMAGE_FADE_IN,
    fadeOut: VIDEO_FADE_STRESS_IMAGE_FADE_OUT,
  }

  const videoClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: 0,
    duration: VIDEO_FADE_STRESS_VIDEO_DURATION,
    sourceStart: 0,
    sourceDuration: VIDEO_FADE_STRESS_VIDEO_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    fadeIn: VIDEO_FADE_STRESS_VIDEO_FADE_IN,
    fadeOut: VIDEO_FADE_STRESS_VIDEO_FADE_OUT,
    audio: { volume: 1, fadeIn: 0, fadeOut: 0 },
  }

  videoTrack.clips = [imageClip, videoClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス映像フェード検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [imageAsset, videoAsset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  })
}

export function getVideoFadeStressStats(project: Project): VideoFadeStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  if (!videoTrack) throw new Error('video fade stress: missing video track')

  const imageClip = videoTrack.clips.find((c) => c.type === 'image')
  const videoClip = videoTrack.clips.find((c) => c.type === 'video')
  if (!imageClip || imageClip.type !== 'image' || !videoClip || videoClip.type !== 'video') {
    throw new Error('video fade stress: missing image/video clips')
  }

  const imageOpacityAtStart = getMediaVisualOpacityAtTime(imageClip, imageClip.startTime)
  const imageOpacityAtMid = getMediaVisualOpacityAtTime(imageClip, imageClip.startTime + VIDEO_FADE_STRESS_IMAGE_FADE_IN / 2)
  const videoOpacityAtEnd = getMediaVisualOpacityAtTime(videoClip, videoClip.startTime + videoClip.duration)

  return {
    imageClipId: imageClip.id,
    videoClipId: videoClip.id,
    imageClipName: project.mediaAssets.find((a) => a.id === imageClip.mediaId)?.name ?? 'stress-fade-image.png',
    videoClipName: project.mediaAssets.find((a) => a.id === videoClip.mediaId)?.name ?? 'stress-fade-video.mp4',
    clipCount: videoTrack.clips.length,
    imageFadeIn: imageClip.fadeIn,
    imageFadeOut: imageClip.fadeOut,
    videoFadeIn: videoClip.fadeIn,
    videoFadeOut: videoClip.fadeOut,
    imageOpacityAtStart,
    imageOpacityAtMid,
    videoOpacityAtEnd,
  }
}

export function seedVideoFadeStress(): VideoFadeStressStats {
  const project = createVideoFadeStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getVideoFadeStressStats(project)

  if (stats.clipCount !== VIDEO_FADE_STRESS_CLIP_COUNT) {
    throw new Error(`expected ${VIDEO_FADE_STRESS_CLIP_COUNT} clips, got ${stats.clipCount}`)
  }
  if (stats.imageOpacityAtStart !== 0) {
    throw new Error(`expected image opacity 0 at start, got ${stats.imageOpacityAtStart}`)
  }
  if (stats.videoOpacityAtEnd !== 0) {
    throw new Error(`expected video opacity 0 at end, got ${stats.videoOpacityAtEnd}`)
  }

  return stats
}
