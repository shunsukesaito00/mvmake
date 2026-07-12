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

export const ROLLING_EDIT_STRESS_PREV_DURATION = 4
export const ROLLING_EDIT_STRESS_NEXT_DURATION = 3
export const ROLLING_EDIT_STRESS_DELTA = 0.5
export const ROLLING_EDIT_STRESS_MEDIA_DURATION = 30

export interface RollingEditStressStats {
  prevClipId: string
  nextClipId: string
  trackId: string
  prevDurationBefore: number
  nextStartBefore: number
  nextDurationBefore: number
  rollingDelta: number
}

function findVideoClip(project: Project, clipId: string): VideoClip | null {
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.id === clipId && clip.type === 'video') return clip
    }
  }
  return null
}

export function createRollingEditStressProject(): Project {
  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-rolling-edit-video.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: ROLLING_EDIT_STRESS_MEDIA_DURATION,
  }

  const videoTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }

  const prevClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: 0,
    duration: ROLLING_EDIT_STRESS_PREV_DURATION,
    sourceStart: 0,
    sourceDuration: ROLLING_EDIT_STRESS_PREV_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audio: { ...DEFAULT_AUDIO },
  }

  const nextClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: ROLLING_EDIT_STRESS_PREV_DURATION,
    duration: ROLLING_EDIT_STRESS_NEXT_DURATION,
    sourceStart: 0,
    sourceDuration: ROLLING_EDIT_STRESS_NEXT_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audio: { ...DEFAULT_AUDIO },
  }

  videoTrack.clips = [prevClip, nextClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレスローリング編集検証',
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

export function getRollingEditStressStats(project: Project): RollingEditStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const clips = [...(videoTrack?.clips ?? [])].sort((a, b) => a.startTime - b.startTime)
  const prev = clips[0]
  const next = clips[1]

  if (!videoTrack || !prev || prev.type !== 'video' || !next || next.type !== 'video') {
    throw new Error('rolling edit stress: clips missing')
  }

  return {
    prevClipId: prev.id,
    nextClipId: next.id,
    trackId: videoTrack.id,
    prevDurationBefore: prev.duration,
    nextStartBefore: next.startTime,
    nextDurationBefore: next.duration,
    rollingDelta: ROLLING_EDIT_STRESS_DELTA,
  }
}

export function seedRollingEditStress(): RollingEditStressStats {
  const project = createRollingEditStressProject()
  useProjectStore.getState().loadProject(project)
  return getRollingEditStressStats(project)
}

export function rollingTrimAtEditPointById(prevClipId: string, nextClipId: string, delta: number): boolean {
  return useProjectStore.getState().rollingTrimAtEditPoint(prevClipId, nextClipId, delta)
}

export function getRollingEditClipDuration(clipId: string): number {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`rolling edit stress: clip not found: ${clipId}`)
  return clip.duration
}

export function getRollingEditClipStartTime(clipId: string): number {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`rolling edit stress: clip not found: ${clipId}`)
  return clip.startTime
}
