import { describe, expect, it } from 'vitest'
import { DEFAULT_COLOR } from '../types/project'
import { buildUserColorLookPreset, formatColorLookPresetSummary, getColorLookPresetSummaryParts } from './colorLookPresetUtils'
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

  it('formatColorLookPresetSummary がトーンカーブを要約する', () => {
    const summary = formatColorLookPresetSummary({
      ...DEFAULT_COLOR,
      midtones: 0.15,
      highlights: -0.1,
    })
    expect(summary).toContain('ミッド')
    expect(summary).toContain('ハイライト')
  })

  it('formatColorLookPresetSummary が RGB カーブの active チャンネルを要約する', () => {
    const summary = formatColorLookPresetSummary({
      ...DEFAULT_COLOR,
      rgbCurves: {
        ...DEFAULT_COLOR.rgbCurves,
        r: DEFAULT_COLOR.rgbCurves.r.map((point) => (
          point.x === 0.5 ? { ...point, y: 0.65 } : { ...point }
        )),
      },
    })
    expect(summary).toContain('RGBカーブ(R)')
  })

  it('getColorLookPresetSummaryParts が複数項目を収集する', () => {
    const parts = getColorLookPresetSummaryParts({
      ...DEFAULT_COLOR,
      midtones: 0.2,
      brightness: 0.1,
      rgbCurves: {
        ...DEFAULT_COLOR.rgbCurves,
        g: DEFAULT_COLOR.rgbCurves.g.map((point) => (
          point.x === 0.75 ? { ...point, y: 0.6 } : { ...point }
        )),
      },
    })
    expect(parts[0]).toContain('RGBカーブ(G)')
    expect(parts.some((part) => part.startsWith('ミッド'))).toBe(true)
    expect(parts.some((part) => part.startsWith('明るさ'))).toBe(true)
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

  it('rgbCurves 付きプリセットが往復できる', () => {
    const colorWithRgb = {
      ...sampleColor,
      rgbCurves: {
        ...DEFAULT_COLOR.rgbCurves,
        r: DEFAULT_COLOR.rgbCurves.r.map((point) => (
          point.x === 0.5 ? { ...point, y: 0.65 } : { ...point }
        )),
      },
    }
    const preset = buildUserColorLookPreset('RGB Look', colorWithRgb)
    const items = parseExportedColorLookPresetFile(buildExportedColorLookPresetFile([preset]))
    expect(items[0].color.rgbCurves.r.find((p) => p.x === 0.5)?.y).toBeCloseTo(0.65)
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
