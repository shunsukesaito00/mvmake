import type { UserColorLookPreset } from '../types/colorLookPreset'
import type { ExportedColorLookPresetItem } from '../types/colorLookPreset'
import { normalizeColorAdjustments } from '../types/project'
import { colorLookPresetFromImportedItem } from '../utils/colorLookPresetFile'

const STORAGE_KEY = 'fable-color-look-presets'

function normalizePreset(preset: UserColorLookPreset): UserColorLookPreset {
  return {
    ...preset,
    description: preset.description ?? '',
    color: normalizeColorAdjustments(preset.color),
  }
}

function readRaw(): UserColorLookPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UserColorLookPreset[]
    return Array.isArray(parsed) ? parsed.map(normalizePreset) : []
  } catch {
    return []
  }
}

function writeRaw(presets: UserColorLookPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function loadColorLookPresets(): UserColorLookPreset[] {
  return readRaw()
}

export function saveColorLookPreset(preset: UserColorLookPreset): UserColorLookPreset[] {
  const next = [...readRaw(), normalizePreset(preset)]
  writeRaw(next)
  return next
}

export function deleteColorLookPreset(id: string): UserColorLookPreset[] {
  const next = readRaw().filter((p) => p.id !== id)
  writeRaw(next)
  return next
}

export function importColorLookPresets(items: ExportedColorLookPresetItem[]): UserColorLookPreset[] {
  const existing = readRaw()
  const takenNames = existing.map((p) => p.name)
  const imported: UserColorLookPreset[] = []
  for (const item of items) {
    const preset = colorLookPresetFromImportedItem(item, takenNames)
    imported.push(preset)
    takenNames.push(preset.name)
  }
  const next = [...existing, ...imported]
  writeRaw(next)
  return next
}
