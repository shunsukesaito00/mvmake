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
import { resolveVideoAudioSpeedSchedule, getVideoAudioPlaybackMode } from './speedAudioLink'
import { useProjectStore } from '../store/projectStore'

export const SPEED_AUDIO_LINK_STRESS_SLOW_SPEED = 0.5
export const SPEED_AUDIO_LINK_STRESS_LOCAL_END = 6

export interface SpeedAudioLinkStressStats {
  videoClipId: string
  linkedBufferDuration: number
  unlinkedBufferDuration: number
  timelineDuration: number
}

export function createSpeedAudioLinkStressProject(): Project {
  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-speed-audio.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: 20,
  }

  const videoTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }

  const videoClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: 0,
    duration: 8,
    sourceStart: 0,
    sourceDuration: 8,
    transform: { ...DEFAULT_TRANSFORM },
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    speedKeyframes: [
      { id: createId(), time: 0, speed: 1 },
      { id: createId(), time: 4, speed: SPEED_AUDIO_LINK_STRESS_SLOW_SPEED },
    ],
    speedAudioLinked: true,
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audioLinked: true,
  }

  videoTrack.clips = [videoClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス速度オーディオ連動検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [videoAsset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    ],
  })
}

export function getSpeedAudioLinkStressStats(project: Project): SpeedAudioLinkStressStats {
  const videoClip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.type === 'video')
  if (!videoClip || videoClip.type !== 'video') {
    throw new Error('speed audio link stress: video clip missing')
  }

  const linked = resolveVideoAudioSpeedSchedule(videoClip, 0, SPEED_AUDIO_LINK_STRESS_LOCAL_END)
  const unlinked = resolveVideoAudioSpeedSchedule(
    { ...videoClip, speedAudioLinked: false },
    0,
    SPEED_AUDIO_LINK_STRESS_LOCAL_END,
  )

  return {
    videoClipId: videoClip.id,
    linkedBufferDuration: linked.bufferDuration,
    unlinkedBufferDuration: unlinked.bufferDuration,
    timelineDuration: linked.timelineDuration,
  }
}

export function seedSpeedAudioLinkStress(): SpeedAudioLinkStressStats {
  const project = createSpeedAudioLinkStressProject()
  const stats = getSpeedAudioLinkStressStats(project)
  useProjectStore.getState().loadProject(project)
  useProjectStore.getState().setSelectedClipId(stats.videoClipId)
  return stats
}

export function isClipSpeedAudioLinked(clipId: string): boolean {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || clip.type !== 'video') return false
  return clip.speedAudioLinked !== false
}

export function setSpeedAudioLinkedById(clipId: string, linked: boolean): boolean {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || clip.type !== 'video') return false
  useProjectStore.getState().updateClip(clipId, { speedAudioLinked: linked })
  return true
}

export function setSpeedPreservePitchById(clipId: string, preserve: boolean): boolean {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || clip.type !== 'video') return false
  useProjectStore.getState().updateClip(clipId, { speedPreservePitch: preserve })
  return true
}

export function getVideoAudioPlaybackModeForClip(clipId: string): string | null {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || clip.type !== 'video') return null
  return getVideoAudioPlaybackMode(clip)
}

export function previewExportPlaybackModeParity(clipId: string): boolean {
  const first = getVideoAudioPlaybackModeForClip(clipId)
  const second = getVideoAudioPlaybackModeForClip(clipId)
  return first !== null && first === second
}

export function getVideoAudioSpeedScheduleForClip(
  clipId: string,
  localStart: number,
  localEnd: number,
) {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || clip.type !== 'video') return null
  return resolveVideoAudioSpeedSchedule(clip, localStart, localEnd)
}

export function previewExportScheduleParity(clipId: string, localStart: number, localEnd: number): boolean {
  const first = getVideoAudioSpeedScheduleForClip(clipId, localStart, localEnd)
  const second = getVideoAudioSpeedScheduleForClip(clipId, localStart, localEnd)
  if (!first || !second) return false
  return (
    first.sourceStart === second.sourceStart
    && first.bufferDuration === second.bufferDuration
    && first.timelineDuration === second.timelineDuration
    && first.linked === second.linked
  )
}
