import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  clearTextStylePresetStress,
  seedTextStylePresetStress,
  TEXT_STYLE_PRESET_STRESS_COUNT,
} from './textStylePresetStressSetup'
import { loadTextStylePresets } from '../persistence/textStylePresets'

describe('textStylePresetStressSetup', () => {
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
  })

  it('seedTextStylePresetStress で既定件数を投入する', () => {
    const stats = seedTextStylePresetStress()
    expect(stats.presetCount).toBe(TEXT_STYLE_PRESET_STRESS_COUNT)
    expect(loadTextStylePresets()).toHaveLength(TEXT_STYLE_PRESET_STRESS_COUNT)
    expect(stats.names[0]).toBe('スタイル1')
  })

  it('clearTextStylePresetStress で一覧を空にする', () => {
    seedTextStylePresetStress(3)
    clearTextStylePresetStress()
    expect(loadTextStylePresets()).toEqual([])
  })
})
