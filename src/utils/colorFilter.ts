import type { ColorAdjustments } from '../types/project'

/** Canvas 2D / CSS filter 共通の色調フィルタ文字列 */
export function buildColorFilterCss(color: ColorAdjustments): string | undefined {
  if (color.brightness === 0 && color.contrast === 0 && color.saturation === 0) return undefined
  const b = 100 + color.brightness * 50
  const c = 100 + color.contrast * 50
  const s = 100 + color.saturation * 100
  return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`
}
