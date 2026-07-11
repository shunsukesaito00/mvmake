import { loadProjectSettingsPresets } from '../persistence/projectSettingsPresets'
import {
  buildExportedProjectSettingsPresetFile,
  buildProjectSettingsPresetExportFilename,
  serializeExportedProjectSettingsPresetFile,
} from './projectSettingsPresetFile'
import {
  PROJECT_SETTINGS_PRESET_STRESS_COUNT,
  seedProjectSettingsPresetStress,
  type ProjectSettingsPresetStressStats,
} from './projectSettingsPresetStressSetup'

export interface ProjectSettingsPresetExportStressStats extends ProjectSettingsPresetStressStats {
  exportJson: string
  exportFilename: string
}

/** ストレス6形式の `.fable-project-preset.json` 相当 JSON を生成 */
export function buildProjectSettingsPresetExportStressPayload(): ProjectSettingsPresetExportStressStats {
  const base = seedProjectSettingsPresetStress()
  const presets = loadProjectSettingsPresets()
  if (presets.length !== PROJECT_SETTINGS_PRESET_STRESS_COUNT) {
    throw new Error('stress presets missing after seed')
  }

  const exportJson = serializeExportedProjectSettingsPresetFile(
    buildExportedProjectSettingsPresetFile(presets),
  )
  return {
    ...base,
    exportJson,
    exportFilename: buildProjectSettingsPresetExportFilename('ストレス設定プリセット'),
  }
}

export function seedProjectSettingsPresetExportStress(): ProjectSettingsPresetExportStressStats {
  return buildProjectSettingsPresetExportStressPayload()
}
