import type { ImageClip, MediaAsset, Project, Track, TransformKeyframe } from '../types/project'
import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { defaultBezierHandleIn, defaultBezierHandleOut } from './transformKeyframeBezier'
import { getTransformAtLocalTime } from './transformKeyframes'
import { splitTransformKeyframes } from './transformKeyframesTimeline'
import { createId } from './id'
import { useProjectStore } from '../store/projectStore'

/** ストレス検証用トランスフォームキーフレーム数 */
export const TRANSFORM_KEYFRAME_STRESS_COUNT = 8

export const TRANSFORM_KEYFRAME_STRESS_DURATION = 10

export const TRANSFORM_KEYFRAME_STRESS_SPLIT_AT = 5

const STRESS_KEYFRAME_TIMES = [0, 1.5, 3, 4.5, 6, 7, 8.5, 9.5]

export interface TransformKeyframeStressStats {
  clipId: string
  clipName: string
  keyframeCount: number
  clipDuration: number
  splitAt: number
  midLocalTime: number
  expectedMidX: number
  expectedMidOpacity: number
}

function buildStressTransformKeyframes(): TransformKeyframe[] {
  return STRESS_KEYFRAME_TIMES.map((time, index) => {
    const easing = index % 4 === 3 ? 'easeOut' as const : 'linear' as const
    const keyframe: TransformKeyframe = {
      id: createId(),
      time,
      x: 0.2 + (index / (STRESS_KEYFRAME_TIMES.length - 1)) * 0.6,
      y: 0.3 + (index % 3) * 0.12,
      scale: 0.8 + index * 0.12,
      rotation: index * 18,
      opacity: 1 - (index / (STRESS_KEYFRAME_TIMES.length - 1)) * 0.55,
      easing,
    }

    if (index === 2) {
      keyframe.easing = 'bezier'
      keyframe.bezierHandles = {
        opacity: { handleOut: defaultBezierHandleOut(1.5) },
      }
    }
    if (index === 3) {
      keyframe.easing = 'bezier'
      keyframe.bezierHandles = {
        opacity: { handleIn: defaultBezierHandleIn(1.5) },
      }
    }

    return keyframe
  })
}

function createStressImageAsset(): MediaAsset {
  const blob = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' })
  return {
    id: createId(),
    name: 'stress-transform-kf.png',
    type: 'image',
    blob,
    url: URL.createObjectURL(blob),
    duration: TRANSFORM_KEYFRAME_STRESS_DURATION,
  }
}

export function createTransformKeyframeStressProject(): Project {
  const asset = createStressImageAsset()
  const keyframes = buildStressTransformKeyframes()

  const videoTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }

  const clip: ImageClip = {
    id: createId(),
    trackId: videoTrack.id,
    type: 'image',
    mediaId: asset.id,
    startTime: 0,
    duration: TRANSFORM_KEYFRAME_STRESS_DURATION,
    sourceStart: 0,
    sourceDuration: TRANSFORM_KEYFRAME_STRESS_DURATION,
    transform: { ...DEFAULT_TRANSFORM },
    transformKeyframes: keyframes,
    kenBurns: { enabled: false, startScale: 1, endScale: 1, startX: 0.5, startY: 0.5, endX: 0.5, endY: 0.5 },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
  }

  videoTrack.clips = [clip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス変形KF検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [asset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  })
}

export function getTransformKeyframeStressStats(project: Project): TransformKeyframeStressStats {
  const clip = project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.type === 'image' && project.mediaAssets.find((a) => a.id === c.mediaId)?.name === 'stress-transform-kf.png')

  if (!clip || clip.type !== 'image') throw new Error('transform keyframe stress: clip missing')

  const midLocalTime = TRANSFORM_KEYFRAME_STRESS_SPLIT_AT
  const mid = getTransformAtLocalTime(clip.transform, clip.transformKeyframes, midLocalTime, clip.duration)

  return {
    clipId: clip.id,
    clipName: 'stress-transform-kf.png',
    keyframeCount: clip.transformKeyframes?.length ?? 0,
    clipDuration: clip.duration,
    splitAt: TRANSFORM_KEYFRAME_STRESS_SPLIT_AT,
    midLocalTime,
    expectedMidX: mid.x,
    expectedMidOpacity: mid.opacity,
  }
}

export function getTransformKeyframeSplitCounts(
  keyframes: TransformKeyframe[] | undefined,
  splitAt = TRANSFORM_KEYFRAME_STRESS_SPLIT_AT,
): { firstCount: number; secondCount: number } {
  const { first, second } = splitTransformKeyframes(keyframes, splitAt)
  return {
    firstCount: first?.length ?? 0,
    secondCount: second?.length ?? 0,
  }
}

export function seedTransformKeyframeStress(): TransformKeyframeStressStats {
  const project = createTransformKeyframeStressProject()
  useProjectStore.getState().loadProject(project)
  return getTransformKeyframeStressStats(project)
}
