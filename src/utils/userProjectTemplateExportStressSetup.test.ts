import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildUserProjectTemplateExportStressPayload,
  seedUserProjectTemplateExportStress,
} from './userProjectTemplateExportStressSetup'
import { parseExportedUserProjectTemplate } from './userProjectTemplateExport'
import { importUserProjectTemplateFromText, loadUserProjectTemplates, replaceUserProjectTemplates } from '../persistence/userProjectTemplates'
import { useProjectStore } from '../store/projectStore'
import { USER_PROJECT_TEMPLATE_SCHEMA_VERSION } from '../types/userProjectTemplate'

describe('userProjectTemplateExportStressSetup', () => {
  const store: Record<string, string> = {}

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key])
      },
    })
    useProjectStore.getState().resetProject()
  })

  it('seedUserProjectTemplateExportStress は schemaVersion 付き JSON を返す', () => {
    const stats = seedUserProjectTemplateExportStress()
    const parsed = parseExportedUserProjectTemplate(JSON.parse(stats.exportJson))
    expect(parsed.schemaVersion).toBe(USER_PROJECT_TEMPLATE_SCHEMA_VERSION)
    expect(parsed.clipEntries).toHaveLength(stats.clipCount)
    expect(stats.exportFilename).toContain('.fable-template.json')
  })

  it('エクスポート JSON を再インポートすると clip/marker 件数が維持される', () => {
    const stats = buildUserProjectTemplateExportStressPayload()
    replaceUserProjectTemplates([])
    const imported = importUserProjectTemplateFromText(stats.exportJson, [])
    expect(imported.clipEntries).toHaveLength(stats.clipCount)
    expect(imported.markers).toHaveLength(stats.markerCount)
    expect(loadUserProjectTemplates()).toHaveLength(1)
  })
})
