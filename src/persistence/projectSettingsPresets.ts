import type { ProjectSettingsPreset } from '../types/projectSettingsPreset'

const STORAGE_KEY = 'fable-project-settings-presets'

function normalizePreset(preset: ProjectSettingsPreset): ProjectSettingsPreset {
  return {
    ...preset,
    rippleDelete: Boolean(preset.rippleDelete),
    loopPlayback: Boolean(preset.loopPlayback),
  }
}

function readRaw(): ProjectSettingsPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectSettingsPreset[]
    return Array.isArray(parsed) ? parsed.map(normalizePreset) : []
  } catch {
    return []
  }
}

function writeRaw(presets: ProjectSettingsPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function loadProjectSettingsPresets(): ProjectSettingsPreset[] {
  return readRaw()
}

export function saveProjectSettingsPreset(preset: ProjectSettingsPreset): ProjectSettingsPreset[] {
  const next = [...readRaw(), preset]
  writeRaw(next)
  return next
}

export function deleteProjectSettingsPreset(id: string): ProjectSettingsPreset[] {
  const next = readRaw().filter((p) => p.id !== id)
  writeRaw(next)
  return next
}

export function replaceProjectSettingsPresets(presets: ProjectSettingsPreset[]): void {
  writeRaw(presets)
}
