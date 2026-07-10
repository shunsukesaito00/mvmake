/** localStorage に保存するプロジェクト設定プリセット */
export interface ProjectSettingsPreset {
  id: string
  name: string
  width: number
  height: number
  fps: number
  rippleDelete: boolean
  loopPlayback: boolean
}

export interface ProjectSettingsSnapshot {
  width: number
  height: number
  fps: number
  rippleDelete: boolean
  loopPlayback: boolean
}

export const PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION = 1

/** `.fable-project-preset.json` の on-disk 形式（id はインポート時に再発行） */
export interface ExportedProjectSettingsPresetItem {
  name: string
  width: number
  height: number
  fps: number
  rippleDelete: boolean
  loopPlayback: boolean
}

export interface ExportedProjectSettingsPresetFile {
  schemaVersion: number
  presets: ExportedProjectSettingsPresetItem[]
}
