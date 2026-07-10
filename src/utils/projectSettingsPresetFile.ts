import type {
  ExportedProjectSettingsPresetFile,
  ExportedProjectSettingsPresetItem,
  ProjectSettingsPreset,
} from '../types/projectSettingsPreset'
import { PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION } from '../types/projectSettingsPreset'
import { createId } from './id'
import { sanitizeFileBase } from './chapterBatchExport'

export function buildExportedProjectSettingsPresetFile(
  presets: ProjectSettingsPreset[],
): ExportedProjectSettingsPresetFile {
  return {
    schemaVersion: PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION,
    presets: presets.map(projectSettingsPresetToFileItem),
  }
}

export function projectSettingsPresetToFileItem(
  preset: ProjectSettingsPreset,
): ExportedProjectSettingsPresetItem {
  return {
    name: preset.name,
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    rippleDelete: preset.rippleDelete,
    loopPlayback: preset.loopPlayback,
  }
}

export function parseExportedProjectSettingsPresetFile(raw: unknown): ExportedProjectSettingsPresetItem[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('プリセットファイルの形式が不正です')
  }

  const data = raw as Partial<ExportedProjectSettingsPresetFile>
  if (data.schemaVersion !== PROJECT_SETTINGS_PRESET_FILE_SCHEMA_VERSION) {
    throw new Error('このプリセットファイルは対応していないバージョンです')
  }
  if (!Array.isArray(data.presets) || data.presets.length === 0) {
    throw new Error('プリセットが含まれていません')
  }

  return data.presets.map(parseExportedProjectSettingsPresetItem)
}

function parseExportedProjectSettingsPresetItem(raw: unknown): ExportedProjectSettingsPresetItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('プリセットの形式が不正です')
  }

  const item = raw as Partial<ExportedProjectSettingsPresetItem>
  if (!item.name?.trim()) {
    throw new Error('プリセット名がありません')
  }
  if (!isValidDimension(item.width) || !isValidDimension(item.height)) {
    throw new Error('解像度の値が不正です')
  }
  if (!isValidFps(item.fps)) {
    throw new Error('FPS の値が不正です')
  }

  return {
    name: item.name.trim(),
    width: Math.round(item.width!),
    height: Math.round(item.height!),
    fps: Math.round(item.fps!),
    rippleDelete: Boolean(item.rippleDelete),
    loopPlayback: Boolean(item.loopPlayback),
  }
}

function isValidDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 64 && value <= 7680
}

function isValidFps(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 120
}

export function resolveImportedProjectSettingsPresetName(name: string, existingNames: Iterable<string>): string {
  const taken = new Set(existingNames)
  if (!taken.has(name)) return name

  const suffix = `${name} (インポート)`
  if (!taken.has(suffix)) return suffix

  let n = 2
  while (taken.has(`${name} (インポート ${n})`)) n++
  return `${name} (インポート ${n})`
}

export function projectSettingsPresetFromImportedItem(
  item: ExportedProjectSettingsPresetItem,
  existingNames: Iterable<string>,
): ProjectSettingsPreset {
  return {
    id: createId(),
    name: resolveImportedProjectSettingsPresetName(item.name, existingNames),
    width: item.width,
    height: item.height,
    fps: item.fps,
    rippleDelete: item.rippleDelete,
    loopPlayback: item.loopPlayback,
  }
}

export function buildProjectSettingsPresetExportFilename(label = 'project-settings-presets'): string {
  return `${sanitizeFileBase(label)}.fable-project-preset.json`
}

export function serializeExportedProjectSettingsPresetFile(payload: ExportedProjectSettingsPresetFile): string {
  return JSON.stringify(payload, null, 2)
}

export async function parseProjectSettingsPresetFileText(text: string): Promise<ExportedProjectSettingsPresetItem[]> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON の読み込みに失敗しました')
  }
  return parseExportedProjectSettingsPresetFile(raw)
}
