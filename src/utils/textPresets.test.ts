import { describe, expect, it } from 'vitest'
import { TEXT_PRESETS, TEXT_PRESET_CATEGORY_LABELS } from '../types/project'

describe('TEXT_PRESETS', () => {
  it('プリセット数が 20 種', () => {
    expect(TEXT_PRESETS).toHaveLength(20)
  })

  it('id が一意', () => {
    const ids = TEXT_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('各プリセットに必須フィールドがある', () => {
    for (const preset of TEXT_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0)
      expect(preset.text.content?.length).toBeGreaterThan(0)
      expect(preset.duration).toBeGreaterThan(0)
      if (preset.category) {
        expect(TEXT_PRESET_CATEGORY_LABELS[preset.category]).toBeDefined()
      }
    }
  })

  it('ロワーサードが 7 種', () => {
    const lowerThirds = TEXT_PRESETS.filter((p) => p.category === 'lowerThird')
    expect(lowerThirds).toHaveLength(7)
    expect(lowerThirds.map((p) => p.id)).toEqual([
      'lower-third-names',
      'lower-third-date',
      'lower-third-role',
      'lower-third-speech',
      'lower-third-parents',
      'lower-third-hashtag',
      'motion-lower-slide',
    ])
  })

  it('テロップが 8 種', () => {
    expect(TEXT_PRESETS.filter((p) => p.category === 'subtitle')).toHaveLength(8)
  })

  it('MG プリセットが 4 種', () => {
    const mg = TEXT_PRESETS.filter((p) => p.animation?.type?.startsWith('motion'))
    expect(mg).toHaveLength(4)
  })
})
