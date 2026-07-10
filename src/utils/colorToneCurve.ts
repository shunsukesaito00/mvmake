import type { ColorAdjustments } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'

const TONE_AMPLITUDE = 72

function pixelLuminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export function shadowWeight(luma: number): number {
  const t = 1 - luma * 2
  return t <= 0 ? 0 : t * t
}

export function highlightWeight(luma: number): number {
  const t = luma * 2 - 1
  return t <= 0 ? 0 : t * t
}

export function midtoneWeight(luma: number): number {
  return Math.max(0, 1 - Math.abs(luma - 0.5) * 2)
}

export function isPixelToneCurveActive(color: ColorAdjustments): boolean {
  return (
    Math.abs(color.shadows ?? 0) > 0.001
    || Math.abs(color.midtones ?? 0) > 0.001
    || Math.abs(color.highlights ?? 0) > 0.001
  )
}

export function applyToneCurveToImageData(
  imageData: ImageData,
  shadows: number,
  midtones: number,
  highlights: number,
): void {
  const s = Math.max(-1, Math.min(1, shadows))
  const m = Math.max(-1, Math.min(1, midtones))
  const h = Math.max(-1, Math.min(1, highlights))
  if (Math.abs(s) < 0.001 && Math.abs(m) < 0.001 && Math.abs(h) < 0.001) return

  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const luma = pixelLuminance(r, g, b)
    const delta = (
      s * shadowWeight(luma)
      + m * midtoneWeight(luma)
      + h * highlightWeight(luma)
    ) * TONE_AMPLITUDE

    data[i] = Math.max(0, Math.min(255, Math.round(r + delta)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g + delta)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b + delta)))
  }
}

export function applyPixelToneCurveAdjustments(imageData: ImageData, color: ColorAdjustments): void {
  applyToneCurveToImageData(
    imageData,
    color.shadows ?? DEFAULT_COLOR.shadows,
    color.midtones ?? DEFAULT_COLOR.midtones,
    color.highlights ?? DEFAULT_COLOR.highlights,
  )
}
