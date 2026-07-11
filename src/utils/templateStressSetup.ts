import { PROJECT_TEMPLATES, type ProjectTemplate } from '../types/project'
import { USER_PROJECT_TEMPLATE_SCHEMA_VERSION } from '../types/userProjectTemplate'
import {
  importUserProjectTemplateFromText,
  loadUserProjectTemplates,
  replaceUserProjectTemplates,
} from '../persistence/userProjectTemplates'
import {
  buildExportedUserProjectTemplate,
  serializeExportedUserProjectTemplate,
} from './userProjectTemplateExport'
import { buildUserProjectTemplate } from './userProjectTemplate'
import {
  STRUCTURED_WEDDING_TOTAL_CLIP_COUNT,
  getStructuredWeddingTemplateStressStats,
} from './structuredWeddingTemplateStressSetup'
import { filterChapterMarkers } from './beatMarkers'
import { useProjectStore } from '../store/projectStore'

export const BUILTIN_WEDDING_TEMPLATE_COUNT = 4
export const BUILTIN_WEDDING_TEMPLATE_IDS = [
  'opening-movie',
  'profile-movie',
  'ending-movie',
  'structured-wedding',
] as const

export const TEMPLATE_STRESS_USER_LABEL = 'ストレステンプレ統合検証'
export const TEMPLATE_STRESS_OPENING_CLIP_COUNT = 1
export const TEMPLATE_STRESS_PROFILE_CLIP_COUNT = 1
export const TEMPLATE_STRESS_ENDING_CLIP_COUNT = 2

export interface TemplateStressStats {
  builtinTemplateCount: number
  builtinTemplateIds: string[]
  openingClipCount: number
  profileClipCount: number
  endingClipCount: number
  structuredClipCount: number
  structuredMarkerCount: number
  userTemplateId: string
  userTemplateLabel: string
  userClipCount: number
  exportJson: string
  exportSchemaVersion: number
  savedCount: number
}

function findBuiltinTemplate(templateId: string): ProjectTemplate {
  const template = PROJECT_TEMPLATES.find((t) => t.id === templateId)
  if (!template) throw new Error(`builtin template missing: ${templateId}`)
  return template
}

function measureBuiltinClipCount(templateId: string): number {
  useProjectStore.getState().resetProject()
  useProjectStore.getState().applyTemplate(findBuiltinTemplate(templateId))
  return useProjectStore.getState().project.tracks.flatMap((t) => t.clips).length
}

export function listBuiltinTemplateIds(): string[] {
  return PROJECT_TEMPLATES.map((t) => t.id)
}

export function applyBuiltinTemplateById(templateId: string): number {
  useProjectStore.getState().resetProject()
  useProjectStore.getState().applyTemplate(findBuiltinTemplate(templateId))
  return useProjectStore.getState().project.tracks.flatMap((t) => t.clips).length
}

export function getProjectClipCountFromStore(): number {
  return useProjectStore.getState().project.tracks.flatMap((t) => t.clips).length
}

export function getChapterMarkerCountFromStore(): number {
  return filterChapterMarkers(useProjectStore.getState().project.markers ?? []).length
}

export function applyUserTemplateById(templateId: string): boolean {
  const template = loadUserProjectTemplates().find((t) => t.id === templateId)
  if (!template) return false
  useProjectStore.getState().applyUserProjectTemplate(template)
  return true
}

export function clearTemplateStressStorage(): void {
  replaceUserProjectTemplates([])
}

export function importTemplateStressJson(json: string): string {
  return importUserProjectTemplateFromText(json).label
}

export function tryImportTemplateStressJson(
  json: string,
): { ok: true; label: string } | { ok: false; error: string } {
  try {
    return { ok: true, label: importTemplateStressJson(json) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function seedTemplateStress(): TemplateStressStats {
  const builtinTemplateIds = listBuiltinTemplateIds()
  if (builtinTemplateIds.length !== BUILTIN_WEDDING_TEMPLATE_COUNT) {
    throw new Error(`expected ${BUILTIN_WEDDING_TEMPLATE_COUNT} builtin templates`)
  }

  const openingClipCount = measureBuiltinClipCount('opening-movie')
  const profileClipCount = measureBuiltinClipCount('profile-movie')
  const endingClipCount = measureBuiltinClipCount('ending-movie')

  const store = useProjectStore.getState()
  store.resetProject()
  store.applyTemplate(findBuiltinTemplate('structured-wedding'))
  const structuredStats = getStructuredWeddingTemplateStressStats()

  const userTemplate = buildUserProjectTemplate(
    useProjectStore.getState().project,
    TEMPLATE_STRESS_USER_LABEL,
    'テンプレート統合ストレス検証',
  )
  replaceUserProjectTemplates([userTemplate])
  const exportJson = serializeExportedUserProjectTemplate(buildExportedUserProjectTemplate(userTemplate))

  const stats: TemplateStressStats = {
    builtinTemplateCount: builtinTemplateIds.length,
    builtinTemplateIds,
    openingClipCount,
    profileClipCount,
    endingClipCount,
    structuredClipCount: structuredStats.totalClipCount,
    structuredMarkerCount: structuredStats.markerCount,
    userTemplateId: userTemplate.id,
    userTemplateLabel: userTemplate.label,
    userClipCount: userTemplate.clipEntries.length,
    exportJson,
    exportSchemaVersion: USER_PROJECT_TEMPLATE_SCHEMA_VERSION,
    savedCount: loadUserProjectTemplates().length,
  }

  if (stats.openingClipCount !== TEMPLATE_STRESS_OPENING_CLIP_COUNT) {
    throw new Error(`opening clip count mismatch: ${stats.openingClipCount}`)
  }
  if (stats.structuredClipCount !== STRUCTURED_WEDDING_TOTAL_CLIP_COUNT) {
    throw new Error(`structured clip count mismatch: ${stats.structuredClipCount}`)
  }
  if (stats.savedCount !== 1) {
    throw new Error(`expected 1 saved template, got ${stats.savedCount}`)
  }

  return stats
}
