import type { AudioClip, MediaAsset, Project, Track, VideoClip, VolumeKeyframe } from '../types/project'
import { DEFAULT_AUDIO, normalizeProject } from '../types/project'
import { createId } from './id'
import { getVolumeAtLocalTime } from './volumeKeyframes'
import {
  splitVolumeKeyframes,
  updateVolumeKeyframeList,
  VOLUME_TIMELINE_LANE_HEIGHT,
  buildVolumeCurvePath,
} from './volumeKeyframesTimeline'
import { useProjectStore } from '../store/projectStore'

export const VOLUME_KEYFRAME_TIMELINE_STRESS_COUNT = 6
export const VOLUME_KEYFRAME_STRESS_DURATION = 8
export const VOLUME_KEYFRAME_STRESS_SPLIT_AT = 4
export const VOLUME_KEYFRAME_STRESS_MID_TIME = 2.25

const STRESS_KEYFRAME_SPECS: Array<{ time: number; volume: number }> = [
  { time: 0, volume: 0.2 },
  { time: 1.5, volume: 0.5 },
  { time: 3, volume: 1 },
  { time: 5, volume: 1.5 },
  { time: 6.5, volume: 0.8 },
  { time: 8, volume: 0.3 },
]

export interface VolumeKeyframeTimelineStressStats {
  clipId: string
  clipName: string
  keyframeCount: number
  clipDuration: number
  splitAt: number
  midLocalTime: number
  expectedMidVolume: number
  laneHeight: number
  hasCurvePath: boolean
  firstKeyframeId: string
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

function buildStressVolumeKeyframes(): VolumeKeyframe[] {
  return STRESS_KEYFRAME_SPECS.map((spec) => ({
    id: createId(),
    time: spec.time,
    volume: spec.volume,
  }))
}

export function createVolumeKeyframeTimelineStressProject(): Project {
  const asset: MediaAsset = {
    id: createId(),
    name: 'stress-volume-kf.wav',
    type: 'audio',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: VOLUME_KEYFRAME_STRESS_DURATION,
  }

  const audioTrack: Track = {
    id: createId(),
    name: 'BGM',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
  }

  const clip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: asset.id,
    startTime: 0,
    duration: VOLUME_KEYFRAME_STRESS_DURATION,
    sourceStart: 0,
    sourceDuration: VOLUME_KEYFRAME_STRESS_DURATION,
    audio: {
      ...DEFAULT_AUDIO,
      volume: 1,
      volumeKeyframes: buildStressVolumeKeyframes(),
    },
  }

  audioTrack.clips = [clip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス音量KFタイムライン検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [asset],
    markers: [],
    tracks: [
      { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      audioTrack,
    ],
  })
}

export function getVolumeKeyframeTimelineStressStats(project: Project): VolumeKeyframeTimelineStressStats {
  const audioTrack = project.tracks.find((t) => t.type === 'audio')
  const clip = audioTrack?.clips.find((c) => c.type === 'audio')
  if (!clip || clip.type !== 'audio') throw new Error('volume kf timeline stress: clip missing')

  const keyframes = clip.audio.volumeKeyframes ?? []
  const midLocalTime = VOLUME_KEYFRAME_STRESS_MID_TIME
  const expectedMidVolume = getVolumeAtLocalTime(clip.audio, midLocalTime, clip.duration)
  const curvePath = buildVolumeCurvePath(clip.audio, clip.duration, 200, VOLUME_TIMELINE_LANE_HEIGHT)

  return {
    clipId: clip.id,
    clipName: project.mediaAssets.find((a) => a.id === clip.mediaId)?.name ?? 'stress-volume-kf.wav',
    keyframeCount: keyframes.length,
    clipDuration: clip.duration,
    splitAt: VOLUME_KEYFRAME_STRESS_SPLIT_AT,
    midLocalTime,
    expectedMidVolume,
    laneHeight: VOLUME_TIMELINE_LANE_HEIGHT,
    hasCurvePath: curvePath.length > 0,
    firstKeyframeId: keyframes[0]?.id ?? '',
  }
}

export function getVolumeKeyframeSplitCounts(
  keyframes: VolumeKeyframe[] | undefined,
  splitAt = VOLUME_KEYFRAME_STRESS_SPLIT_AT,
): { firstCount: number; secondCount: number } {
  const { first, second } = splitVolumeKeyframes(keyframes, splitAt)
  return {
    firstCount: first?.length ?? 0,
    secondCount: second?.length ?? 0,
  }
}

export function getVolumeAtClipLocalTime(clipId: string, localTime: number): number {
  const clip = findAudioLikeClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`volume kf timeline stress: clip not found: ${clipId}`)
  return getVolumeAtLocalTime(clip.audio, localTime, clip.duration)
}

export function getClipVolumeKeyframeCount(clipId: string): number {
  const clip = findAudioLikeClip(useProjectStore.getState().project, clipId)
  if (!clip) return 0
  return clip.audio.volumeKeyframes?.length ?? 0
}

export function updateVolumeKeyframeById(
  clipId: string,
  keyframeId: string,
  patch: Partial<VolumeKeyframe>,
): void {
  const clip = findAudioLikeClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`volume kf timeline stress: clip not found: ${clipId}`)
  const next = updateVolumeKeyframeList(clip.audio.volumeKeyframes ?? [], keyframeId, patch)
  useProjectStore.getState().updateClip(clipId, { audio: { ...clip.audio, volumeKeyframes: next } }, true)
}

export function listAudioClipVolumeKeyframeCounts(): Array<{ clipId: string; count: number }> {
  return useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .filter((c): c is AudioClip | VideoClip => c.type === 'audio' || c.type === 'video')
    .map((c) => ({ clipId: c.id, count: c.audio.volumeKeyframes?.length ?? 0 }))
}

export function seedVolumeKeyframeTimelineStress(): VolumeKeyframeTimelineStressStats {
  const project = createVolumeKeyframeTimelineStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getVolumeKeyframeTimelineStressStats(project)

  if (stats.keyframeCount !== VOLUME_KEYFRAME_TIMELINE_STRESS_COUNT) {
    throw new Error(`expected ${VOLUME_KEYFRAME_TIMELINE_STRESS_COUNT} keyframes, got ${stats.keyframeCount}`)
  }
  if (!stats.hasCurvePath) {
    throw new Error('volume kf timeline stress: curve path missing')
  }

  return stats
}
