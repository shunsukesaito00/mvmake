import type { Clip, ColorAdjustments, MediaAsset, Project } from '../types/project'
import { buildColorFilterCss } from './colorFilter'
import { applyPixelColorGradeAdjustments, isPixelColorGradeActive } from './colorPixelGrade'
import { getVisualFadeMultiplier } from './visualFade'

export const COLOR_LOOK_PREVIEW_MAX_WIDTH = 320
export const COLOR_LOOK_SWATCH_MAX_WIDTH = 176

export const COLOR_LOOK_PREVIEW_FALLBACK_STYLE = {
  backgroundImage:
    'linear-gradient(135deg, #f5e6d3 0%, #d4a574 35%, #8b6f5c 70%, #3d2c29 100%)',
}

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

function loadPreviewImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load preview image'))
    img.src = url
  })
}

export function drawColorLookPreviewFallback(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f5e6d3')
  gradient.addColorStop(0.35, '#d4a574')
  gradient.addColorStop(0.7, '#8b6f5c')
  gradient.addColorStop(1, '#3d2c29')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function applyColorGradeToImageData(imageData: ImageData, color: ColorAdjustments): void {
  if (isPixelColorGradeActive(color)) {
    applyPixelColorGradeAdjustments(imageData, color)
  }
}

export interface ColorGradePreviewRenderOptions {
  imageUrl?: string
  color: ColorAdjustments
  fade?: ColorLookPreviewFade
  maxWidth?: number
}

/** compositor / LutPreview と同順: ピクセルグレード → CSS filter → opacity */
export async function renderColorGradePreviewCanvas(
  canvas: HTMLCanvasElement,
  options: ColorGradePreviewRenderOptions,
): Promise<void> {
  const maxWidth = options.maxWidth ?? COLOR_LOOK_PREVIEW_MAX_WIDTH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  let width: number
  let height: number

  if (options.imageUrl) {
    try {
      const img = await loadPreviewImage(options.imageUrl)
      const scale = Math.min(1, maxWidth / Math.max(1, img.naturalWidth))
      width = Math.max(1, Math.round(img.naturalWidth * scale))
      height = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
    } catch {
      width = maxWidth
      height = Math.round((maxWidth * 9) / 16)
      canvas.width = width
      canvas.height = height
      drawColorLookPreviewFallback(ctx, width, height)
    }
  } else {
    width = maxWidth
    height = Math.round((maxWidth * 9) / 16)
    canvas.width = width
    canvas.height = height
    drawColorLookPreviewFallback(ctx, width, height)
  }

  const imageData = ctx.getImageData(0, 0, width, height)
  applyColorGradeToImageData(imageData, options.color)
  ctx.putImageData(imageData, 0, 0)

  const filter = buildColorFilterCss(options.color)
  canvas.style.filter = filter ?? ''
  canvas.style.opacity = String(getColorLookPreviewOpacity(options.fade))
}
