import type {
  Clip,
  ColorAdjustments,
  CropSettings,
  ImageClip,
  MediaAsset,
  Project,
  TextClip,
  Transform,
  VideoClip,
} from '../types/project'
import { getTextLineHeight, getTextLineYPositions, splitTextLines } from '../utils/textLayout'
import { computeTextAnimationState, easeOutCubic, getTextAnimProgress, getTextOpacity } from '../utils/textAnimation'
import { wrapTextLinesToCanvasWidth } from '../utils/textWrap'
import { drawTextBackground } from '../utils/textBackground'
import { getMediaVisualOpacityAtTime } from '../utils/visualFade'
import { buildCanvasFontString } from '../utils/googleFonts'
import { getTransformAtLocalTime } from '../utils/transformKeyframes'
import { getVideoSourceTimeAtLocalTime, getSpeedAtLocalTime } from '../utils/speedKeyframes'
import { getAdjustmentColorForVisualTrack, mergeClipColorWithAdjustment } from '../utils/colorAdjustments'
import { buildColorFilterCss } from '../utils/colorFilter'
import { applyLutToImageData, getParsedLutById } from '../utils/cubeLut'
import { applyPixelColorGradeAdjustments, isPixelColorGradeActive } from '../utils/colorPixelGrade'
import { getAdjustmentLutForVisualTrack, resolveClipLut } from '../utils/lutResolve'
import type { ResolvedLut } from '../utils/lutResolve'
import { easeSmoothstep } from '../utils/transitions'

type VisualTransformClip = VideoClip | ImageClip | TextClip

function resolveClipTransform(clip: VisualTransformClip, localTime: number): Transform {
  return getTransformAtLocalTime(clip.transform, clip.transformKeyframes, localTime, clip.duration)
}

function getClipOpacityAtTime(clip: VisualTransformClip, time: number): number {
  const localTime = time - clip.startTime
  return resolveClipTransform(clip, localTime).opacity
}

function getLayerOpacityAtTime(clip: VisualTransformClip, time: number): number {
  if (clip.type === 'video' || clip.type === 'image') {
    return getMediaVisualOpacityAtTime(clip, time)
  }
  return getClipOpacityAtTime(clip, time)
}

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
  return getVideoSourceTimeAtLocalTime(clip, localTime)
}

const colorFilterCache = new WeakMap<ColorAdjustments, string>()

const tempCanvasCache = new Map<string, HTMLCanvasElement>()

function getTempCanvas(width: number, height: number): HTMLCanvasElement {
  const w = Math.max(1, Math.ceil(width))
  const h = Math.max(1, Math.ceil(height))
  const key = `${w}x${h}`
  let canvas = tempCanvasCache.get(key)
  if (!canvas) {
    canvas = document.createElement('canvas')
    tempCanvasCache.set(key, canvas)
  }
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  return canvas
}

function buildCanvasFilter(color: ColorAdjustments, blurPx?: number): string {
  const parts: string[] = []
  const colorFilter = buildColorFilterCss(color)
  if (colorFilter) parts.push(colorFilter)
  if (blurPx != null && blurPx > 0.1) parts.push(`blur(${blurPx}px)`)
  return parts.length > 0 ? parts.join(' ') : 'none'
}

function applyColorFilter(ctx: CanvasRenderingContext2D, color: ColorAdjustments, blurPx?: number) {
  const filter = buildCanvasFilter(color, blurPx)
  if (filter === 'none') {
    ctx.filter = 'none'
    return
  }

  if (blurPx == null) {
    let cached = colorFilterCache.get(color)
    if (!cached) {
      cached = filter
      colorFilterCache.set(color, cached)
    }
    ctx.filter = cached
    return
  }

  ctx.filter = filter
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
            if (prevVisible) layers.push({ clip: prev, opacity: (1 - progress) * getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: progress * getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'crossfade' })
            continue
          }
          case 'dissolve': {
            const eased = easeSmoothstep(progress)
            if (prevVisible) layers.push({ clip: prev, opacity: (1 - eased) * getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: eased * getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'dissolve' })
            continue
          }
          case 'blur': {
            if (prevVisible) layers.push({ clip: prev, opacity: (1 - progress) * getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: progress * getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'blur' })
            continue
          }
          case 'fadeBlack': {
            if (progress < 0.5 && prevVisible) layers.push({ clip: prev, opacity: (1 - progress * 2) * getLayerOpacityAtTime(prev, time) })
            else if (progress >= 0.5) layers.push({ clip, opacity: (progress - 0.5) * 2 * getLayerOpacityAtTime(clip, time) })
            continue
          }
          case 'fadeWhite': {
            if (progress < 0.5 && prevVisible) layers.push({ clip: prev, opacity: (1 - progress * 2) * getLayerOpacityAtTime(prev, time) })
            else if (progress >= 0.5) layers.push({ clip, opacity: (progress - 0.5) * 2 * getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'fadeWhite' })
            continue
          }
          case 'wipe': {
            if (prevVisible) layers.push({ clip: prev, opacity: getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'wipe' })
            continue
          }
          case 'slideLeft': {
            if (prevVisible) layers.push({ clip: prev, opacity: getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'slideLeft' })
            continue
          }
          case 'slideRight': {
            if (prevVisible) layers.push({ clip: prev, opacity: getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'slideRight' })
            continue
          }
          case 'slideUp': {
            if (prevVisible) layers.push({ clip: prev, opacity: getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'slideUp' })
            continue
          }
          case 'zoom': {
            if (prevVisible) layers.push({ clip: prev, opacity: (1 - progress) * getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'zoom' })
            continue
          }
          case 'iris': {
            if (prevVisible) layers.push({ clip: prev, opacity: getLayerOpacityAtTime(prev, time) })
            layers.push({ clip, opacity: getLayerOpacityAtTime(clip, time), transitionProgress: progress, transitionType: 'iris' })
            continue
          }
        }
      }
    }

    if (isActive) {
      let opacity = getLayerOpacityAtTime(clip, time)
      if (clip.type === 'text') {
        opacity *= getTextOpacity(clip, time)
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
  if (transitionType === 'slideUp' && transitionProgress !== undefined) {
    ctx.translate(0, canvasH * (1 - transitionProgress))
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
  effectiveColor: ColorAdjustments,
  resolvedLut: ResolvedLut | null,
  transitionType?: string,
  transitionProgress?: number,
) {
  const localTime = time - clip.startTime
  const localProgress = clip.duration > 0 ? localTime / clip.duration : 0
  const transform = clip.type === 'image' && clip.kenBurns.enabled
    ? clip.transform
    : resolveClipTransform(clip, localTime)

  const blurPx = transitionType === 'blur' && transitionProgress !== undefined
    ? (1 - transitionProgress) * 16
    : undefined

  const parsedLut = resolvedLut ? getParsedLutById(resolvedLut.lutId) : undefined

  ctx.save()
  ctx.globalAlpha = opacity

  drawWithTransform(ctx, transform, canvasW, canvasH, transitionType, transitionProgress, () => {
    let drawW = 0
    let drawH = 0
    let x = 0
    let y = 0
    let source: CanvasImageSource | null = null
    let sw = 0
    let sh = 0

    if (clip.type === 'video') {
      const video = getVideoElement(asset)
      const sourceTime = getVideoSourceTime(clip, localTime)
      if (Math.abs(video.currentTime - sourceTime) > 0.05) video.currentTime = sourceTime

      const scale = transform.scale
      const vw = asset.width ?? video.videoWidth
      const vh = asset.height ?? video.videoHeight
      const imgAspect = vw / vh
      const canvasAspect = canvasW / canvasH
      if (imgAspect > canvasAspect) {
        drawH = canvasH * scale
        drawW = drawH * imgAspect
      } else {
        drawW = canvasW * scale
        drawH = drawW / imgAspect
      }
      x = transform.x * canvasW - drawW / 2
      y = transform.y * canvasH - drawH / 2

      if (video.readyState >= 2) {
        source = video
        sw = vw
        sh = vh
      }
    } else {
      const img = getImageElement(asset)
      if (img.complete) {
        const kb = clip.kenBurns
        const resolved = kb.enabled ? clip.transform : resolveClipTransform(clip, localTime)
        const scale = kb.enabled ? kb.startScale + (kb.endScale - kb.startScale) * localProgress : resolved.scale
        const cx = kb.enabled ? kb.startX + (kb.endX - kb.startX) * localProgress : resolved.x
        const cy = kb.enabled ? kb.startY + (kb.endY - kb.startY) * localProgress : resolved.y

        const imgAspect = img.width / img.height
        const canvasAspect = canvasW / canvasH
        if (imgAspect > canvasAspect) {
          drawH = canvasH * scale
          drawW = drawH * imgAspect
        } else {
          drawW = canvasW * scale
          drawH = drawW / imgAspect
        }
        x = cx * canvasW - drawW / 2
        y = cy * canvasH - drawH / 2
        source = img
        sw = img.width
        sh = img.height
      }
    }

    if (!source || drawW <= 0 || drawH <= 0) return

    const needsPixelGrade = (parsedLut && resolvedLut) || isPixelColorGradeActive(effectiveColor)
    if (needsPixelGrade) {
      const temp = getTempCanvas(drawW, drawH)
      const tctx = temp.getContext('2d', { willReadFrequently: true })
      if (!tctx) return
      tctx.setTransform(1, 0, 0, 1, 0, 0)
      tctx.clearRect(0, 0, temp.width, temp.height)
      drawWithCrop(tctx, source, sw, sh, 0, 0, temp.width, temp.height, clip.crop)
      const imageData = tctx.getImageData(0, 0, temp.width, temp.height)
      if (parsedLut && resolvedLut) {
        applyLutToImageData(imageData, parsedLut, resolvedLut.intensity)
      }
      if (isPixelColorGradeActive(effectiveColor)) {
        applyPixelColorGradeAdjustments(imageData, effectiveColor)
      }
      tctx.putImageData(imageData, 0, 0)
      applyColorFilter(ctx, effectiveColor, blurPx)
      ctx.drawImage(temp, x, y, drawW, drawH)
      return
    }

    applyColorFilter(ctx, effectiveColor, blurPx)
    drawWithCrop(ctx, source, sw, sh, x, y, drawW, drawH, clip.crop)
  })

  ctx.restore()
}

const fontCache = new WeakMap<TextClip['text'], { canvasW: number; fontFamily: string; fontSize: number; font: string }>()

function getFontString(text: TextClip['text'], fontSize: number, canvasW: number): string {
  let cached = fontCache.get(text)
  if (!cached || cached.canvasW !== canvasW || cached.fontFamily !== text.fontFamily || cached.fontSize !== fontSize) {
    cached = {
      canvasW,
      fontFamily: text.fontFamily,
      fontSize,
      font: buildCanvasFontString(text.fontFamily, fontSize),
    }
    fontCache.set(text, cached)
  }
  return cached.font
}

function drawTextClip(
  ctx: CanvasRenderingContext2D,
  clip: TextClip,
  canvasW: number,
  canvasH: number,
  opacity: number,
  time: number,
  adjustmentColor: ColorAdjustments,
) {
  const { text } = clip
  const localTime = time - clip.startTime
  const transform = resolveClipTransform(clip, localTime)
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
  applyColorFilter(ctx, adjustmentColor)

  drawWithTransform(ctx, transform, canvasW, canvasH, undefined, undefined, () => {
    const fontSize = text.fontSize * (canvasW / 1920)
    ctx.font = getFontString(text, fontSize, canvasW)
    const maxTextWidth = canvasW * 0.88
    const wrappedLines = wrapTextLinesToCanvasWidth(ctx, lines, maxTextWidth)
    ctx.textAlign = text.textAlign
    ctx.textBaseline = 'middle'
    const lineHeightPx = getTextLineHeight(fontSize, text.lineHeight)
    const animState = computeTextAnimationState(clip, time, canvasW, lineHeightPx)
    const x = transform.x * canvasW + animState.offsetX
    let y = transform.y * canvasH + animState.offsetY

    if (animState.scale !== 1) {
      ctx.translate(x, y)
      ctx.scale(animState.scale, animState.scale)
      ctx.translate(-x, -y)
    }

    if (text.shadowBlur > 0) {
      ctx.shadowColor = text.shadowColor
      ctx.shadowBlur = text.shadowBlur * (canvasW / 1920)
    }

    const lineYs = getTextLineYPositions(wrappedLines.length, fontSize, y, {
      lineHeight: text.lineHeight,
      verticalAlign: text.verticalAlign,
    })

    drawTextBackground(ctx, text, wrappedLines, lineYs, x, fontSize, canvasW)

    for (let i = 0; i < wrappedLines.length; i++) {
      const line = wrappedLines[i]
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

  for (let visualTrackIndex = 0; visualTrackIndex < visualTracks.length; visualTrackIndex++) {
    const track = visualTracks[visualTrackIndex]
    const adjustmentColor = getAdjustmentColorForVisualTrack(project, visualTrackIndex, time)
    const adjustmentLut = getAdjustmentLutForVisualTrack(project, visualTrackIndex, time)
    const layers = getTrackLayersAtTime(track, time)
    for (const layer of layers) {
      const { clip, opacity, transitionType, transitionProgress } = layer
      if (clip.type === 'video' || clip.type === 'image') {
        const asset = assetMap.get(clip.mediaId)
        if (asset) {
          const effectiveColor = mergeClipColorWithAdjustment(clip.color, adjustmentColor)
          const resolvedLut = resolveClipLut(clip, adjustmentLut)
          drawMediaClip(ctx, clip, asset, time, width, height, opacity, effectiveColor, resolvedLut, transitionType, transitionProgress)
        }
      } else if (clip.type === 'text') {
        drawTextClip(ctx, clip, width, height, opacity, time, adjustmentColor)
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
      if (transitionType === 'iris' && transitionProgress !== undefined) {
        ctx.save()
        ctx.globalCompositeOperation = 'destination-in'
        const radius = Math.max(width, height) * 0.55 * transitionProgress
        ctx.beginPath()
        ctx.arc(width * 0.5, height * 0.5, Math.max(radius, 1), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
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
  tempCanvasCache.clear()
}

export { preloadProjectLuts } from '../utils/cubeLut'

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
      const speed = getSpeedAtLocalTime(clip, time - clip.startTime)

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
