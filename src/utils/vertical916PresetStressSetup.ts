import { RESOLUTION_PRESETS } from '../types/project'
import { getNativeExportButtonLabel, resolveExportSize } from './exportResolution'
import { useProjectStore } from '../store/projectStore'

export const VERTICAL_916_PRESET_ID = 'vertical'
export const VERTICAL_916_WIDTH = 1080
export const VERTICAL_916_HEIGHT = 1920
export const VERTICAL_916_PRESET_LABEL = '縦型 9:16 (1080×1920)'
export const VERTICAL_916_EXPORT_BUTTON_LABEL = '9:16 で書き出し'
export const DEFAULT_PROJECT_WIDTH = 1920
export const DEFAULT_PROJECT_HEIGHT = 1080

export interface Vertical916PresetStressStats {
  presetId: string
  presetLabel: string
  width: number
  height: number
  exportButtonLabel: string
  nativeExportWidth: number
  nativeExportHeight: number
}

function getVerticalPreset() {
  const preset = RESOLUTION_PRESETS.find((p) => p.id === VERTICAL_916_PRESET_ID)
  if (!preset) throw new Error('vertical 9:16 preset missing')
  return preset
}

export function getVertical916PresetStressStats(): Vertical916PresetStressStats {
  const project = useProjectStore.getState().project
  const preset = getVerticalPreset()
  const exportSize = resolveExportSize(project.width, project.height, 'project')

  return {
    presetId: preset.id,
    presetLabel: preset.label,
    width: project.width,
    height: project.height,
    exportButtonLabel: getNativeExportButtonLabel(project.width, project.height),
    nativeExportWidth: exportSize.width,
    nativeExportHeight: exportSize.height,
  }
}

/** 縦型 9:16 解像度プリセットを適用 */
export function applyVertical916Preset(): Vertical916PresetStressStats {
  const preset = getVerticalPreset()
  useProjectStore.getState().setProjectSettings({ width: preset.width, height: preset.height })

  const stats = getVertical916PresetStressStats()
  if (stats.width !== VERTICAL_916_WIDTH || stats.height !== VERTICAL_916_HEIGHT) {
    throw new Error(`expected ${VERTICAL_916_WIDTH}×${VERTICAL_916_HEIGHT}, got ${stats.width}×${stats.height}`)
  }
  if (stats.exportButtonLabel !== VERTICAL_916_EXPORT_BUTTON_LABEL) {
    throw new Error(`expected export label ${VERTICAL_916_EXPORT_BUTTON_LABEL}, got ${stats.exportButtonLabel}`)
  }
  if (stats.nativeExportWidth !== VERTICAL_916_WIDTH || stats.nativeExportHeight !== VERTICAL_916_HEIGHT) {
    throw new Error('vertical project must export at native resolution')
  }

  return stats
}

/** デフォルト解像度から縦型 9:16 プリセットを適用したストレスプロジェクトを投入 */
export function seedVertical916PresetStress(): Vertical916PresetStressStats {
  useProjectStore.getState().resetProject()
  return applyVertical916Preset()
}
