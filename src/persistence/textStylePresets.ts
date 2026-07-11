import {
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  DEFAULT_TEXT_LINE_HEIGHT,
} from '../types/project'
import type { SavedTextStyleFields, SavedTextStylePreset } from '../types/textStylePreset'

const STORAGE_KEY = 'fable-text-style-presets'

function normalizeStyle(style: Partial<SavedTextStyleFields>): SavedTextStyleFields {
  return {
    fontFamily: style.fontFamily ?? 'Noto Sans JP',
    fontSize: style.fontSize ?? 48,
    color: style.color ?? '#ffffff',
    strokeColor: style.strokeColor ?? '#000000',
    strokeWidth: style.strokeWidth ?? 0,
    shadowColor: style.shadowColor ?? 'rgba(0,0,0,0.5)',
    shadowBlur: style.shadowBlur ?? 4,
    textAlign: style.textAlign ?? 'center',
    lineHeight: style.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT,
    verticalAlign: style.verticalAlign ?? 'center',
    backgroundColor: style.backgroundColor ?? '',
    backgroundPadding: style.backgroundPadding ?? DEFAULT_TEXT_BACKGROUND_PADDING,
    backgroundRadius: style.backgroundRadius ?? DEFAULT_TEXT_BACKGROUND_RADIUS,
  }
}

function normalizePreset(preset: SavedTextStylePreset): SavedTextStylePreset {
  return {
    ...preset,
    style: normalizeStyle(preset.style),
  }
}

function readRaw(): SavedTextStylePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedTextStylePreset[]
    return Array.isArray(parsed) ? parsed.map(normalizePreset) : []
  } catch {
    return []
  }
}

function writeRaw(presets: SavedTextStylePreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function loadTextStylePresets(): SavedTextStylePreset[] {
  return readRaw()
}

export interface SaveTextStylePresetResult {
  presets: SavedTextStylePreset[]
  replaced: boolean
}

/** 同名（trim 一致）があれば上書き、なければ追加 */
export function saveTextStylePreset(preset: SavedTextStylePreset): SaveTextStylePresetResult {
  const existing = readRaw()
  const nameKey = preset.name.trim()
  const normalized = normalizePreset({ ...preset, name: nameKey })
  const index = existing.findIndex((p) => p.name.trim() === nameKey)
  if (index >= 0) {
    const next = [...existing]
    next[index] = { ...normalized, id: existing[index]!.id }
    writeRaw(next)
    return { presets: next, replaced: true }
  }
  const next = [...existing, normalized]
  writeRaw(next)
  return { presets: next, replaced: false }
}

export function deleteTextStylePreset(id: string): SavedTextStylePreset[] {
  const next = readRaw().filter((p) => p.id !== id)
  writeRaw(next)
  return next
}

export function replaceTextStylePresets(presets: SavedTextStylePreset[]): void {
  writeRaw(presets.map(normalizePreset))
}
