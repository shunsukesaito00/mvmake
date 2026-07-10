import { describe, expect, it } from 'vitest'
import { buildExportPreset } from './exportPresetUtils'
import {
  buildExportedExportPresetFile,
  buildExportPresetExportFilename,
  exportPresetFromImportedItem,
  parseExportPresetFileText,
  resolveImportedExportPresetName,
  serializeExportedExportPresetFile,
} from './exportPresetFile'

describe('exportPresetFile', () => {
  it('エクスポートとパースが往復できる', async () => {
    const preset = buildExportPreset('SNS用', 'light', '720p', null, null)
    const json = serializeExportedExportPresetFile(buildExportedExportPresetFile([preset]))
    const items = await parseExportPresetFileText(json)
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('SNS用')
    expect(items[0].quality).toBe('light')
  })

  it('インポート時に名前の重複を解決する', () => {
    expect(resolveImportedExportPresetName('SNS用', ['SNS用'])).toBe('SNS用 (インポート)')
    expect(resolveImportedExportPresetName('SNS用', ['SNS用', 'SNS用 (インポート)'])).toBe('SNS用 (インポート 2)')
  })

  it('インポート項目から新しい id を付与する', () => {
    const imported = exportPresetFromImportedItem(
      {
        name: 'ハイライト',
        quality: 'high',
        resolution: 'project',
        useInOut: true,
        inPoint: 1,
        outPoint: 8,
      },
      [],
    )
    expect(imported.id).toBeTruthy()
    expect(imported.useInOut).toBe(true)
    expect(imported.inPoint).toBe(1)
  })

  it('ファイル名を生成する', () => {
    expect(buildExportPresetExportFilename('SNS用')).toBe('SNS用.fable-export-preset.json')
  })

  it('不正な schemaVersion を拒否する', async () => {
    await expect(parseExportPresetFileText(JSON.stringify({ schemaVersion: 99, presets: [] }))).rejects.toThrow('バージョン')
  })
})
