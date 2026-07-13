import type { AudioClip, MediaAsset, Project, Track, VideoClip } from '../types/project'
import {
  DEFAULT_AUDIO,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_DUCKING,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { createId } from './id'
import { getDuckingIntervals } from './clipUtils'
import { getAudioClipsFromProject } from './clipUtils'
import { isVideoAudioLinked } from './videoAudioLink'
import { useProjectStore } from '../store/projectStore'

export const VIDEO_AUDIO_LINK_STRESS_VIDEO_START = 2
export const VIDEO_AUDIO_LINK_STRESS_VIDEO_DURATION = 5

export interface VideoAudioLinkStressStats {
  videoClipId: string
  audioTrackId: string
  duckingClipId: string
  narrationStartTime: number
  duckingIntervalCountBefore: number
}

export function createVideoAudioLinkStressProject(): Project {
  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-video-audio-link.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: 30,
  }

  const bgmAsset: MediaAsset = {
    id: createId(),
    name: 'stress-bgm.wav',
    type: 'audio',
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

  const audioTrack: Track = {
    id: createId(),
    name: 'BGM',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
  }

  const videoClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: VIDEO_AUDIO_LINK_STRESS_VIDEO_START,
    duration: VIDEO_AUDIO_LINK_STRESS_VIDEO_DURATION,
    sourceStart: 0,
    sourceDuration: VIDEO_AUDIO_LINK_STRESS_VIDEO_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audioLinked: true,
  }

  const duckingClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: bgmAsset.id,
    startTime: 0,
    duration: 20,
    sourceStart: 0,
    sourceDuration: 20,
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    ducking: { ...DEFAULT_DUCKING, enabled: true },
  }

  videoTrack.clips = [videoClip]
  audioTrack.clips = [duckingClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス動画音声リンク検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [videoAsset, bgmAsset],
    markers: [],
    tracks: [
      videoTrack,
      audioTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    ],
  })
}

export function getVideoAudioLinkStressStats(project: Project): VideoAudioLinkStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const audioTrack = project.tracks.find((t) => t.type === 'audio')
  const videoClip = videoTrack?.clips.find((c) => c.type === 'video')
  const duckingClip = audioTrack?.clips.find((c) => c.type === 'audio')

  if (!videoClip || videoClip.type !== 'video' || !audioTrack || !duckingClip || duckingClip.type !== 'audio') {
    throw new Error('video audio link stress: clips missing')
  }

  return {
    videoClipId: videoClip.id,
    audioTrackId: audioTrack.id,
    duckingClipId: duckingClip.id,
    narrationStartTime: videoClip.startTime,
    duckingIntervalCountBefore: getDuckingIntervals(project).length,
  }
}

export function seedVideoAudioLinkStress(): VideoAudioLinkStressStats {
  const project = createVideoAudioLinkStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getVideoAudioLinkStressStats(project)
  useProjectStore.getState().setSelectedClipId(stats.videoClipId)
  return stats
}

export function isClipAudioLinked(clipId: string): boolean {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || clip.type !== 'video') return false
  return isVideoAudioLinked(clip)
}

export function detachVideoAudioById(clipId: string): boolean {
  return useProjectStore.getState().detachVideoAudio(clipId)
}

export function linkVideoAudioById(clipId: string): boolean {
  return useProjectStore.getState().linkVideoAudio(clipId)
}

export function getDuckingIntervalCount(): number {
  return getDuckingIntervals(useProjectStore.getState().project).length
}

export function getAudibleVideoAudioClipCount(): number {
  return getAudioClipsFromProject(useProjectStore.getState().project).filter((item) => item.isVideo).length
}

export function prepareNarrationForVideoClipById(clipId: string) {
  return useProjectStore.getState().prepareNarrationForVideoClip(clipId)
}
