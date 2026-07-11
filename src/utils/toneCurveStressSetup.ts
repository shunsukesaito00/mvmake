import type { ColorAdjustments, ImageClip, MediaAsset, Project, Track, VideoClip } from '../types/project'
import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeColorAdjustments,
  normalizeProject,
  type RgbCurveChannel,
} from '../types/project'
import { createId } from './id'
import { applyPixelColorGradeAdjustments } from './colorPixelGrade'
import { isPixelToneCurveActive } from './colorToneCurve'
import { isRgbCurvesActive, sampleRgbCurve, updateRgbCurvePoint } from './colorRgbCurve'
import { useProjectStore } from '../store/projectStore'

export const TONE_CURVE_STRESS_CLIP_COUNT = 1
export const TONE_CURVE_STRESS_MIDTONES = 0.2
export const TONE_CURVE_STRESS_SHADOWS = 0.15
export const TONE_CURVE_STRESS_RGB_R_MID = 0.65
export const TONE_CURVE_STRESS_RGB_POINT_INDEX = 2
export const TONE_CURVE_STRESS_PIXEL_GRAY = 128

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

export interface ToneCurveStressStats {
  clipId: string
  clipName: string
  clipCount: number
  shadows: number
  midtones: number
  rgbRMidOutput: number
  rgbSampleAtHalf: number
  pixelGrayR: number
  pixelGrayG: number
  pixelGrayB: number
  toneCurveActive: boolean
  rgbCurvesActive: boolean
}

export function buildStressColor(): ColorAdjustments {
  return normalizeColorAdjustments({
    ...DEFAULT_COLOR,
    shadows: TONE_CURVE_STRESS_SHADOWS,
    midtones: TONE_CURVE_STRESS_MIDTONES,
    rgbCurves: updateRgbCurvePoint(DEFAULT_COLOR.rgbCurves, 'r', TONE_CURVE_STRESS_RGB_POINT_INDEX, TONE_CURVE_STRESS_RGB_R_MID),
  })
}

export function samplePixelGrade(color: ColorAdjustments, gray = TONE_CURVE_STRESS_PIXEL_GRAY): { r: number; g: number; b: number } {
  const imageData = {
    data: new Uint8ClampedArray([gray, gray, gray, 255]),
    width: 1,
    height: 1,
    colorSpace: 'srgb',
  } as ImageData
  applyPixelColorGradeAdjustments(imageData, color)
  return {
    r: imageData.data[0],
    g: imageData.data[1],
    b: imageData.data[2],
  }
}

export function getClipColor(clipId: string): ColorAdjustments {
  const clip = findVisualClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`tone curve stress: clip not found: ${clipId}`)
  return normalizeColorAdjustments(clip.color)
}

export function applyClipColor(
  clipId: string,
  patch: Partial<ColorAdjustments>,
  recordHistory = true,
): ColorAdjustments {
  const clip = findVisualClip(useProjectStore.getState().project, clipId)
  if (!clip) throw new Error(`tone curve stress: clip not found: ${clipId}`)
  const next = normalizeColorAdjustments({
    ...clip.color,
    ...patch,
    rgbCurves: patch.rgbCurves ?? clip.color.rgbCurves,
  })
  useProjectStore.getState().updateClip(clipId, { color: next }, recordHistory)
  return getClipColor(clipId)
}

export function applyClipRgbCurvePoint(
  clipId: string,
  channel: RgbCurveChannel,
  pointIndex: number,
  output: number,
  recordHistory = true,
): ColorAdjustments {
  const color = getClipColor(clipId)
  const rgbCurves = updateRgbCurvePoint(color.rgbCurves, channel, pointIndex, output)
  return applyClipColor(clipId, { rgbCurves }, recordHistory)
}

export function getClipPixelGradeSample(clipId: string, gray = TONE_CURVE_STRESS_PIXEL_GRAY): { r: number; g: number; b: number } {
  return samplePixelGrade(getClipColor(clipId), gray)
}

export function getRgbCurveSampleAt(clipId: string, channel: RgbCurveChannel, input: number): number {
  const color = getClipColor(clipId)
  return sampleRgbCurve(color.rgbCurves[channel], input)
}

export function createToneCurveStressProject(): Project {
  const imageAsset: MediaAsset = {
    id: createId(),
    name: 'stress-tone-curve.png',
    type: 'image',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: 5,
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
    duration: 5,
    sourceStart: 0,
    sourceDuration: 5,
    transform: { ...DEFAULT_TRANSFORM },
    color: buildStressColor(),
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
  }

  videoTrack.clips = [imageClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレストーンカーブ検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [imageAsset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  })
}

export function getToneCurveStressStats(project: Project): ToneCurveStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const clip = videoTrack?.clips.find((c) => c.type === 'image' || c.type === 'video')
  if (!clip || (clip.type !== 'image' && clip.type !== 'video')) {
    throw new Error('tone curve stress: clip missing')
  }

  const color = normalizeColorAdjustments(clip.color)
  const pixel = samplePixelGrade(color)
  const rgbSampleAtHalf = sampleRgbCurve(color.rgbCurves.r, 0.5)
  const rMid = color.rgbCurves.r[TONE_CURVE_STRESS_RGB_POINT_INDEX]

  return {
    clipId: clip.id,
    clipName: project.mediaAssets.find((a) => a.id === clip.mediaId)?.name ?? 'stress-tone-curve.png',
    clipCount: 1,
    shadows: color.shadows,
    midtones: color.midtones,
    rgbRMidOutput: rMid?.y ?? 0,
    rgbSampleAtHalf,
    pixelGrayR: pixel.r,
    pixelGrayG: pixel.g,
    pixelGrayB: pixel.b,
    toneCurveActive: isPixelToneCurveActive(color),
    rgbCurvesActive: isRgbCurvesActive(color.rgbCurves),
  }
}

export function seedToneCurveStress(): ToneCurveStressStats {
  const project = createToneCurveStressProject()
  useProjectStore.getState().loadProject(project)
  const stats = getToneCurveStressStats(project)

  if (stats.clipCount !== TONE_CURVE_STRESS_CLIP_COUNT) {
    throw new Error(`expected ${TONE_CURVE_STRESS_CLIP_COUNT} clip`)
  }
  if (!stats.toneCurveActive || !stats.rgbCurvesActive) {
    throw new Error('tone curve stress: tone or rgb curves inactive')
  }
  if (stats.pixelGrayR <= TONE_CURVE_STRESS_PIXEL_GRAY) {
    throw new Error('tone curve stress: pixel grade did not lift red channel')
  }

  return stats
}
