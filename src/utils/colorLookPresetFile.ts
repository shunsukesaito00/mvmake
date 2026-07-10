import type { ColorAdjustments } from '../types/project'
import { normalizeColorAdjustments } from '../types/project'
import type {
  ExportedColorLookPresetFile,
  ExportedColorLookPresetItem,
  UserColorLookPreset,
} from '../types/colorLookPreset'
import { COLOR_LOOK_PRESET_FILE_SCHEMA_VERSION } from '../types/colorLookPreset'
import { createId } from './id'
import { sanitizeFileBase } from './chapterBatchExport'

function isValidAdjustmentValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -1 && value <= 1
}

function parseColorAdjustments(raw: unknown): ColorAdjustments {
  if (!raw || typeof raw !== 'object') {
    throw new Error('色調データの形式が不正です')
  }
  const item = raw as Partial<ColorAdjustments>
  for (const field of ['brightness', 'contrast', 'saturation', 'hue', 'temperature', 'tint', 'shadows', 'midtones', 'highlights'] as const) {
    if (item[field] != null && !isValidAdjustmentValue(item[field])) {
      throw new Error(`色調「${field}」の値が不正です`)
    }
  }
  return normalizeColorAdjustments(item)
}

export function buildExportedColorLookPresetFile(
  presets: UserColorLookPreset[],
): ExportedColorLookPresetFile {
  return {
    schemaVersion: COLOR_LOOK_PRESET_FILE_SCHEMA_VERSION,
    presets: presets.map(colorLookPresetToFileItem),
  }
}

export function colorLookPresetToFileItem(preset: UserColorLookPreset): ExportedColorLookPresetItem {
  return {
    name: preset.name,
    description: preset.description || undefined,
    color: normalizeColorAdjustments(preset.color),
  }
}

export function parseExportedColorLookPresetFile(raw: unknown): ExportedColorLookPresetItem[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('プリセットファイルの形式が不正です')
  }

  const data = raw as Partial<ExportedColorLookPresetFile>
  if (data.schemaVersion !== COLOR_LOOK_PRESET_FILE_SCHEMA_VERSION) {
    throw new Error('このプリセットファイルは対応していないバージョンです')
  }
  if (!Array.isArray(data.presets) || data.presets.length === 0) {
    throw new Error('プリセットが含まれていません')
  }

  return data.presets.map(parseExportedColorLookPresetItem)
}

function parseExportedColorLookPresetItem(raw: unknown): ExportedColorLookPresetItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('プリセットの形式が不正です')
  }

  const item = raw as Partial<ExportedColorLookPresetItem>
  if (!item.name?.trim()) {
    throw new Error('プリセット名がありません')
  }

  return {
    name: item.name.trim(),
    description: item.description?.trim() || undefined,
    color: parseColorAdjustments(item.color),
  }
}

export function resolveImportedColorLookPresetName(name: string, existingNames: Iterable<string>): string {
  const taken = new Set(existingNames)
  if (!taken.has(name)) return name

  const suffix = `${name} (インポート)`
  if (!taken.has(suffix)) return suffix

  let n = 2
  while (taken.has(`${name} (インポート ${n})`)) n++
  return `${name} (インポート ${n})`
}

export function colorLookPresetFromImportedItem(
  item: ExportedColorLookPresetItem,
  existingNames: Iterable<string>,
): UserColorLookPreset {
  return {
    id: createId(),
    name: resolveImportedColorLookPresetName(item.name, existingNames),
    description: item.description ?? '',
    color: normalizeColorAdjustments(item.color),
  }
}

export function buildColorLookPresetExportFilename(label = 'color-look-presets'): string {
  return `${sanitizeFileBase(label)}.fable-color-look-preset.json`
}

export function serializeExportedColorLookPresetFile(payload: ExportedColorLookPresetFile): string {
  return JSON.stringify(payload, null, 2)
}

export async function parseColorLookPresetFileText(text: string): Promise<ExportedColorLookPresetItem[]> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON の読み込みに失敗しました')
  }
  return parseExportedColorLookPresetFile(raw)
}
