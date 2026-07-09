import type {
  ExportedUserProjectTemplate,
  UserProjectTemplate,
} from '../types/userProjectTemplate'
import { USER_PROJECT_TEMPLATE_SCHEMA_VERSION } from '../types/userProjectTemplate'
import { createId } from './id'
import { sanitizeFileBase } from './chapterBatchExport'

export function buildExportedUserProjectTemplate(
  template: UserProjectTemplate,
): ExportedUserProjectTemplate {
  return {
    schemaVersion: USER_PROJECT_TEMPLATE_SCHEMA_VERSION,
    label: template.label,
    description: template.description,
    width: template.width,
    height: template.height,
    fps: template.fps,
    markers: template.markers,
    clipEntries: template.clipEntries,
  }
}

export function parseExportedUserProjectTemplate(raw: unknown): ExportedUserProjectTemplate {
  if (!raw || typeof raw !== 'object') {
    throw new Error('テンプレートファイルの形式が不正です')
  }

  const data = raw as Partial<ExportedUserProjectTemplate>
  if (data.schemaVersion !== USER_PROJECT_TEMPLATE_SCHEMA_VERSION) {
    throw new Error('このテンプレートファイルは対応していないバージョンです')
  }
  if (!data.label?.trim()) {
    throw new Error('テンプレート名がありません')
  }
  if (!Number.isFinite(data.width) || !Number.isFinite(data.height) || !Number.isFinite(data.fps)) {
    throw new Error('解像度または FPS の値が不正です')
  }
  if (!Array.isArray(data.markers) || !Array.isArray(data.clipEntries)) {
    throw new Error('クリップまたはマーカーのデータが不正です')
  }

  return {
    schemaVersion: USER_PROJECT_TEMPLATE_SCHEMA_VERSION,
    label: data.label.trim(),
    description: typeof data.description === 'string' ? data.description : '',
    width: data.width as number,
    height: data.height as number,
    fps: data.fps as number,
    markers: data.markers,
    clipEntries: data.clipEntries,
  }
}

export function resolveImportedTemplateLabel(label: string, existingLabels: Iterable<string>): string {
  const taken = new Set(existingLabels)
  if (!taken.has(label)) return label

  const suffix = `${label} (インポート)`
  if (!taken.has(suffix)) return suffix

  let n = 2
  while (taken.has(`${label} (インポート ${n})`)) n++
  return `${label} (インポート ${n})`
}

export function userProjectTemplateFromExport(
  payload: ExportedUserProjectTemplate,
  existingLabels: Iterable<string>,
): UserProjectTemplate {
  return {
    id: createId(),
    label: resolveImportedTemplateLabel(payload.label, existingLabels),
    description: payload.description,
    createdAt: Date.now(),
    width: payload.width,
    height: payload.height,
    fps: payload.fps,
    markers: structuredClone(payload.markers),
    clipEntries: structuredClone(payload.clipEntries),
  }
}

export function buildUserProjectTemplateExportFilename(label: string): string {
  return `${sanitizeFileBase(label)}.fable-template.json`
}

export function serializeExportedUserProjectTemplate(payload: ExportedUserProjectTemplate): string {
  return JSON.stringify(payload, null, 2)
}
