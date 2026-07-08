import type { TextStyle } from '../types/project'
import type { SavedTextStyleFields, SavedTextStylePreset } from '../types/textStylePreset'
import { createId } from './id'

export function extractTextStyleFields(text: TextStyle): SavedTextStyleFields {
  const { content: _, ...style } = text
  return style
}

export function buildSavedTextStylePreset(name: string, text: TextStyle): SavedTextStylePreset {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('スタイル名を入力してください')
  return {
    id: createId(),
    name: trimmed,
    style: extractTextStyleFields(text),
  }
}

export function applyTextStylePreset(text: TextStyle, style: SavedTextStyleFields): TextStyle {
  return { ...text, ...style, content: text.content }
}

export function formatTextStylePresetSummary(preset: SavedTextStylePreset): string {
  const { fontFamily, fontSize, color, lineHeight } = preset.style
  return `${fontFamily} · ${fontSize}px · ${color} · 行間 ${(lineHeight ?? 1.2).toFixed(1)}倍`
}
