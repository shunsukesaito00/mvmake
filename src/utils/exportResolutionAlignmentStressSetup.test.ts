import { describe, it, expect, beforeEach } from 'vitest'
import {
  EXPORT_720P_HEIGHT,
  EXPORT_720P_WIDTH,
  EXPORT_RESOLUTION_ALIGNMENT_CASE_COUNT,
  EXPORT_RESOLUTION_ALIGNMENT_STRESS_PRESET_ID,
  applyResolutionPresetById,
  getExportResolutionAlignmentStressStats,
  seedExportResolutionAlignmentStress,
  verifyAllExportResolutionAlignmentCases,
} from './exportResolutionAlignmentStressSetup'
import { DEFAULT_PROJECT_HEIGHT, DEFAULT_PROJECT_WIDTH } from './vertical916PresetStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('exportResolutionAlignmentStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('verifyAllExportResolutionAlignmentCases は4形式のネイティブ/720p整合を検証する', () => {
    const presetIds = verifyAllExportResolutionAlignmentCases()
    expect(presetIds).toHaveLength(EXPORT_RESOLUTION_ALIGNMENT_CASE_COUNT)
    expect(presetIds).toContain('4k')
    expect(presetIds).toContain('square')
    expect(presetIds).toContain('vertical')
  })

  it('seedExportResolutionAlignmentStress は4K状態と720pダウンスケールを返す', () => {
    const stats = seedExportResolutionAlignmentStress()
    expect(stats.verifiedPresetIds).toHaveLength(EXPORT_RESOLUTION_ALIGNMENT_CASE_COUNT)
    expect(stats.activePresetId).toBe(EXPORT_RESOLUTION_ALIGNMENT_STRESS_PRESET_ID)
    expect(stats.width).toBe(3840)
    expect(stats.height).toBe(2160)
    expect(stats.nativeExportLabel).toBe('4K で書き出し')
    expect(stats.nativeExportWidth).toBe(3840)
    expect(stats.nativeExportHeight).toBe(2160)
    expect(stats.downscale720Width).toBe(EXPORT_720P_WIDTH)
    expect(stats.downscale720Height).toBe(EXPORT_720P_HEIGHT)
  })

  it('適用を undo でデフォルト1080pに復元できる', () => {
    seedExportResolutionAlignmentStress()
    useProjectStore.getState().undo()
    const stats = getExportResolutionAlignmentStressStats()
    expect(stats.width).toBe(DEFAULT_PROJECT_WIDTH)
    expect(stats.height).toBe(DEFAULT_PROJECT_HEIGHT)
    expect(stats.nativeExportLabel).toBe('1080p で書き出し')
    expect(stats.downscale720Width).toBe(EXPORT_720P_WIDTH)
    expect(stats.downscale720Height).toBe(EXPORT_720P_HEIGHT)
  })

  it('undo 後に正方形へ再適用するとネイティブ/720p整合が復元される', () => {
    seedExportResolutionAlignmentStress()
    useProjectStore.getState().undo()
    const stats = applyResolutionPresetById('square')
    expect(stats.width).toBe(1080)
    expect(stats.height).toBe(1080)
    expect(stats.nativeExportLabel).toBe('1080×1080 で書き出し')
    expect(stats.nativeExportWidth).toBe(1080)
    expect(stats.nativeExportHeight).toBe(1080)
    expect(stats.downscale720Width).toBe(EXPORT_720P_WIDTH)
    expect(stats.downscale720Height).toBe(EXPORT_720P_HEIGHT)
  })
})
