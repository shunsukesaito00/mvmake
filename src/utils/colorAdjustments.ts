import type { AdjustmentClip, Clip, ColorAdjustments, Project } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import { isRgbCurvesActive, mergeRgbCurves } from './colorRgbCurve'

export function isAdjustmentClip(clip: Clip): clip is AdjustmentClip {
  return clip.type === 'adjustment'
}

export function mergeColorAdjustments(base: ColorAdjustments, overlay: ColorAdjustments): ColorAdjustments {
  return {
    brightness: base.brightness + overlay.brightness,
    contrast: base.contrast + overlay.contrast,
    saturation: base.saturation + overlay.saturation,
    hue: base.hue + overlay.hue,
    temperature: base.temperature + overlay.temperature,
    tint: base.tint + overlay.tint,
    shadows: base.shadows + (overlay.shadows ?? 0),
    midtones: base.midtones + (overlay.midtones ?? 0),
    highlights: base.highlights + (overlay.highlights ?? 0),
    rgbCurves: mergeRgbCurves(base.rgbCurves, overlay.rgbCurves ?? base.rgbCurves),
  }
}

export function isNeutralColorAdjustments(color: ColorAdjustments): boolean {
  return (
    color.brightness === 0
    && color.contrast === 0
    && color.saturation === 0
    && (color.hue ?? 0) === 0
    && (color.temperature ?? 0) === 0
    && (color.tint ?? 0) === 0
    && (color.shadows ?? 0) === 0
    && (color.midtones ?? 0) === 0
    && (color.highlights ?? 0) === 0
    && !isRgbCurvesActive(color.rgbCurves)
  )
}

/** 指定ビジュアルトラックより上にある調整レイヤーの色調を合成 */
export function getAdjustmentColorForVisualTrack(
  project: Project,
  visualTrackIndex: number,
  time: number,
): ColorAdjustments {
  const visualTracks = project.tracks.filter((t) => t.type === 'video' || t.type === 'text')
  let merged = { ...DEFAULT_COLOR }

  for (let i = visualTrackIndex + 1; i < visualTracks.length; i++) {
    const track = visualTracks[i]
    if (track.muted) continue
    for (const clip of track.clips) {
      if (!isAdjustmentClip(clip)) continue
      const end = clip.startTime + clip.duration
      if (time >= clip.startTime && time < end) {
        merged = mergeColorAdjustments(merged, clip.color)
      }
    }
  }

  return merged
}

export function mergeClipColorWithAdjustment(
  clipColor: ColorAdjustments,
  adjustment: ColorAdjustments,
): ColorAdjustments {
  if (isNeutralColorAdjustments(adjustment)) return clipColor
  return mergeColorAdjustments(clipColor, adjustment)
}
