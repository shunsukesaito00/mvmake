import type { MediaAsset, Project, Track, VideoClip } from '../types/project'
import {
  DEFAULT_AUDIO,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { createId } from './id'
import { useProjectStore } from '../store/projectStore'
import type { KeyframeNavType } from './keyframeNavigation'

export const KEYFRAME_NAV_STRESS_DURATION = 10
export const KEYFRAME_NAV_STRESS_START_TIME = 2

export interface KeyframeNavStressStats {
  clipId: string
  trackId: string
  firstNavTime: number
  secondNavTime: number
  thirdNavTime: number
  firstNavType: KeyframeNavType
  secondNavType: KeyframeNavType
  thirdNavType: KeyframeNavType
}

export function createKeyframeNavStressProject(): Project {
  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-keyframe-nav-video.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: 30,
  }

  const videoTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }

  const transformKfId = createId()
  const volumeKfId = createId()
  const speedKfId = createId()

  const clip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: KEYFRAME_NAV_STRESS_START_TIME,
    duration: KEYFRAME_NAV_STRESS_DURATION,
    sourceStart: 0,
    sourceDuration: KEYFRAME_NAV_STRESS_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    transformKeyframes: [{ id: transformKfId, time: 1, x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 }],
    audio: {
      ...DEFAULT_AUDIO,
      volumeKeyframes: [{ id: volumeKfId, time: 2, volume: 0.75 }],
    },
    speed: 1,
    speedKeyframes: [{ id: speedKfId, time: 3, speed: 1.5 }],
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
  }

  videoTrack.clips = [clip]

  return normalizeProject({
    id: createId(),
    name: 'ストレスキーフレームナビ検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [videoAsset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  })
}

export function getKeyframeNavStressStats(project: Project): KeyframeNavStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const clip = videoTrack?.clips.find((c) => c.type === 'video')
  if (!videoTrack || !clip || clip.type !== 'video') {
    throw new Error('keyframe nav stress: clip missing')
  }

  return {
    clipId: clip.id,
    trackId: videoTrack.id,
    firstNavTime: KEYFRAME_NAV_STRESS_START_TIME + 1,
    secondNavTime: KEYFRAME_NAV_STRESS_START_TIME + 2,
    thirdNavTime: KEYFRAME_NAV_STRESS_START_TIME + 3,
    firstNavType: 'transform',
    secondNavType: 'volume',
    thirdNavType: 'speed',
  }
}

export function seedKeyframeNavStress(): KeyframeNavStressStats {
  const project = createKeyframeNavStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getKeyframeNavStressStats(project)
  useProjectStore.getState().setSelectedClipId(stats.clipId)
  useProjectStore.getState().setCurrentTime(KEYFRAME_NAV_STRESS_START_TIME)
  return stats
}

export function jumpToAdjacentKeyframe(direction: 'prev' | 'next'): boolean {
  return useProjectStore.getState().jumpToAdjacentKeyframe(direction)
}

export function getSelectedNavKeyframe() {
  return useProjectStore.getState().selectedNavKeyframe
}
