import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR } from '../types/project'
import { buildUserColorLookPreset, formatColorLookPresetSummary } from './colorLookPresetUtils'
import {
  buildColorLookPresetExportFilename,
  buildExportedColorLookPresetFile,
  colorLookPresetFromImportedItem,
  parseExportedColorLookPresetFile,
} from './colorLookPresetFile'

describe('colorLookPresetUtils', () => {
  it('buildUserColorLookPreset が名前必須', () => {
    expect(() => buildUserColorLookPreset('  ', DEFAULT_COLOR)).toThrow('プリセット名')
  })

  it('formatColorLookPresetSummary が主要項目を要約する', () => {
    const summary = formatColorLookPresetSummary({
      ...DEFAULT_COLOR,
      brightness: 0.1,
      saturation: 0.2,
    })
    expect(summary).toContain('明るさ')
    expect(summary).toContain('彩度')
  })
})

describe('colorLookPresetFile', () => {
  const sampleColor = {
    ...DEFAULT_COLOR,
    brightness: 0.08,
    contrast: 0.15,
    saturation: -0.2,
  }

  it('エクスポートとパースが往復できる', () => {
    const preset = buildUserColorLookPreset('フィルム風カスタム', sampleColor, 'テスト用')
    const file = buildExportedColorLookPresetFile([preset])
    const items = parseExportedColorLookPresetFile(file)
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('フィルム風カスタム')
    expect(items[0].color.brightness).toBeCloseTo(0.08)
  })

  it('インポート時に名前の重複を解決する', () => {
    const item = { name: 'My Look', color: sampleColor }
    const first = colorLookPresetFromImportedItem(item, [])
    const second = colorLookPresetFromImportedItem(item, [first.name])
    expect(second.name).toBe('My Look (インポート)')
  })

  it('エクスポートファイル名を生成する', () => {
    expect(buildColorLookPresetExportFilename('MyLook')).toBe('MyLook.fable-color-look-preset.json')
  })
})
