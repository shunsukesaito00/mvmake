import type { ColorAdjustments } from '../types/project'

export interface ColorLookPreset {
  id: string
  label: string
  description: string
  color: ColorAdjustments
}

export const COLOR_LOOK_PRESETS: ColorLookPreset[] = [
  { id: 'none', label: 'なし', description: '補正なし', color: { brightness: 0, contrast: 0, saturation: 0 } },
  { id: 'natural', label: 'ナチュラル', description: '明るく爽やか', color: { brightness: 0.08, contrast: 0.05, saturation: 0.12 } },
  { id: 'film', label: 'フィルム風', description: '落ち着いたシネマ調', color: { brightness: -0.05, contrast: 0.15, saturation: -0.2 } },
  { id: 'sepia', label: 'セピア', description: 'ノスタルジック', color: { brightness: 0.05, contrast: 0.08, saturation: -0.5 } },
  { id: 'soft', label: 'ソフト', description: '柔らかなハイライト', color: { brightness: 0.12, contrast: -0.1, saturation: -0.05 } },
]

const EPSILON = 0.001

export function colorAdjustmentsEqual(a: ColorAdjustments, b: ColorAdjustments): boolean {
  return (
    Math.abs(a.brightness - b.brightness) < EPSILON &&
    Math.abs(a.contrast - b.contrast) < EPSILON &&
    Math.abs(a.saturation - b.saturation) < EPSILON
  )
}

export function matchColorLookPreset(color: ColorAdjustments): string | null {
  const match = COLOR_LOOK_PRESETS.find((preset) => colorAdjustmentsEqual(color, preset.color))
  return match?.id ?? null
}
