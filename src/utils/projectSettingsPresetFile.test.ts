import { describe, expect, it } from 'vitest'
import { buildProjectSettingsPreset } from './projectSettingsPresetUtils'
import {
  buildExportedProjectSettingsPresetFile,
  buildProjectSettingsPresetExportFilename,
  parseProjectSettingsPresetFileText,
  projectSettingsPresetFromImportedItem,
  resolveImportedProjectSettingsPresetName,
  serializeExportedProjectSettingsPresetFile,
} from './projectSettingsPresetFile'

const sampleSettings = {
  width: 1080,
  height: 1920,
  fps: 24,
  rippleDelete: true,
  loopPlayback: false,
}

describe('projectSettingsPresetFile', () => {
  it('エクスポートとパースが往復できる', async () => {
    const preset = buildProjectSettingsPreset('縦型婚礼', sampleSettings)
    const json = serializeExportedProjectSettingsPresetFile(buildExportedProjectSettingsPresetFile([preset]))
    const items = await parseProjectSettingsPresetFileText(json)
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('縦型婚礼')
    expect(items[0].width).toBe(1080)
    expect(items[0].height).toBe(1920)
    expect(items[0].fps).toBe(24)
  })

  it('インポート時に名前の重複を解決する', () => {
    expect(resolveImportedProjectSettingsPresetName('縦型婚礼', ['縦型婚礼'])).toBe('縦型婚礼 (インポート)')
    expect(resolveImportedProjectSettingsPresetName('縦型婚礼', ['縦型婚礼', '縦型婚礼 (インポート)'])).toBe('縦型婚礼 (インポート 2)')
  })

  it('インポート項目から新しい id を付与する', () => {
    const imported = projectSettingsPresetFromImportedItem(
      {
        name: '正方形',
        width: 1080,
        height: 1080,
        fps: 30,
        rippleDelete: false,
        loopPlayback: true,
      },
      [],
    )
    expect(imported.id).toBeTruthy()
    expect(imported.loopPlayback).toBe(true)
  })

  it('ファイル名を生成する', () => {
    expect(buildProjectSettingsPresetExportFilename('縦型婚礼')).toBe('縦型婚礼.fable-project-preset.json')
  })

  it('不正な schemaVersion を拒否する', async () => {
    await expect(parseProjectSettingsPresetFileText(JSON.stringify({ schemaVersion: 99, presets: [] }))).rejects.toThrow('バージョン')
  })

  it('不正な解像度を拒否する', async () => {
    const json = serializeExportedProjectSettingsPresetFile({
      schemaVersion: 1,
      presets: [{ name: 'bad', width: 10, height: 1080, fps: 30, rippleDelete: false, loopPlayback: false }],
    })
    await expect(parseProjectSettingsPresetFileText(json)).rejects.toThrow('解像度')
  })
})
