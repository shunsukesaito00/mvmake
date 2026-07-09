import type { UserProjectTemplate } from '../types/userProjectTemplate'
import { downloadBlob } from './projectFile'
import {
  buildExportedUserProjectTemplate,
  buildUserProjectTemplateExportFilename,
  parseExportedUserProjectTemplate,
  serializeExportedUserProjectTemplate,
  userProjectTemplateFromExport,
} from '../utils/userProjectTemplateExport'

const STORAGE_KEY = 'fable-user-project-templates'

function readRaw(): UserProjectTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UserProjectTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(templates: UserProjectTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function loadUserProjectTemplates(): UserProjectTemplate[] {
  return readRaw().sort((a, b) => b.createdAt - a.createdAt)
}

export function saveUserProjectTemplate(template: UserProjectTemplate): UserProjectTemplate[] {
  const next = [template, ...readRaw().filter((t) => t.id !== template.id)]
  writeRaw(next)
  return next
}

export function deleteUserProjectTemplate(id: string): UserProjectTemplate[] {
  const next = readRaw().filter((t) => t.id !== id)
  writeRaw(next)
  return next
}

export function replaceUserProjectTemplates(templates: UserProjectTemplate[]): void {
  writeRaw(templates)
}

export function exportUserProjectTemplateFile(template: UserProjectTemplate): void {
  const payload = buildExportedUserProjectTemplate(template)
  const json = serializeExportedUserProjectTemplate(payload)
  downloadBlob(new Blob([json], { type: 'application/json' }), buildUserProjectTemplateExportFilename(template.label))
}

export function importUserProjectTemplateFromText(
  text: string,
  existing: UserProjectTemplate[] = readRaw(),
): UserProjectTemplate {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('テンプレートファイルの JSON が読み取れません')
  }

  const payload = parseExportedUserProjectTemplate(parsed)
  const template = userProjectTemplateFromExport(
    payload,
    existing.map((t) => t.label),
  )
  saveUserProjectTemplate(template)
  return template
}

export async function importUserProjectTemplateFromFile(file: File): Promise<UserProjectTemplate> {
  const text = await file.text()
  return importUserProjectTemplateFromText(text)
}
