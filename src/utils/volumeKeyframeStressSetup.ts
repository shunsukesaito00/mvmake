import type { AudioClip, MediaAsset, Project, Track, VideoClip, VolumeKeyframe } from '../types/project'
import {
  DEFAULT_AUDIO,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { createId } from './id'
import { getVolumeAtLocalTime, scheduleVolumeAutomation } from './volumeKeyframes'
import { splitVolumeKeyframes, updateVolumeKeyframeList } from './volumeKeyframesTimeline'
import { useProjectStore } from '../store/projectStore'

export const VOLUME_KEYFRAME_STRESS_CLIP_COUNT = 2
export const VOLUME_KEYFRAME_STRESS_AUDIO_KF_COUNT = 4
export const VOLUME_KEYFRAME_STRESS_VIDEO_KF_COUNT = 2
export const VOLUME_KEYFRAME_CORE_DURATION = 6
export const VOLUME_KEYFRAME_CORE_SPLIT_AT = 3

const AUDIO_KEYFRAME_SPECS: Array<{ time: number; volume: number }> = [
  { time: 0, volume: 0.2 },
  { time: 1, volume: 0.4 },
  { time: 4.5, volume: 0.8 },
  { time: 6, volume: 0.3 },
]

const VIDEO_KEYFRAME_SPECS: Array<{ time: number; volume: number }> = [
  { time: 0, volume: 0.8 },
  { time: 3, volume: 0.4 },
]

export const VOLUME_KEYFRAME_CORE_AUDIO_MID_TIME = 0.5
export const VOLUME_KEYFRAME_CORE_VIDEO_MID_TIME = 1.5

type AutomationEvent = { type: 'set' | 'ramp'; time: number; value: number }

function buildKeyframes(specs: Array<{ time: number; volume: number }>): VolumeKeyframe[] {
  return specs.map((spec) => ({ id: createId(), time: spec.time, volume: spec.volume }))
}

function findAudioLikeClip(project: Project, clipId: string): AudioClip | VideoClip | null {
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.id === clipId && (clip.type === 'audio' || clip.type === 'video')) {
        return clip
      }
    }
  }
  return null
}

export interface VolumeKeyframeStressStats {
  audioClipId: string
  videoClipId: string
  audioClipName: string
  videoClipName: string
  audioKeyframeCount: number
  videoKeyframeCount: number
  clipCount: number
  splitAt: number
  audioMidLocalTime: number
  audioMidVolume: number
  videoMidLocalTime: number
  videoMidVolume: number
  automationEventCount: number
  firstAudioKeyframeId: string
}

function createMockGainParam(): GainNode['gain'] & { events: AutomationEvent[] } {
  const events: AutomationEvent[] = []
  const param = {
    value: 1,
    defaultValue: 1,
    events,
    setValueAtTime(value: number, time: number) {
      events.push({ type: 'set', time, value })
      param.value = value
    },
    linearRampToValueAtTime(value: number, time: number) {
      events.push({ type: 'ramp', time, value })
    },
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
    cancelAndHoldAtTime() {},
  }
  return param as GainNode['gain'] & { events: AutomationEvent[] }
}

export function countVolumeAutomationEvents(audio: AudioClip['audio'], clipDuration: number): number {
  const gain = createMockGainParam()
  scheduleVolumeAutomation(gain, 0, 0, clipDuration, clipDuration, audio)
  return gain.events.length
}

export function getVolumeAtClipLocalTime(clipId: string, localTime: number): number {
  const clip = findAudioLikeClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`volume keyframe stress: clip not found: ${clipId}`)
  return getVolumeAtLocalTime(clip.audio, localTime, clip.duration)
}

export function getClipVolumeKeyframeCountForStress(clipId: string): number {
  const clip = findAudioLikeClip(useProjectStore.getState().project, clipId)
  if (!clip) return 0
  return clip.audio.volumeKeyframes?.length ?? 0
}

export function updateClipVolumeKeyframe(
  clipId: string,
  keyframeId: string,
  patch: Partial<VolumeKeyframe>,
): void {
  const clip = findAudioLikeClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`volume keyframe stress: clip not found: ${clipId}`)
  const next = updateVolumeKeyframeList(clip.audio.volumeKeyframes ?? [], keyframeId, patch)
  useProjectStore.getState().updateClip(clipId, { audio: { ...clip.audio, volumeKeyframes: next } }, true)
}

export function getVolumeKeyframeSplitCounts(
  keyframes: VolumeKeyframe[] | undefined,
  splitAt = VOLUME_KEYFRAME_CORE_SPLIT_AT,
): { firstCount: number; secondCount: number } {
  const { first, second } = splitVolumeKeyframes(keyframes, splitAt)
  return {
    firstCount: first?.length ?? 0,
    secondCount: second?.length ?? 0,
  }
}

export function listAudioTrackVolumeKeyframeCounts(): Array<{ clipId: string; count: number }> {
  return useProjectStore.getState().project.tracks
    .filter((t) => t.type === 'audio')
    .flatMap((t) => t.clips)
    .filter((c): c is AudioClip => c.type === 'audio')
    .map((c) => ({ clipId: c.id, count: c.audio.volumeKeyframes?.length ?? 0 }))
}

export function listVolumeKeyframeClipCounts(): Array<{ clipId: string; count: number }> {
  return useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .filter((c): c is AudioClip | VideoClip => c.type === 'audio' || c.type === 'video')
    .map((c) => ({ clipId: c.id, count: c.audio.volumeKeyframes?.length ?? 0 }))
}

export function createVolumeKeyframeStressProject(): Project {
  const audioAsset: MediaAsset = {
    id: createId(),
    name: 'stress-vol-kf-bgm.wav',
    type: 'audio',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: VOLUME_KEYFRAME_CORE_DURATION,
  }

  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-vol-kf-video.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: VOLUME_KEYFRAME_CORE_DURATION,
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

  const audioClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: audioAsset.id,
    startTime: 0,
    duration: VOLUME_KEYFRAME_CORE_DURATION,
    sourceStart: 0,
    sourceDuration: VOLUME_KEYFRAME_CORE_DURATION,
    audio: {
      ...DEFAULT_AUDIO,
      volume: 1,
      volumeKeyframes: buildKeyframes(AUDIO_KEYFRAME_SPECS),
    },
  }

  const videoClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: 0,
    duration: VOLUME_KEYFRAME_CORE_DURATION,
    sourceStart: 0,
    sourceDuration: VOLUME_KEYFRAME_CORE_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audio: {
      ...DEFAULT_AUDIO,
      volume: 1,
      volumeKeyframes: buildKeyframes(VIDEO_KEYFRAME_SPECS),
    },
  }

  videoTrack.clips = [videoClip]
  audioTrack.clips = [audioClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス音量キーフレーム検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [audioAsset, videoAsset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      audioTrack,
    ],
  })
}

export function getVolumeKeyframeStressStats(project: Project): VolumeKeyframeStressStats {
  const audioTrack = project.tracks.find((t) => t.type === 'audio')
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const audioClip = audioTrack?.clips.find((c) => c.type === 'audio')
  const videoClip = videoTrack?.clips.find((c) => c.type === 'video')

  if (!audioClip || audioClip.type !== 'audio' || !videoClip || videoClip.type !== 'video') {
    throw new Error('volume keyframe stress: clips missing')
  }

  const audioMidLocalTime = VOLUME_KEYFRAME_CORE_AUDIO_MID_TIME
  const videoMidLocalTime = VOLUME_KEYFRAME_CORE_VIDEO_MID_TIME
  const audioKeyframes = audioClip.audio.volumeKeyframes ?? []

  return {
    audioClipId: audioClip.id,
    videoClipId: videoClip.id,
    audioClipName: project.mediaAssets.find((a) => a.id === audioClip.mediaId)?.name ?? 'stress-vol-kf-bgm.wav',
    videoClipName: project.mediaAssets.find((a) => a.id === videoClip.mediaId)?.name ?? 'stress-vol-kf-video.mp4',
    audioKeyframeCount: audioKeyframes.length,
    videoKeyframeCount: videoClip.audio.volumeKeyframes?.length ?? 0,
    clipCount: 2,
    splitAt: VOLUME_KEYFRAME_CORE_SPLIT_AT,
    audioMidLocalTime,
    audioMidVolume: getVolumeAtLocalTime(audioClip.audio, audioMidLocalTime, audioClip.duration),
    videoMidLocalTime,
    videoMidVolume: getVolumeAtLocalTime(videoClip.audio, videoMidLocalTime, videoClip.duration),
    automationEventCount: countVolumeAutomationEvents(audioClip.audio, audioClip.duration),
    firstAudioKeyframeId: audioKeyframes[0]?.id ?? '',
  }
}

export function seedVolumeKeyframeStress(): VolumeKeyframeStressStats {
  const project = createVolumeKeyframeStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getVolumeKeyframeStressStats(project)

  if (stats.audioKeyframeCount !== VOLUME_KEYFRAME_STRESS_AUDIO_KF_COUNT) {
    throw new Error(`expected ${VOLUME_KEYFRAME_STRESS_AUDIO_KF_COUNT} audio keyframes`)
  }
  if (stats.videoKeyframeCount !== VOLUME_KEYFRAME_STRESS_VIDEO_KF_COUNT) {
    throw new Error(`expected ${VOLUME_KEYFRAME_STRESS_VIDEO_KF_COUNT} video keyframes`)
  }
  if (stats.automationEventCount < 2) {
    throw new Error('volume keyframe stress: automation events missing')
  }

  return stats
}
