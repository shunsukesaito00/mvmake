import type {
  ExportPreset,
  ExportedExportPresetFile,
  ExportedExportPresetItem,
} from '../types/exportPreset'
import { EXPORT_PRESET_FILE_SCHEMA_VERSION } from '../types/exportPreset'
import type { ExportQuality } from '../engine/exporter'
import { createId } from './id'
import { sanitizeFileBase } from './chapterBatchExport'
import { normalizeExportResolution } from './exportResolution'

const VALID_QUALITIES = new Set<ExportQuality>(['light', 'standard', 'high'])

export function buildExportedExportPresetFile(presets: ExportPreset[]): ExportedExportPresetFile {
  return {
    schemaVersion: EXPORT_PRESET_FILE_SCHEMA_VERSION,
    presets: presets.map(exportPresetToFileItem),
  }
}

export function exportPresetToFileItem(preset: ExportPreset): ExportedExportPresetItem {
  return {
    name: preset.name,
    quality: preset.quality,
    resolution: preset.resolution,
    useInOut: preset.useInOut,
    inPoint: preset.inPoint,
    outPoint: preset.outPoint,
  }
}

export function parseExportedExportPresetFile(raw: unknown): ExportedExportPresetItem[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('プリセットファイルの形式が不正です')
  }

  const data = raw as Partial<ExportedExportPresetFile>
  if (data.schemaVersion !== EXPORT_PRESET_FILE_SCHEMA_VERSION) {
    throw new Error('このプリセットファイルは対応していないバージョンです')
  }
  if (!Array.isArray(data.presets) || data.presets.length === 0) {
    throw new Error('プリセットが含まれていません')
  }

  return data.presets.map(parseExportedExportPresetItem)
}

function parseExportedExportPresetItem(raw: unknown): ExportedExportPresetItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('プリセットの形式が不正です')
  }

  const item = raw as Partial<ExportedExportPresetItem>
  if (!item.name?.trim()) {
    throw new Error('プリセット名がありません')
  }
  if (!item.quality || !VALID_QUALITIES.has(item.quality)) {
    throw new Error('書き出し品質の値が不正です')
  }

  return {
    name: item.name.trim(),
    quality: item.quality,
    resolution: normalizeExportResolution(item.resolution ?? 'project'),
    useInOut: Boolean(item.useInOut),
    inPoint: item.useInOut ? (item.inPoint ?? null) : null,
    outPoint: item.useInOut ? (item.outPoint ?? null) : null,
  }
}

export function resolveImportedExportPresetName(name: string, existingNames: Iterable<string>): string {
  const taken = new Set(existingNames)
  if (!taken.has(name)) return name

  const suffix = `${name} (インポート)`
  if (!taken.has(suffix)) return suffix

  let n = 2
  while (taken.has(`${name} (インポート ${n})`)) n++
  return `${name} (インポート ${n})`
}

export function exportPresetFromImportedItem(
  item: ExportedExportPresetItem,
  existingNames: Iterable<string>,
): ExportPreset {
  return {
    id: createId(),
    name: resolveImportedExportPresetName(item.name, existingNames),
    quality: item.quality,
    resolution: normalizeExportResolution(item.resolution),
    useInOut: item.useInOut,
    inPoint: item.inPoint,
    outPoint: item.outPoint,
  }
}

export function buildExportPresetExportFilename(label = 'export-presets'): string {
  return `${sanitizeFileBase(label)}.fable-export-preset.json`
}

export function serializeExportedExportPresetFile(payload: ExportedExportPresetFile): string {
  return JSON.stringify(payload, null, 2)
}

export async function parseExportPresetFileText(text: string): Promise<ExportedExportPresetItem[]> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON の読み込みに失敗しました')
  }
  return parseExportedExportPresetFile(raw)
}
