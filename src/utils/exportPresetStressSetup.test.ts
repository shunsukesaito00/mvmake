import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  EXPORT_PRESET_STRESS_COUNT,
  EXPORT_PRESET_STRESS_HIGHLIGHT_NAME,
  applyExportPresetByName,
  clearExportPresetStress,
  seedExportPresetStress,
} from './exportPresetStressSetup'
import { loadExportPresets } from '../persistence/exportPresets'
import { useProjectStore } from '../store/projectStore'

describe('exportPresetStressSetup', () => {
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
    clearExportPresetStress()
  })

  it('seedExportPresetStress は4件の品質・解像度・In/Outパターンを投入する', () => {
    const stats = seedExportPresetStress()
    expect(stats.presetCount).toBe(EXPORT_PRESET_STRESS_COUNT)
    expect(loadExportPresets()).toHaveLength(EXPORT_PRESET_STRESS_COUNT)
    expect(stats.names).toContain('SNS軽量')
    expect(stats.highlightPresetName).toBe(EXPORT_PRESET_STRESS_HIGHLIGHT_NAME)
    expect(stats.highlightQuality).toBe('high')
    expect(stats.highlightInPoint).toBe(2)
    expect(stats.highlightOutPoint).toBe(10)
  })

  it('applyExportPresetByName は In/Out 範囲を設定する', () => {
    seedExportPresetStress()
    const applied = applyExportPresetByName(EXPORT_PRESET_STRESS_HIGHLIGHT_NAME)
    expect(applied.useInOut).toBe(true)
    expect(applied.inPoint).toBe(2)
    expect(applied.outPoint).toBe(10)
    expect(useProjectStore.getState().inPoint).toBe(2)
    expect(useProjectStore.getState().outPoint).toBe(10)
  })

  it('In/Out クリア後の再適用で範囲が復元される', () => {
    seedExportPresetStress()
    applyExportPresetByName(EXPORT_PRESET_STRESS_HIGHLIGHT_NAME)
    useProjectStore.getState().clearInOut()
    expect(useProjectStore.getState().inPoint).toBeNull()

    const applied = applyExportPresetByName(EXPORT_PRESET_STRESS_HIGHLIGHT_NAME)
    expect(applied.inPoint).toBe(2)
    expect(applied.outPoint).toBe(10)
    expect(useProjectStore.getState().inPoint).toBe(2)
    expect(useProjectStore.getState().outPoint).toBe(10)
  })
})
