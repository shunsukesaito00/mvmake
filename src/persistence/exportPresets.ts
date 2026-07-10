import type { ExportPreset } from '../types/exportPreset'
import type { ExportedExportPresetItem } from '../types/exportPreset'
import { exportPresetFromImportedItem } from '../utils/exportPresetFile'
import { normalizeExportResolution } from '../utils/exportResolution'

const STORAGE_KEY = 'fable-export-presets'

function normalizePreset(preset: ExportPreset & { resolution?: string }): ExportPreset {
  return {
    ...preset,
    resolution: normalizeExportResolution(preset.resolution ?? 'project'),
  }
}

function readRaw(): ExportPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ExportPreset[]
    return Array.isArray(parsed) ? parsed.map(normalizePreset) : []
  } catch {
    return []
  }
}

function writeRaw(presets: ExportPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function loadExportPresets(): ExportPreset[] {
  return readRaw()
}

export function saveExportPreset(preset: ExportPreset): ExportPreset[] {
  const next = [...readRaw(), preset]
  writeRaw(next)
  return next
}

export function deleteExportPreset(id: string): ExportPreset[] {
  const next = readRaw().filter((p) => p.id !== id)
  writeRaw(next)
  return next
}

export function replaceExportPresets(presets: ExportPreset[]): void {
  writeRaw(presets)
}

export function importExportPresets(items: ExportedExportPresetItem[]): ExportPreset[] {
  const existing = readRaw()
  const takenNames = existing.map((p) => p.name)
  const imported: ExportPreset[] = []
  for (const item of items) {
    const preset = exportPresetFromImportedItem(item, takenNames)
    imported.push(preset)
    takenNames.push(preset.name)
  }
  const next = [...existing, ...imported]
  writeRaw(next)
  return next
}
