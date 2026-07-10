import type { ColorAdjustments } from '../types/project'
import { applyLutToImageData, type ParsedCubeLut } from './cubeLut'
import { buildColorFilterCss } from './colorFilter'
import {
  applyColorGradeToImageData,
  drawColorLookPreviewFallback,
  getColorLookPreviewOpacity,
  type ColorLookPreviewFade,
} from './colorLookPreview'

export const LUT_PREVIEW_MAX_WIDTH = 320

export const LUT_PREVIEW_FALLBACK_STYLE = {
  backgroundImage:
    'linear-gradient(135deg, #f5e6d3 0%, #d4a574 35%, #8b6f5c 70%, #3d2c29 100%)',
}

export interface LutPreviewRenderOptions {
  imageUrl?: string
  lut: ParsedCubeLut
  lutIntensity: number
  color: ColorAdjustments
  fade?: ColorLookPreviewFade
  maxWidth?: number
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load preview image'))
    img.src = url
  })
}

export function drawLutPreviewFallback(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  drawColorLookPreviewFallback(ctx, width, height)
}

export function applyGradedPixelsToImageData(
  imageData: ImageData,
  lut: ParsedCubeLut,
  lutIntensity: number,
  color: ColorAdjustments,
): void {
  applyLutToImageData(imageData, lut, lutIntensity)
  applyColorGradeToImageData(imageData, color)
}

export async function renderLutPreviewCanvas(
  canvas: HTMLCanvasElement,
  options: LutPreviewRenderOptions,
): Promise<void> {
  const maxWidth = options.maxWidth ?? LUT_PREVIEW_MAX_WIDTH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  let width: number
  let height: number

  if (options.imageUrl) {
    try {
      const img = await loadImage(options.imageUrl)
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
      drawLutPreviewFallback(ctx, width, height)
    }
  } else {
    width = maxWidth
    height = Math.round((maxWidth * 9) / 16)
    canvas.width = width
    canvas.height = height
    drawLutPreviewFallback(ctx, width, height)
  }

  const imageData = ctx.getImageData(0, 0, width, height)
  applyGradedPixelsToImageData(imageData, options.lut, options.lutIntensity, options.color)
  ctx.putImageData(imageData, 0, 0)

  const filter = buildColorFilterCss(options.color)
  canvas.style.filter = filter ?? ''
  canvas.style.opacity = String(getColorLookPreviewOpacity(options.fade))
}
