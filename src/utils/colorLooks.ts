import type { ColorAdjustments } from '../types/project'
import type { UserColorLookPreset } from '../types/colorLookPreset'
import { DEFAULT_COLOR, normalizeRgbCurves } from '../types/project'
import { rgbCurvesEqual } from './colorRgbCurve'

export type ColorLookCategory = 'basic' | 'wedding' | 'mood' | 'film'

export interface ColorLookPreset {
  id: string
  label: string
  description: string
  category: ColorLookCategory
  color: ColorAdjustments
}

export const COLOR_LOOK_PRESETS: ColorLookPreset[] = [
  { id: 'none', label: 'なし', description: '補正なし', category: 'basic', color: { ...DEFAULT_COLOR } },
  { id: 'natural', label: 'ナチュラル', description: '明るく爽やか', category: 'basic', color: { ...DEFAULT_COLOR, brightness: 0.08, contrast: 0.05, saturation: 0.12 } },
  { id: 'film', label: 'フィルム風', description: '落ち着いたシネマ調', category: 'basic', color: { ...DEFAULT_COLOR, brightness: -0.05, contrast: 0.15, saturation: -0.2 } },
  { id: 'sepia', label: 'セピア', description: 'ノスタルジック', category: 'basic', color: { ...DEFAULT_COLOR, brightness: 0.05, contrast: 0.08, saturation: -0.5, temperature: 0.15 } },
  { id: 'soft', label: 'ソフト', description: '柔らかなハイライト', category: 'basic', color: { ...DEFAULT_COLOR, brightness: 0.12, contrast: -0.1, saturation: -0.05, highlights: 0.12 } },
  { id: 'wedding-warm', label: 'ウエディング暖色', description: '温かみのあるゴールデンアワー', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.06, contrast: 0.08, saturation: 0.18, temperature: 0.2, tint: 0.05 } },
  { id: 'champagne', label: 'シャンパン', description: '上品なシャンパンゴールド', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.1, contrast: 0.05, saturation: 0.05, temperature: 0.12, tint: 0.04 } },
  { id: 'garden', label: 'ガーデン', description: '爽やかな緑と自然光', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.05, contrast: 0.1, saturation: 0.25, temperature: -0.05, tint: -0.08 } },
  { id: 'evening', label: 'イブニング', description: '披露宴の落ち着いた照明', category: 'mood', color: { ...DEFAULT_COLOR, brightness: -0.08, contrast: 0.12, saturation: -0.1, temperature: 0.08, tint: 0.03, shadows: -0.08 } },
  { id: 'porcelain', label: 'ポーセリン', description: '肌色を明るく柔らかく', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.14, contrast: -0.05, saturation: -0.08, temperature: 0.06, tint: 0.06, midtones: 0.1 } },
  { id: 'romantic-sunset', label: 'ロマンティック夕暮れ', description: '夕焼けのオレンジとローズ', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.04, contrast: 0.1, saturation: 0.22, temperature: 0.28, tint: 0.08, highlights: 0.1 } },
  { id: 'classic-monochrome', label: 'クラシックモノトーン', description: '上品なモノクローム調', category: 'basic', color: { ...DEFAULT_COLOR, brightness: 0.02, contrast: 0.18, saturation: -0.75, temperature: 0.02 } },
  { id: 'bouquet-green', label: 'ブーケグリーン', description: 'ブーケと芝生の爽やかな緑', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.03, contrast: 0.08, saturation: 0.2, temperature: -0.1, tint: -0.15, hue: -0.03 } },
  { id: 'sakura-pink', label: '桜ピンク', description: '春の桜と柔らかなピンク', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.08, contrast: -0.05, saturation: 0.15, temperature: 0.1, tint: 0.12, highlights: 0.08 } },
  { id: 'night-ceremony', label: 'ナイトセレモニー', description: '夜の式場の落ち着いたトーン', category: 'mood', color: { ...DEFAULT_COLOR, brightness: -0.1, contrast: 0.14, saturation: -0.15, temperature: -0.08, tint: 0.02, shadows: -0.12, midtones: -0.05 } },
  { id: 'film-nostalgia', label: 'フィルムノスタルジア', description: '思い出アルバムのフィルム感', category: 'film', color: { ...DEFAULT_COLOR, brightness: -0.02, contrast: 0.12, saturation: -0.35, temperature: 0.1, tint: 0.06, shadows: 0.05, midtones: 0.06 } },
  { id: 'bridal-white', label: 'ブライダルホワイト', description: 'ドレスと会場の明るいハイキー', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.15, contrast: -0.08, saturation: -0.12, temperature: 0.04, tint: 0.08, highlights: 0.15, midtones: 0.08 } },
  { id: 'sunset-rose', label: 'サンセットローズ', description: '夕暮れのローズゴールド', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.02, contrast: 0.08, saturation: 0.2, temperature: 0.22, tint: 0.15, highlights: 0.06, shadows: -0.04 } },
  { id: 'vintage-film', label: 'ヴィンテージフィルム', description: '褪せたフィルム写真の温かみ', category: 'film', color: { ...DEFAULT_COLOR, brightness: 0.03, contrast: 0.06, saturation: -0.28, temperature: 0.14, tint: 0.04, shadows: 0.1, midtones: 0.04 } },
  { id: 'garden-party', label: 'ガーデンパーティ', description: '屋外パーティの明るい緑と陽光', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.1, contrast: 0.06, saturation: 0.28, temperature: 0.08, tint: -0.06, hue: -0.04, highlights: 0.1 } },
  { id: 'candlelight', label: 'キャンドルライト', description: 'キャンドルの温かな灯り', category: 'mood', color: { ...DEFAULT_COLOR, brightness: -0.06, contrast: 0.1, saturation: 0.05, temperature: 0.25, tint: 0.06, shadows: -0.1, highlights: -0.05, midtones: -0.03 } },
  { id: 'morning-dew', label: 'モーニングデュー', description: '朝露の爽やかな柔らかさ', category: 'wedding', color: { ...DEFAULT_COLOR, brightness: 0.12, contrast: -0.06, saturation: 0.08, temperature: -0.12, tint: -0.04, highlights: 0.14, midtones: 0.06 } },
]

const EPSILON = 0.001

export function colorAdjustmentsEqual(a: ColorAdjustments, b: ColorAdjustments): boolean {
  return (
    Math.abs(a.brightness - b.brightness) < EPSILON &&
    Math.abs(a.contrast - b.contrast) < EPSILON &&
    Math.abs(a.saturation - b.saturation) < EPSILON &&
    Math.abs((a.hue ?? 0) - (b.hue ?? 0)) < EPSILON &&
    Math.abs((a.temperature ?? 0) - (b.temperature ?? 0)) < EPSILON &&
    Math.abs((a.tint ?? 0) - (b.tint ?? 0)) < EPSILON &&
    Math.abs((a.shadows ?? 0) - (b.shadows ?? 0)) < EPSILON &&
    Math.abs((a.midtones ?? 0) - (b.midtones ?? 0)) < EPSILON &&
    Math.abs((a.highlights ?? 0) - (b.highlights ?? 0)) < EPSILON &&
    rgbCurvesEqual(normalizeRgbCurves(a.rgbCurves), normalizeRgbCurves(b.rgbCurves))
  )
}

export function matchColorLookPreset(
  color: ColorAdjustments,
  userPresets: UserColorLookPreset[] = [],
): string | null {
  const builtIn = COLOR_LOOK_PRESETS.find((preset) => colorAdjustmentsEqual(color, preset.color))
  if (builtIn) return builtIn.id
  const user = userPresets.find((preset) => colorAdjustmentsEqual(color, preset.color))
  return user?.id ?? null
}
