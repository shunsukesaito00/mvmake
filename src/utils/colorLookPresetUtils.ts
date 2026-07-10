import type { ColorAdjustments } from '../types/project'
import { normalizeColorAdjustments } from '../types/project'
import type { UserColorLookPreset } from '../types/colorLookPreset'
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

export function formatColorLookPresetSummary(color: ColorAdjustments): string {
  const c = normalizeColorAdjustments(color)
  const parts: string[] = []
  if (Math.abs(c.brightness) >= 0.01) parts.push(`明るさ ${formatSignedPercent(c.brightness)}`)
  if (Math.abs(c.contrast) >= 0.01) parts.push(`コントラスト ${formatSignedPercent(c.contrast)}`)
  if (Math.abs(c.saturation) >= 0.01) parts.push(`彩度 ${formatSignedPercent(c.saturation)}`)
  if (Math.abs(c.temperature) >= 0.01) parts.push(`色温度 ${formatSignedPercent(c.temperature)}`)
  if (Math.abs(c.tint) >= 0.01) parts.push(`ティント ${formatSignedPercent(c.tint)}`)
  if (Math.abs(c.hue) >= 0.01) parts.push(`色相 ${Math.round(c.hue * 180)}°`)
  return parts.length ? parts.slice(0, 3).join(' · ') : 'カスタム色調'
}

function formatSignedPercent(value: number): string {
  const pct = Math.round(value * 100)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}
