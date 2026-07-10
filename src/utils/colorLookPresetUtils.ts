import type { ColorAdjustments } from '../types/project'
import { normalizeColorAdjustments } from '../types/project'
import type { UserColorLookPreset } from '../types/colorLookPreset'
import { isRgbCurveChannelActive, isRgbCurvesActive } from './colorRgbCurve'
import { createId } from './id'

export function buildUserColorLookPreset(
  name: string,
  color: ColorAdjustments,
  description = '',
): UserColorLookPreset {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('プリセット名を入力してください')

  return {
    id: createId(),
    name: trimmed,
    description: description.trim(),
    color: normalizeColorAdjustments(color),
  }
}

const SUMMARY_MAX_PARTS = 4

export function getColorLookPresetSummaryParts(color: ColorAdjustments): string[] {
  const c = normalizeColorAdjustments(color)
  const parts: string[] = []

  const rgbSummary = summarizeRgbCurves(c)
  if (rgbSummary) parts.push(rgbSummary)

  if (Math.abs(c.shadows ?? 0) >= 0.01) parts.push(`シャドウ ${formatSignedPercent(c.shadows!)}`)
  if (Math.abs(c.midtones ?? 0) >= 0.01) parts.push(`ミッド ${formatSignedPercent(c.midtones!)}`)
  if (Math.abs(c.highlights ?? 0) >= 0.01) parts.push(`ハイライト ${formatSignedPercent(c.highlights!)}`)

  if (Math.abs(c.brightness) >= 0.01) parts.push(`明るさ ${formatSignedPercent(c.brightness)}`)
  if (Math.abs(c.contrast) >= 0.01) parts.push(`コントラスト ${formatSignedPercent(c.contrast)}`)
  if (Math.abs(c.saturation) >= 0.01) parts.push(`彩度 ${formatSignedPercent(c.saturation)}`)
  if (Math.abs(c.temperature ?? 0) >= 0.01) parts.push(`色温度 ${formatSignedPercent(c.temperature!)}`)
  if (Math.abs(c.tint ?? 0) >= 0.01) parts.push(`ティント ${formatSignedPercent(c.tint!)}`)
  if (Math.abs(c.hue ?? 0) >= 0.01) parts.push(`色相 ${Math.round(c.hue! * 180)}°`)

  return parts
}

export function formatColorLookPresetSummary(color: ColorAdjustments): string {
  const parts = getColorLookPresetSummaryParts(color)
  if (!parts.length) return 'カスタム色調'
  if (parts.length <= SUMMARY_MAX_PARTS) return parts.join(' · ')
  return `${parts.slice(0, SUMMARY_MAX_PARTS - 1).join(' · ')} · +${parts.length - (SUMMARY_MAX_PARTS - 1)}`
}

function summarizeRgbCurves(color: ColorAdjustments): string | null {
  const curves = color.rgbCurves
  if (!curves || !isRgbCurvesActive(curves)) return null

  const channels: string[] = []
  if (isRgbCurveChannelActive(curves.r)) channels.push('R')
  if (isRgbCurveChannelActive(curves.g)) channels.push('G')
  if (isRgbCurveChannelActive(curves.b)) channels.push('B')
  return channels.length ? `RGBカーブ(${channels.join('/')})` : null
}

function formatSignedPercent(value: number): string {
  const pct = Math.round(value * 100)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}
