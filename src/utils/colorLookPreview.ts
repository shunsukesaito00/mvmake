import type { Clip, ColorAdjustments, MediaAsset, Project } from '../types/project'
import { buildColorFilterCss } from './colorFilter'
import { getVisualFadeMultiplier } from './visualFade'

export function pickClipPreviewImageUrl(clip: Clip, assetMap: Map<string, MediaAsset>): string | undefined {
  if (clip.type !== 'video' && clip.type !== 'image') return undefined
  const asset = assetMap.get(clip.mediaId)
  return asset?.thumbnail ?? asset?.url
}

/** 選択クリップ or 再生ヘッド上の映像からルックプレビュー用画像 URL を解決 */
export function resolveColorLookPreviewUrl(
  project: Project,
  mediaAssets: MediaAsset[],
  selectedClipId: string | null,
  currentTime: number,
): string | undefined {
  const assetMap = new Map(mediaAssets.map((a) => [a.id, a]))
  const allClips = project.tracks.flatMap((t) => t.clips)
  const selected = selectedClipId ? allClips.find((c) => c.id === selectedClipId) : undefined

  if (selected) {
    const direct = pickClipPreviewImageUrl(selected, assetMap)
    if (direct) return direct
  }

  if (selected?.type === 'adjustment') {
    const visualTracks = project.tracks.filter((t) => t.type === 'video' || t.type === 'text')
    const adjustmentTrackIndex = visualTracks.findIndex((t) => t.clips.some((c) => c.id === selected.id))
    if (adjustmentTrackIndex >= 0) {
      const targetTracks = visualTracks.slice(0, adjustmentTrackIndex)
      for (const track of targetTracks) {
        for (const clip of track.clips) {
          if (clip.type !== 'video' && clip.type !== 'image') continue
          const end = clip.startTime + clip.duration
          if (currentTime >= clip.startTime && currentTime < end) {
            const url = pickClipPreviewImageUrl(clip, assetMap)
            if (url) return url
          }
        }
      }
    }
  }

  for (const track of project.tracks) {
    if (track.type !== 'video') continue
    for (const clip of track.clips) {
      if (clip.type !== 'video' && clip.type !== 'image') continue
      const end = clip.startTime + clip.duration
      if (currentTime >= clip.startTime && currentTime < end) {
        const url = pickClipPreviewImageUrl(clip, assetMap)
        if (url) return url
      }
    }
  }

  return undefined
}

export interface ColorLookPreviewFade {
  fadeIn: number
  fadeOut: number
  clipDuration: number
  localTime: number
}

export function getColorLookPreviewOpacity(fade?: ColorLookPreviewFade): number {
  if (!fade) return 1
  return getVisualFadeMultiplier(fade.localTime, fade.clipDuration, fade.fadeIn, fade.fadeOut)
}

export function buildColorLookPreviewStyle(
  color: ColorAdjustments,
  fade?: ColorLookPreviewFade,
): { filter?: string; opacity: number } {
  return {
    filter: buildColorFilterCss(color),
    opacity: getColorLookPreviewOpacity(fade),
  }
}
