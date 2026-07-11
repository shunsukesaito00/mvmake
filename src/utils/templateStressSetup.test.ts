import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  BUILTIN_WEDDING_TEMPLATE_COUNT,
  TEMPLATE_STRESS_ENDING_CLIP_COUNT,
  TEMPLATE_STRESS_OPENING_CLIP_COUNT,
  TEMPLATE_STRESS_PROFILE_CLIP_COUNT,
  TEMPLATE_STRESS_USER_LABEL,
  applyBuiltinTemplateById,
  applyUserTemplateById,
  clearTemplateStressStorage,
  getChapterMarkerCountFromStore,
  getProjectClipCountFromStore,
  importTemplateStressJson,
  listBuiltinTemplateIds,
  seedTemplateStress,
  tryImportTemplateStressJson,
} from './templateStressSetup'
import { loadUserProjectTemplates } from '../persistence/userProjectTemplates'
import { useProjectStore } from '../store/projectStore'

describe('templateStressSetup', () => {
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
    clearTemplateStressStorage()
  })

  it('組み込みウェディングテンプレートが4種ある', () => {
    const ids = listBuiltinTemplateIds()
    expect(ids).toHaveLength(BUILTIN_WEDDING_TEMPLATE_COUNT)
    expect(ids).toContain('structured-wedding')
  })

  it('組み込み3種のクリップ数が期待どおり', () => {
    expect(applyBuiltinTemplateById('opening-movie')).toBe(TEMPLATE_STRESS_OPENING_CLIP_COUNT)
    expect(applyBuiltinTemplateById('profile-movie')).toBe(TEMPLATE_STRESS_PROFILE_CLIP_COUNT)
    expect(applyBuiltinTemplateById('ending-movie')).toBe(TEMPLATE_STRESS_ENDING_CLIP_COUNT)
  })

  it('seedTemplateStress は構造化11クリップ・ユーザー保存・JSONを生成する', () => {
    const stats = seedTemplateStress()
    expect(stats.builtinTemplateCount).toBe(4)
    expect(stats.structuredClipCount).toBe(11)
    expect(stats.structuredMarkerCount).toBe(5)
    expect(stats.userTemplateLabel).toBe(TEMPLATE_STRESS_USER_LABEL)
    expect(stats.exportSchemaVersion).toBeGreaterThanOrEqual(1)
    expect(JSON.parse(stats.exportJson).label).toBe(TEMPLATE_STRESS_USER_LABEL)
    expect(getProjectClipCountFromStore()).toBe(11)
    expect(getChapterMarkerCountFromStore()).toBe(5)
  })

  it('JSON 往復インポートでユーザーテンプレートを復元できる', () => {
    const stats = seedTemplateStress()
    clearTemplateStressStorage()
    expect(loadUserProjectTemplates()).toHaveLength(0)

    const label = importTemplateStressJson(stats.exportJson)
    expect(label).toBe(TEMPLATE_STRESS_USER_LABEL)
    expect(loadUserProjectTemplates()).toHaveLength(1)
  })

  it('ユーザー適用と undo でクリップ数が復元される', () => {
    const stats = seedTemplateStress()
    useProjectStore.getState().resetProject()
    expect(getProjectClipCountFromStore()).toBe(0)

    expect(applyUserTemplateById(stats.userTemplateId)).toBe(true)
    expect(getProjectClipCountFromStore()).toBe(stats.userClipCount)

    useProjectStore.getState().undo()
    expect(getProjectClipCountFromStore()).toBe(0)
  })

  it('破損 JSON はエラーを返す', () => {
    const result = tryImportTemplateStressJson('{broken')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('JSON')
    }
  })
})
