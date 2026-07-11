import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_PROJECT_HEIGHT,
  DEFAULT_PROJECT_WIDTH,
  VERTICAL_916_EXPORT_BUTTON_LABEL,
  VERTICAL_916_HEIGHT,
  VERTICAL_916_PRESET_ID,
  VERTICAL_916_PRESET_LABEL,
  VERTICAL_916_WIDTH,
  applyVertical916Preset,
  getVertical916PresetStressStats,
  seedVertical916PresetStress,
} from './vertical916PresetStressSetup'
import { useProjectStore } from '../store/projectStore'

describe('vertical916PresetStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('seedVertical916PresetStress は1080×1920と9:16書き出しラベルを設定する', () => {
    const stats = seedVertical916PresetStress()
    expect(stats.presetId).toBe(VERTICAL_916_PRESET_ID)
    expect(stats.presetLabel).toBe(VERTICAL_916_PRESET_LABEL)
    expect(stats.width).toBe(VERTICAL_916_WIDTH)
    expect(stats.height).toBe(VERTICAL_916_HEIGHT)
    expect(stats.exportButtonLabel).toBe(VERTICAL_916_EXPORT_BUTTON_LABEL)
    expect(stats.nativeExportWidth).toBe(VERTICAL_916_WIDTH)
    expect(stats.nativeExportHeight).toBe(VERTICAL_916_HEIGHT)
  })

  it('適用を undo でデフォルト1080pに復元できる', () => {
    seedVertical916PresetStress()
    useProjectStore.getState().undo()
    const stats = getVertical916PresetStressStats()
    expect(stats.width).toBe(DEFAULT_PROJECT_WIDTH)
    expect(stats.height).toBe(DEFAULT_PROJECT_HEIGHT)
    expect(stats.exportButtonLabel).toBe('1080p で書き出し')
  })

  it('undo 後に再適用すると縦型解像度とネイティブ書き出しが復元される', () => {
    seedVertical916PresetStress()
    useProjectStore.getState().undo()
    const stats = applyVertical916Preset()
    expect(stats.width).toBe(VERTICAL_916_WIDTH)
    expect(stats.height).toBe(VERTICAL_916_HEIGHT)
    expect(stats.exportButtonLabel).toBe(VERTICAL_916_EXPORT_BUTTON_LABEL)
    expect(stats.nativeExportWidth).toBe(VERTICAL_916_WIDTH)
    expect(stats.nativeExportHeight).toBe(VERTICAL_916_HEIGHT)
  })
})
