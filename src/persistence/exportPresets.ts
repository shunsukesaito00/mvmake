import type { ExportPreset } from '../types/exportPreset'

const STORAGE_KEY = 'fable-export-presets'

function readRaw(): ExportPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ExportPreset[]
    return Array.isArray(parsed) ? parsed : []
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
