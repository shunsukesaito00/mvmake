import type { ColorAdjustments } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'

export function isPixelHslActive(color: ColorAdjustments): boolean {
  return Math.abs(color.temperature) > 0.001 || Math.abs(color.tint) > 0.001
}

export function applyTemperatureTintToImageData(
  imageData: ImageData,
  temperature: number,
  tint: number,
): void {
  const temp = Math.max(-1, Math.min(1, temperature))
  const tintValue = Math.max(-1, Math.min(1, tint))
  if (Math.abs(temp) < 0.001 && Math.abs(tintValue) < 0.001) return

  const { data } = imageData
  const tempScale = temp * 42
  const tintScale = tintValue * 32

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r += tempScale + tintScale * 0.4
    g -= tintScale * 0.25
    b -= tempScale - tintScale * 0.4

    data[i] = Math.max(0, Math.min(255, Math.round(r)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)))
  }
}

export function applyPixelHslAdjustments(imageData: ImageData, color: ColorAdjustments): void {
  applyTemperatureTintToImageData(imageData, color.temperature ?? DEFAULT_COLOR.temperature, color.tint ?? DEFAULT_COLOR.tint)
}
