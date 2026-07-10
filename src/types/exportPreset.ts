import type { ExportQuality } from '../engine/exporter'

export type ExportResolution = 'project' | '720p'

/** @deprecated localStorage 互換。読み込み時に project へ正規化 */
export type LegacyExportResolution = ExportResolution | '1080p'

/** 書き出しダイアログで再利用する名前付き設定 */
export interface ExportPreset {
  id: string
  name: string
  quality: ExportQuality
  resolution: ExportResolution
  /** true のとき inPoint / outPoint を書き出し範囲に使う */
  useInOut: boolean
  inPoint: number | null
  outPoint: number | null
}

export const EXPORT_RESOLUTION_LABELS: Record<ExportResolution, string> = {
  project: 'プロジェクト解像度',
  '720p': '1280×720',
}

export const EXPORT_PRESET_FILE_SCHEMA_VERSION = 1

/** `.fable-export-preset.json` の on-disk 形式（id はインポート時に再発行） */
export interface ExportedExportPresetItem {
  name: string
  quality: ExportQuality
  resolution: LegacyExportResolution
  useInOut: boolean
  inPoint: number | null
  outPoint: number | null
}

export interface ExportedExportPresetFile {
  schemaVersion: number
  presets: ExportedExportPresetItem[]
}
