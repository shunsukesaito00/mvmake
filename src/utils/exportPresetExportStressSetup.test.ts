import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildExportPresetExportStressPayload,
  seedExportPresetExportStress,
} from './exportPresetExportStressSetup'
import { parseExportedExportPresetFile } from './exportPresetFile'
import {
  importExportPresets,
  loadExportPresets,
  replaceExportPresets,
} from '../persistence/exportPresets'
import { EXPORT_PRESET_FILE_SCHEMA_VERSION } from '../types/exportPreset'
import { EXPORT_PRESET_STRESS_COUNT } from './exportPresetStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('exportPresetExportStressSetup', () => {
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
    replaceExportPresets([])
  })

  it('seedExportPresetExportStress は schemaVersion 付き JSON を返す', () => {
    const stats = seedExportPresetExportStress()
    const parsed = parseExportedExportPresetFile(JSON.parse(stats.exportJson))
    expect(parsed).toHaveLength(EXPORT_PRESET_STRESS_COUNT)
    expect(JSON.parse(stats.exportJson).schemaVersion).toBe(EXPORT_PRESET_FILE_SCHEMA_VERSION)
    expect(stats.exportFilename).toContain('.fable-export-preset.json')
  })

  it('エクスポート JSON を再インポートすると4件が維持される', () => {
    const stats = buildExportPresetExportStressPayload()
    replaceExportPresets([])
    const items = parseExportedExportPresetFile(JSON.parse(stats.exportJson))
    importExportPresets(items)
    expect(loadExportPresets()).toHaveLength(EXPORT_PRESET_STRESS_COUNT)
    expect(loadExportPresets().map((p) => p.name)).toEqual(expect.arrayContaining(stats.names))
  })
})
