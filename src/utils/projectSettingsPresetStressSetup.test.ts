import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clearProjectSettingsPresetStress,
  PROJECT_SETTINGS_PRESET_STRESS_COUNT,
  seedProjectSettingsPresetStress,
} from './projectSettingsPresetStressSetup'
import { loadProjectSettingsPresets } from '../persistence/projectSettingsPresets'
import { useProjectStore } from '../store/projectStore'

describe('projectSettingsPresetStressSetup', () => {
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
    clearProjectSettingsPresetStress()
  })

  it('seedProjectSettingsPresetStress は婚礼6形式を localStorage に保存する', () => {
    const stats = seedProjectSettingsPresetStress()
    expect(stats.presetCount).toBe(PROJECT_SETTINGS_PRESET_STRESS_COUNT)
    expect(stats.names).toContain('縦型婚礼')
    expect(stats.verticalWidth).toBe(1080)
    expect(stats.verticalHeight).toBe(1920)
    expect(loadProjectSettingsPresets()).toHaveLength(PROJECT_SETTINGS_PRESET_STRESS_COUNT)
  })

  it('clearProjectSettingsPresetStress で一覧を空にする', () => {
    seedProjectSettingsPresetStress()
    clearProjectSettingsPresetStress()
    expect(loadProjectSettingsPresets()).toEqual([])
  })
})
