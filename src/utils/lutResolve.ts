import type { AdjustmentClip, Clip, ImageClip, LutAsset, Project, VideoClip } from '../types/project'
import { isAdjustmentClip } from './colorAdjustments'

export interface ResolvedLut {
  lutId: string
  intensity: number
}

export interface ClipLutFields {
  lutId?: string
  lutIntensity?: number
}

export function hasClipLutFields(clip: Clip): clip is (VideoClip | ImageClip | AdjustmentClip) & ClipLutFields {
  return clip.type === 'video' || clip.type === 'image' || clip.type === 'adjustment'
}

export function getLutIntensity(clip: ClipLutFields): number {
  if (clip.lutIntensity == null) return 1
  return Math.max(0, Math.min(1, clip.lutIntensity))
}

/** 指定ビジュアルトラックより上にある調整レイヤーの LUT（最上位を採用） */
export function getAdjustmentLutForVisualTrack(
  project: Project,
  visualTrackIndex: number,
  time: number,
): ResolvedLut | null {
  const visualTracks = project.tracks.filter((t) => t.type === 'video' || t.type === 'text')
  let resolved: ResolvedLut | null = null

  for (let i = visualTracks.length - 1; i > visualTrackIndex; i--) {
    const track = visualTracks[i]
    if (track.muted) continue
    for (const clip of track.clips) {
      if (!isAdjustmentClip(clip)) continue
      const end = clip.startTime + clip.duration
      if (time >= clip.startTime && time < end && clip.lutId) {
        return { lutId: clip.lutId, intensity: getLutIntensity(clip) }
      }
    }
  }

  return resolved
}

export function resolveClipLut(
  clip: VideoClip | ImageClip,
  adjustmentLut: ResolvedLut | null,
): ResolvedLut | null {
  if (clip.lutId) {
    return { lutId: clip.lutId, intensity: getLutIntensity(clip) }
  }
  return adjustmentLut
}

export function findLutAsset(lutAssets: LutAsset[], lutId: string | undefined): LutAsset | undefined {
  if (!lutId) return undefined
  return lutAssets.find((a) => a.id === lutId)
}
