import type { MediaAsset, Project, Track, TransformKeyframe, VideoClip, VolumeKeyframe } from '../types/project'
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

export const SLIP_SLIDE_STRESS_CLIP_COUNT = 3
export const SLIP_SLIDE_STRESS_PREV_DURATION = 4
export const SLIP_SLIDE_STRESS_SELECTED_DURATION = 2
export const SLIP_SLIDE_STRESS_NEXT_DURATION = 3
export const SLIP_SLIDE_STRESS_SOURCE_START = 2
export const SLIP_SLIDE_STRESS_SLIP_DELTA = 1
export const SLIP_SLIDE_STRESS_SLIDE_DELTA = 0.5
export const SLIP_SLIDE_STRESS_MEDIA_DURATION = 30

const TRANSFORM_KEYFRAME_SPECS: Array<{ time: number; x: number }> = [
  { time: 0.25, x: 0.35 },
  { time: 1.5, x: 0.65 },
]

const VOLUME_KEYFRAME_SPECS: Array<{ time: number; volume: number }> = [
  { time: 0, volume: 0.6 },
  { time: 1.75, volume: 1 },
]

function buildTransformKeyframes(specs: Array<{ time: number; x: number }>): TransformKeyframe[] {
  return specs.map((spec) => ({
    id: createId(),
    time: spec.time,
    x: spec.x,
    y: 0.5,
    scale: 1,
    rotation: 0,
    opacity: 1,
  }))
}

function buildVolumeKeyframes(specs: Array<{ time: number; volume: number }>): VolumeKeyframe[] {
  return specs.map((spec) => ({ id: createId(), time: spec.time, volume: spec.volume }))
}

function findVideoClip(project: Project, clipId: string): VideoClip | null {
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.id === clipId && clip.type === 'video') return clip
    }
  }
  return null
}

export interface SlipSlideStressStats {
  prevClipId: string
  selectedClipId: string
  nextClipId: string
  selectedClipName: string
  clipCount: number
  slipDelta: number
  slideDelta: number
  sourceStartBefore: number
  sourceStartAfterSlip: number
  selectedStartBefore: number
  selectedStartAfterSlide: number
  prevDurationAfterSlide: number
  transformKeyframeCount: number
  volumeKeyframeCount: number
  transformKeyframeTimes: number[]
  volumeKeyframeTimes: number[]
}

export function getClipSourceStart(clipId: string): number {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`slip slide stress: clip not found: ${clipId}`)
  return clip.sourceStart
}

export function getClipStartTime(clipId: string): number {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`slip slide stress: clip not found: ${clipId}`)
  return clip.startTime
}

export function getClipDuration(clipId: string): number {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`slip slide stress: clip not found: ${clipId}`)
  return clip.duration
}

export function getClipTransformKeyframeTimes(clipId: string): number[] {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`slip slide stress: clip not found: ${clipId}`)
  return clip.transformKeyframes?.map((kf) => kf.time) ?? []
}

export function getClipVolumeKeyframeTimes(clipId: string): number[] {
  const clip = findVideoClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`slip slide stress: clip not found: ${clipId}`)
  return clip.audio.volumeKeyframes?.map((kf) => kf.time) ?? []
}

export function slipClipById(clipId: string, delta: number): boolean {
  useProjectStore.getState().setSelectedClipId(clipId)
  return useProjectStore.getState().slipSelectedClip(delta)
}

export function slideClipById(clipId: string, delta: number): boolean {
  useProjectStore.getState().setSelectedClipId(clipId)
  return useProjectStore.getState().slideSelectedClip(delta)
}

export function createSlipSlideStressProject(): Project {
  const videoAsset: MediaAsset = {
    id: createId(),
    name: 'stress-slip-slide-video.mp4',
    type: 'video',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: SLIP_SLIDE_STRESS_MEDIA_DURATION,
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
    duration: SLIP_SLIDE_STRESS_PREV_DURATION,
    sourceStart: 0,
    sourceDuration: SLIP_SLIDE_STRESS_PREV_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audio: { ...DEFAULT_AUDIO },
  }

  const selectedClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: SLIP_SLIDE_STRESS_PREV_DURATION,
    duration: SLIP_SLIDE_STRESS_SELECTED_DURATION,
    sourceStart: SLIP_SLIDE_STRESS_SOURCE_START,
    sourceDuration: SLIP_SLIDE_STRESS_SELECTED_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    transformKeyframes: buildTransformKeyframes(TRANSFORM_KEYFRAME_SPECS),
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audio: {
      ...DEFAULT_AUDIO,
      volumeKeyframes: buildVolumeKeyframes(VOLUME_KEYFRAME_SPECS),
    },
  }

  const nextClip: VideoClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'video',
    mediaId: videoAsset.id,
    startTime: SLIP_SLIDE_STRESS_PREV_DURATION + SLIP_SLIDE_STRESS_SELECTED_DURATION,
    duration: SLIP_SLIDE_STRESS_NEXT_DURATION,
    sourceStart: 0,
    sourceDuration: SLIP_SLIDE_STRESS_NEXT_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    audio: { ...DEFAULT_AUDIO },
  }

  videoTrack.clips = [prevClip, selectedClip, nextClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレススリップ/スライド検証',
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

export function getSlipSlideStressStats(project: Project): SlipSlideStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const clips = [...(videoTrack?.clips ?? [])].sort((a, b) => a.startTime - b.startTime)
  const prev = clips[0]
  const selected = clips[1]
  const next = clips[2]

  if (!prev || prev.type !== 'video' || !selected || selected.type !== 'video' || !next || next.type !== 'video') {
    throw new Error('slip slide stress: clips missing')
  }

  const transformKeyframeTimes = selected.transformKeyframes?.map((kf) => kf.time) ?? []
  const volumeKeyframeTimes = selected.audio.volumeKeyframes?.map((kf) => kf.time) ?? []

  return {
    prevClipId: prev.id,
    selectedClipId: selected.id,
    nextClipId: next.id,
    selectedClipName: project.mediaAssets.find((a) => a.id === selected.mediaId)?.name ?? 'stress-slip-slide-video.mp4',
    clipCount: clips.length,
    slipDelta: SLIP_SLIDE_STRESS_SLIP_DELTA,
    slideDelta: SLIP_SLIDE_STRESS_SLIDE_DELTA,
    sourceStartBefore: selected.sourceStart,
    sourceStartAfterSlip: selected.sourceStart + SLIP_SLIDE_STRESS_SLIP_DELTA,
    selectedStartBefore: selected.startTime,
    selectedStartAfterSlide: selected.startTime + SLIP_SLIDE_STRESS_SLIDE_DELTA,
    prevDurationAfterSlide: prev.duration + SLIP_SLIDE_STRESS_SLIDE_DELTA,
    transformKeyframeCount: transformKeyframeTimes.length,
    volumeKeyframeCount: volumeKeyframeTimes.length,
    transformKeyframeTimes,
    volumeKeyframeTimes,
  }
}

export function seedSlipSlideStress(): SlipSlideStressStats {
  const project = createSlipSlideStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getSlipSlideStressStats(project)

  if (stats.clipCount !== SLIP_SLIDE_STRESS_CLIP_COUNT) {
    throw new Error(`expected ${SLIP_SLIDE_STRESS_CLIP_COUNT} clips`)
  }
  if (stats.transformKeyframeCount < 2 || stats.volumeKeyframeCount < 2) {
    throw new Error('slip slide stress: keyframes missing on selected clip')
  }

  return stats
}
