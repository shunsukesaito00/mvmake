import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clearUserProjectTemplateStress,
  seedUserProjectTemplateStress,
  USER_PROJECT_TEMPLATE_STRESS_LABEL,
} from './userProjectTemplateStressSetup'
import { loadUserProjectTemplates } from '../persistence/userProjectTemplates'
import { useProjectStore } from '../store/projectStore'

describe('userProjectTemplateStressSetup', () => {
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
    clearUserProjectTemplateStress()
  })

  it('seedUserProjectTemplateStress は構造化ウェディング構成を localStorage に保存する', () => {
    const stats = seedUserProjectTemplateStress()
    expect(stats.templateLabel).toBe(USER_PROJECT_TEMPLATE_STRESS_LABEL)
    expect(stats.clipCount).toBeGreaterThan(0)
    expect(stats.markerCount).toBe(5)
    expect(stats.savedCount).toBe(1)
    expect(loadUserProjectTemplates()[0]?.id).toBe(stats.templateId)
  })

  it('clearUserProjectTemplateStress で一覧を空にする', () => {
    seedUserProjectTemplateStress()
    clearUserProjectTemplateStress()
    expect(loadUserProjectTemplates()).toEqual([])
  })
})
