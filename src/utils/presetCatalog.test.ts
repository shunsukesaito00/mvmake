import { describe, expect, it } from 'vitest'
import { TEXT_PRESETS } from '../types/project'
import { COLOR_LOOK_PRESETS } from './colorLooks'
import { TRANSITION_DEFINITIONS } from './transitions'
import {
  filterCatalogItems,
  getTextPresetCatalogCategory,
  isMotionTextPreset,
} from './presetCatalog'

describe('presetCatalog', () => {
  it('テキスト MG を motion カテゴリとして扱う', () => {
    const mg = TEXT_PRESETS.find((p) => p.animation?.type?.startsWith('motion'))
    expect(mg).toBeTruthy()
    expect(isMotionTextPreset(mg!)).toBe(true)
    expect(getTextPresetCatalogCategory(mg!)).toBe('motion')
  })

  it('よく使うフィルタでお気に入りのみ返す', () => {
    const opening = TEXT_PRESETS.find((p) => p.id === 'opening')!
    const filtered = filterCatalogItems(
      TEXT_PRESETS,
      'favorites',
      (p) => p.id,
      getTextPresetCatalogCategory,
      [opening.id],
    )
    expect(filtered).toEqual([opening])
  })

  it('ルック・トランジション全件に category がある', () => {
    for (const preset of COLOR_LOOK_PRESETS) {
      expect(preset.category.length).toBeGreaterThan(0)
    }
    for (const def of TRANSITION_DEFINITIONS) {
      expect(def.category.length).toBeGreaterThan(0)
    }
  })
})
