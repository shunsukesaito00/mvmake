import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildProjectSettingsPresetExportStressPayload,
  seedProjectSettingsPresetExportStress,
} from './projectSettingsPresetExportStressSetup'
import { parseExportedProjectSettingsPresetFile } from './projectSettingsPresetFile'
import {
  importProjectSettingsPresets,
  loadProjectSettingsPresets,
  replaceProjectSettingsPresets,
} from '../persistence/projectSettingsPresets'
import { PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION } from '../types/projectSettingsPreset'
import { PROJECT_SETTINGS_PRESET_STRESS_COUNT } from './projectSettingsPresetStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('projectSettingsPresetExportStressSetup', () => {
  const store: Record<string, string> = {}

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key])
      },
    })
    useProjectStore.getState().resetProject()
    replaceProjectSettingsPresets([])
  })

  it('seedProjectSettingsPresetExportStress は schemaVersion 付き JSON を返す', () => {
    const stats = seedProjectSettingsPresetExportStress()
    const parsed = parseExportedProjectSettingsPresetFile(JSON.parse(stats.exportJson))
    expect(parsed).toHaveLength(PROJECT_SETTINGS_PRESET_STRESS_COUNT)
    expect(JSON.parse(stats.exportJson).schemaVersion).toBe(PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION)
    expect(stats.exportFilename).toContain('.fable-project-preset.json')
  })

  it('エクスポート JSON を再インポートすると6形式が維持される', () => {
    const stats = buildProjectSettingsPresetExportStressPayload()
    replaceProjectSettingsPresets([])
    const items = parseExportedProjectSettingsPresetFile(JSON.parse(stats.exportJson))
    importProjectSettingsPresets(items)
    expect(loadProjectSettingsPresets()).toHaveLength(PROJECT_SETTINGS_PRESET_STRESS_COUNT)
    expect(loadProjectSettingsPresets().map((p) => p.name)).toEqual(expect.arrayContaining(stats.names))
  })
})
