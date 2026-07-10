import type { ColorAdjustments } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'

function isNeutralValue(value: number | undefined): boolean {
  return Math.abs(value ?? 0) < 0.001
}

/** Canvas 2D / CSS filter 共通の色調フィルタ文字列 */
export function buildColorFilterCss(color: ColorAdjustments): string | undefined {
  const normalized = {
    brightness: color.brightness ?? DEFAULT_COLOR.brightness,
    contrast: color.contrast ?? DEFAULT_COLOR.contrast,
    saturation: color.saturation ?? DEFAULT_COLOR.saturation,
    hue: color.hue ?? DEFAULT_COLOR.hue,
    temperature: color.temperature ?? DEFAULT_COLOR.temperature,
    tint: color.tint ?? DEFAULT_COLOR.tint,
  }

  if (
    isNeutralValue(normalized.brightness)
    && isNeutralValue(normalized.contrast)
    && isNeutralValue(normalized.saturation)
    && isNeutralValue(normalized.hue)
  ) {
    return undefined
  }

  const parts: string[] = []
  if (!isNeutralValue(normalized.hue)) {
    parts.push(`hue-rotate(${normalized.hue * 180}deg)`)
  }

  const b = 100 + normalized.brightness * 50
  const c = 100 + normalized.contrast * 50
  const s = 100 + normalized.saturation * 100
  parts.push(`brightness(${b}%)`, `contrast(${c}%)`, `saturate(${s}%)`)
  return parts.join(' ')
}
