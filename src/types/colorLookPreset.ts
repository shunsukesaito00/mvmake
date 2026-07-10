import type { ColorAdjustments } from './project'

/** localStorage に保存するユーザーカラールックプリセット */
export interface UserColorLookPreset {
  id: string
  name: string
  description: string
  color: ColorAdjustments
}

export const COLOR_LOOK_PRESET_FILE_SCHEMA_VERSION = 1

/** `.fable-color-look-preset.json` の on-disk 形式（id はインポート時に再発行） */
export interface ExportedColorLookPresetItem {
  name: string
  description?: string
  color: ColorAdjustments
}

export interface ExportedColorLookPresetFile {
  schemaVersion: number
  presets: ExportedColorLookPresetItem[]
}
