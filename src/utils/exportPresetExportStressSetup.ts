import { loadExportPresets } from '../persistence/exportPresets'
import {
  buildExportedExportPresetFile,
  buildExportPresetExportFilename,
  serializeExportedExportPresetFile,
} from './exportPresetFile'
import {
  EXPORT_PRESET_STRESS_COUNT,
  seedExportPresetStress,
  type ExportPresetStressStats,
} from './exportPresetStressSetup'

export interface ExportPresetExportStressStats extends ExportPresetStressStats {
  exportJson: string
  exportFilename: string
}

/** ストレス4件の `.fable-export-preset.json` 相当 JSON を生成 */
export function buildExportPresetExportStressPayload(): ExportPresetExportStressStats {
  const base = seedExportPresetStress()
  const presets = loadExportPresets()
  if (presets.length !== EXPORT_PRESET_STRESS_COUNT) {
    throw new Error('stress export presets missing after seed')
  }

  const exportJson = serializeExportedExportPresetFile(buildExportedExportPresetFile(presets))
  return {
    ...base,
    exportJson,
    exportFilename: buildExportPresetExportFilename('ストレス書き出しプリセット'),
  }
}

export function seedExportPresetExportStress(): ExportPresetExportStressStats {
  return buildExportPresetExportStressPayload()
}
