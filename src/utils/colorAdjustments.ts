import type { AdjustmentClip, Clip, ColorAdjustments, Project } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'

export function isAdjustmentClip(clip: Clip): clip is AdjustmentClip {
  return clip.type === 'adjustment'
}

export function mergeColorAdjustments(base: ColorAdjustments, overlay: ColorAdjustments): ColorAdjustments {
  return {
    brightness: base.brightness + overlay.brightness,
    contrast: base.contrast + overlay.contrast,
    saturation: base.saturation + overlay.saturation,
  }
}

export function isNeutralColorAdjustments(color: ColorAdjustments): boolean {
  return color.brightness === 0 && color.contrast === 0 && color.saturation === 0
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
