import type { UserProjectTemplate } from '../types/userProjectTemplate'

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
