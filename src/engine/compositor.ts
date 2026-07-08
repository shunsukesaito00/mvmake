import type {
  Clip,
  ColorAdjustments,
  CropSettings,
  ImageClip,
  MediaAsset,
  Project,
  TextClip,
  VideoClip,
} from '../types/project'
import { getTextLineHeight, getTextLineYPositions, splitTextLines } from '../utils/textLayout'
import { getVisualFadeMultiplier } from '../utils/visualFade'

interface RenderLayer {
  clip: Clip
  opacity: number
  transitionProgress?: number
  transitionType?: string
}

const videoElements = new Map<string, HTMLVideoElement>()
const imageElements = new Map<string, HTMLImageElement>()

// ストアはイミュータブル更新なので、配列の参照をキーに毎フレームの再計算を回避できる
const assetMapCache = new WeakMap<MediaAsset[], Map<string, MediaAsset>>()
const sortedVisualClipsCache = new WeakMap<Clip[], (VideoClip | ImageClip | TextClip)[]>()

function getAssetMap(project: Project): Map<string, MediaAsset> {
  let map = assetMapCache.get(project.mediaAssets)
  if (!map) {
    map = new Map(project.mediaAssets.map((a) => [a.id, a]))
    assetMapCache.set(project.mediaAssets, map)
  }
  return map
}

function getSortedVisualClips(clips: Clip[]): (VideoClip | ImageClip | TextClip)[] {
  let sorted = sortedVisualClipsCache.get(clips)
  if (!sorted) {
    sorted = clips.filter(isVisualClip).sort((a, b) => a.startTime - b.startTime)
    sortedVisualClipsCache.set(clips, sorted)
  }
  return sorted
}

function getVideoElement(asset: MediaAsset): HTMLVideoElement {
  let el = videoElements.get(asset.id)
  if (!el) {
    el = document.createElement('video')
    el.crossOrigin = 'anonymous'
    el.muted = true
    el.preload = 'auto'
    el.src = asset.url
    videoElements.set(asset.id, el)
  }
  return el
}

function getImageElement(asset: MediaAsset): HTMLImageElement {
  let el = imageElements.get(asset.id)
  if (!el) {
    el = new Image()
    el.crossOrigin = 'anonymous'
    el.src = asset.url
    imageElements.set(asset.id, el)
  }
  return el
}

function isVisualClip(clip: Clip): clip is VideoClip | ImageClip | TextClip {
  return clip.type === 'video' || clip.type === 'image' || clip.type === 'text'
}

function getVideoSourceTime(clip: VideoClip, localTime: number): number {
  return clip.sourceStart + localTime * (clip.speed ?? 1)
}

const colorFilterCache = new WeakMap<ColorAdjustments, string>()

function applyColorFilter(ctx: CanvasRenderingContext2D, color: ColorAdjustments) {
  // 補正なしならフィルタ設定自体をスキップ(filter代入はコストが高い)
  if (color.brightness === 0 && color.contrast === 0 && color.saturation === 0) return

  let filter = colorFilterCache.get(color)
  if (!filter) {
    const b = 100 + color.brightness * 50
    const c = 100 + color.contrast * 50
    const s = 100 + color.saturation * 100
    filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`
    colorFilterCache.set(color, filter)
  }
  ctx.filter = filter
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** クリップ開始からのアニメーション進行度 (0〜1)。アニメ終了後は1 */
function getTextAnimProgress(clip: TextClip, time: number): number {
  const duration = Math.max(clip.animation.duration, 0.01)
  return Math.max(0, Math.min(1, (time - clip.startTime) / duration))
}

function getTextOpacity(clip: TextClip, time: number): number {
  let opacity = 1
  const localTime = time - clip.startTime
  const animType = clip.animation.type
  if ((animType === 'fadeIn' || animType === 'slideUp' || animType === 'scaleIn') && localTime < clip.animation.duration) {
    opacity *= localTime / clip.animation.duration
  }
  const remaining = clip.duration - localTime
  if (animType === 'fadeOut' && remaining < clip.animation.duration) {
    opacity *= remaining / clip.animation.duration
  }
  return opacity
}

function getTrackLayersAtTime(track: Project['tracks'][0], time: number): RenderLayer[] {
  if (track.muted && track.type !== 'text') return []

  const sorted = getSortedVisualClips(track.clips)
  const layers: RenderLayer[] = []

  for (let i = 0; i < sorted.length; i++) {
    const clip = sorted[i]
    const clipEnd = clip.startTime + clip.duration
    const isActive = time >= clip.startTime && time < clipEnd

    if ((clip.type === 'video' || clip.type === 'image') && clip.transition && i > 0) {
      const prev = sorted[i - 1]
      const transStart = clip.startTime
      const transEnd = clip.startTime + clip.transition.duration

      if (time >= transStart && time < transEnd) {
        const progress = (time - transStart) / clip.transition.duration
        const prevEnd = prev.startTime + prev.duration
        const prevVisible = time < prevEnd

        switch (clip.transition.type) {
          case 'crossfade': {
            if (prevVisible) layers.push({ clip: prev, opacity: (1 - progress) * prev.transform.opacity })
            layers.push({ clip, opacity: progress * clip.transform.opacity, transitionProgress: progress, transitionType: 'crossfade' })
            continue
          }
          case 'fadeBlack': {
            if (progress < 0.5 && prevVisible) layers.push({ clip: prev, opacity: (1 - progress * 2) * prev.transform.opacity })
            else if (progress >= 0.5) layers.push({ clip, opacity: (progress - 0.5) * 2 * clip.transform.opacity })
            continue
          }
          case 'fadeWhite': {
            if (progress < 0.5 && prevVisible) layers.push({ clip: prev, opacity: (1 - progress * 2) * prev.transform.opacity })
            else if (progress >= 0.5) layers.push({ clip, opacity: (progress - 0.5) * 2 * clip.transform.opacity, transitionProgress: progress, transitionType: 'fadeWhite' })
            continue
          }
          case 'wipe': {
            if (prevVisible) layers.push({ clip: prev, opacity: prev.transform.opacity })
            layers.push({ clip, opacity: clip.transform.opacity, transitionProgress: progress, transitionType: 'wipe' })
            continue
          }
          case 'slideLeft': {
            if (prevVisible) layers.push({ clip: prev, opacity: prev.transform.opacity })
            layers.push({ clip, opacity: clip.transform.opacity, transitionProgress: progress, transitionType: 'slideLeft' })
            continue
          }
          case 'slideRight': {
            if (prevVisible) layers.push({ clip: prev, opacity: prev.transform.opacity })
            layers.push({ clip, opacity: clip.transform.opacity, transitionProgress: progress, transitionType: 'slideRight' })
            continue
          }
          case 'zoom': {
            if (prevVisible) layers.push({ clip: prev, opacity: (1 - progress) * prev.transform.opacity })
            layers.push({ clip, opacity: clip.transform.opacity, transitionProgress: progress, transitionType: 'zoom' })
            continue
          }
        }
      }
    }

    if (isActive) {
      let opacity = clip.transform.opacity
      if (clip.type === 'text') {
        opacity *= getTextOpacity(clip, time)
      } else if (clip.type === 'video' || clip.type === 'image') {
        const localTime = time - clip.startTime
        opacity *= getVisualFadeMultiplier(localTime, clip.duration, clip.fadeIn, clip.fadeOut)
      }
      layers.push({ clip, opacity })
    }
  }

  return layers
}

function drawWithCrop(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  crop: CropSettings,
) {
  if (crop.enabled) {
    const sx = crop.x * sw
    const sy = crop.y * sh
    const sWidth = crop.width * sw
    const sHeight = crop.height * sh
    ctx.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dw, dh)
  } else {
    ctx.drawImage(source, dx, dy, dw, dh)
  }
}

function applyKenBurns(
  ctx: CanvasRenderingContext2D,
  clip: ImageClip,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  localProgress: number,
) {
  const kb = clip.kenBurns
  const scale = kb.enabled ? kb.startScale + (kb.endScale - kb.startScale) * localProgress : clip.transform.scale
  const cx = kb.enabled ? kb.startX + (kb.endX - kb.startX) * localProgress : clip.transform.x
  const cy = kb.enabled ? kb.startY + (kb.endY - kb.startY) * localProgress : clip.transform.y

  const imgAspect = img.width / img.height
  const canvasAspect = canvasW / canvasH
  let drawW: number
  let drawH: number
  if (imgAspect > canvasAspect) {
    drawH = canvasH * scale
    drawW = drawH * imgAspect
  } else {
    drawW = canvasW * scale
    drawH = drawW / imgAspect
  }

  const x = cx * canvasW - drawW / 2
  const y = cy * canvasH - drawH / 2
  drawWithCrop(ctx, img, img.width, img.height, x, y, drawW, drawH, clip.crop)
}

function drawWithTransform(
  ctx: CanvasRenderingContext2D,
  transform: { x: number; y: number; rotation: number; scale?: number },
  canvasW: number,
  canvasH: number,
  transitionType?: string,
  transitionProgress?: number,
  draw: () => void = () => {},
) {
  const cx = transform.x * canvasW
  const cy = transform.y * canvasH
  ctx.translate(cx, cy)

  if (transitionType === 'zoom' && transitionProgress !== undefined) {
    const s = 0.5 + transitionProgress * 0.5
    ctx.scale(s, s)
  }
  if (transitionType === 'slideLeft' && transitionProgress !== undefined) {
    ctx.translate(canvasW * (1 - transitionProgress), 0)
  }
  if (transitionType === 'slideRight' && transitionProgress !== undefined) {
    ctx.translate(-canvasW * (1 - transitionProgress), 0)
  }

  ctx.rotate((transform.rotation * Math.PI) / 180)
  ctx.translate(-cx, -cy)
  draw()
}

function drawMediaClip(
  ctx: CanvasRenderingContext2D,
  clip: VideoClip | ImageClip,
  asset: MediaAsset,
  time: number,
  canvasW: number,
  canvasH: number,
  opacity: number,
  transitionType?: string,
  transitionProgress?: number,
) {
  const localTime = time - clip.startTime
  const localProgress = clip.duration > 0 ? localTime / clip.duration : 0
  const color = clip.color

  ctx.save()
  ctx.globalAlpha = opacity
  applyColorFilter(ctx, color)

  drawWithTransform(ctx, clip.transform, canvasW, canvasH, transitionType, transitionProgress, () => {
    if (clip.type === 'video') {
      const video = getVideoElement(asset)
      const sourceTime = getVideoSourceTime(clip, localTime)
      if (Math.abs(video.currentTime - sourceTime) > 0.05) video.currentTime = sourceTime

      const scale = clip.transform.scale
      const vw = asset.width ?? video.videoWidth
      const vh = asset.height ?? video.videoHeight
      const imgAspect = vw / vh
      const canvasAspect = canvasW / canvasH
      let drawW: number
      let drawH: number
      if (imgAspect > canvasAspect) {
        drawH = canvasH * scale
        drawW = drawH * imgAspect
      } else {
        drawW = canvasW * scale
        drawH = drawW / imgAspect
      }
      const x = clip.transform.x * canvasW - drawW / 2
      const y = clip.transform.y * canvasH - drawH / 2

      if (video.readyState >= 2) {
        drawWithCrop(ctx, video, vw, vh, x, y, drawW, drawH, clip.crop)
      }
    } else {
      const img = getImageElement(asset)
      if (img.complete) applyKenBurns(ctx, clip, img, canvasW, canvasH, localProgress)
    }
  })

  ctx.restore()
}

const fontCache = new WeakMap<TextClip['text'], { canvasW: number; font: string }>()

function getFontString(text: TextClip['text'], fontSize: number, canvasW: number): string {
  let cached = fontCache.get(text)
  if (!cached || cached.canvasW !== canvasW) {
    cached = { canvasW, font: `bold ${fontSize}px "${text.fontFamily}", sans-serif` }
    fontCache.set(text, cached)
  }
  return cached.font
}

function drawTextClip(ctx: CanvasRenderingContext2D, clip: TextClip, canvasW: number, canvasH: number, opacity: number, time: number) {
  const { text, transform } = clip
  const animType = clip.animation.type
  const progress = getTextAnimProgress(clip, time)

  let content = text.content
  if (animType === 'typewriter') {
    const chars = Math.ceil(easeOutCubic(progress) * text.content.length)
    content = text.content.slice(0, chars)
    if (content.length === 0) return
  }

  const lines = splitTextLines(content)
  if (lines.every((line) => line.length === 0)) return

  ctx.save()
  ctx.globalAlpha = opacity

  drawWithTransform(ctx, transform, canvasW, canvasH, undefined, undefined, () => {
    const fontSize = text.fontSize * (canvasW / 1920)
    ctx.font = getFontString(text, fontSize, canvasW)
    ctx.textAlign = text.textAlign
    ctx.textBaseline = 'middle'
    const x = transform.x * canvasW
    let y = transform.y * canvasH

    if (animType === 'slideUp' && progress < 1) {
      y += (1 - easeOutCubic(progress)) * getTextLineHeight(fontSize, text.lineHeight)
    }
    if (animType === 'scaleIn' && progress < 1) {
      const scale = 0.5 + 0.5 * easeOutCubic(progress)
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.translate(-x, -y)
    }

    if (text.shadowBlur > 0) {
      ctx.shadowColor = text.shadowColor
      ctx.shadowBlur = text.shadowBlur * (canvasW / 1920)
    }

    const lineYs = getTextLineYPositions(lines.length, fontSize, y, {
      lineHeight: text.lineHeight,
      verticalAlign: text.verticalAlign,
    })
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      if (text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth * (canvasW / 1920)
        ctx.strokeText(line, x, lineYs[i])
      }
      ctx.fillStyle = text.color
      ctx.fillText(line, x, lineYs[i])
    }
  })

  ctx.restore()
}

export async function renderFrame(
  ctx: CanvasRenderingContext2D,
  project: Project,
  time: number,
  options?: { showSafeAreas?: boolean },
): Promise<void> {
  const { width, height } = project
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const assetMap = getAssetMap(project)
  const visualTracks = project.tracks.filter((t) => t.type === 'video' || t.type === 'text')

  for (const track of visualTracks) {
    const layers = getTrackLayersAtTime(track, time)
    for (const layer of layers) {
      const { clip, opacity, transitionType, transitionProgress } = layer
      if (clip.type === 'video' || clip.type === 'image') {
        const asset = assetMap.get(clip.mediaId)
        if (asset) drawMediaClip(ctx, clip, asset, time, width, height, opacity, transitionType, transitionProgress)
      } else if (clip.type === 'text') {
        drawTextClip(ctx, clip, width, height, opacity, time)
      }

      if (transitionType === 'wipe' && transitionProgress !== undefined) {
        ctx.save()
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, width * (1 - transitionProgress), height)
        ctx.restore()
      }
      if (transitionType === 'fadeWhite' && transitionProgress !== undefined && transitionProgress < 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${transitionProgress * 2})`
        ctx.fillRect(0, 0, width, height)
      }
    }
  }

  if (options?.showSafeAreas) {
    ctx.save()
    ctx.strokeStyle = 'rgba(201,169,110,0.5)'
    ctx.lineWidth = 2
    const margin = 0.1
    ctx.strokeRect(width * margin, height * margin, width * (1 - margin * 2), height * (1 - margin * 2))
    ctx.setLineDash([8, 8])
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    const actionMargin = 0.05
    ctx.strokeRect(width * actionMargin, height * actionMargin, width * (1 - actionMargin * 2), height * (1 - actionMargin * 2))
    ctx.restore()
  }
}

export function preloadMedia(project: Project): void {
  for (const asset of project.mediaAssets) {
    if (asset.type === 'video') getVideoElement(asset)
    if (asset.type === 'image') getImageElement(asset)
  }
}

export function clearMediaCache(): void {
  for (const el of videoElements.values()) el.src = ''
  videoElements.clear()
  imageElements.clear()
}

export async function seekVideosToTime(project: Project, time: number): Promise<void> {
  const assetMap = getAssetMap(project)
  const promises: Promise<void>[] = []

  for (const track of project.tracks) {
    if (track.muted) continue
    for (const clip of track.clips) {
      if (clip.type !== 'video') continue
      if (time < clip.startTime || time >= clip.startTime + clip.duration) continue
      const asset = assetMap.get(clip.mediaId)
      if (!asset) continue
      const video = getVideoElement(asset)
      const localTime = time - clip.startTime
      const sourceTime = getVideoSourceTime(clip, localTime)
      if (Math.abs(video.currentTime - sourceTime) > 0.03) {
        video.currentTime = sourceTime
        promises.push(
          new Promise((resolve) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked)
              resolve()
            }
            video.addEventListener('seeked', onSeeked)
          }),
        )
      }
    }
  }

  await Promise.all(promises)
}

export async function syncVideosForPlayback(project: Project, time: number, playing: boolean): Promise<void> {
  const assetMap = getAssetMap(project)

  for (const track of project.tracks) {
    if (track.muted) continue
    for (const clip of track.clips) {
      if (clip.type !== 'video') continue
      const asset = assetMap.get(clip.mediaId)
      if (!asset) continue
      const video = getVideoElement(asset)
      const inRange = time >= clip.startTime && time < clip.startTime + clip.duration
      const speed = clip.speed ?? 1

      if (inRange && playing) {
        const sourceTime = getVideoSourceTime(clip, time - clip.startTime)
        if (Math.abs(video.currentTime - sourceTime) > 0.15) video.currentTime = sourceTime
        video.playbackRate = speed
        if (video.paused) await video.play().catch(() => {})
      } else {
        if (!video.paused) video.pause()
      }
    }
  }
}
