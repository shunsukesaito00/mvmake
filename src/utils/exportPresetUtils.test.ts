import { describe, expect, it, beforeEach, vi } from 'vitest'
import { buildExportPreset, formatExportPresetSummary } from './exportPresetUtils'
import {
  deleteExportPreset,
  loadExportPresets,
  replaceExportPresets,
  saveExportPreset,
} from '../persistence/exportPresets'

describe('buildExportPreset', () => {
  it('名前・品質・解像度を保存する', () => {
    const preset = buildExportPreset('SNS用', 'light', '720p', null, null)
    expect(preset.name).toBe('SNS用')
    expect(preset.quality).toBe('light')
    expect(preset.resolution).toBe('720p')
    expect(preset.useInOut).toBe(false)
  })

  it('In/Out があれば useInOut を true にする', () => {
    const preset = buildExportPreset('ハイライト', 'standard', '1080p', 2, 10)
    expect(preset.useInOut).toBe(true)
    expect(preset.inPoint).toBe(2)
    expect(preset.outPoint).toBe(10)
  })

  it('空名は拒否する', () => {
    expect(() => buildExportPreset('  ', 'standard', '1080p', null, null)).toThrow('プリセット名')
  })
})

describe('formatExportPresetSummary', () => {
  it('In/Out 範囲を要約に含める', () => {
    const preset = buildExportPreset('範囲', 'high', '1080p', 1.5, 8)
    expect(formatExportPresetSummary(preset, '高品質')).toContain('In/Out')
    expect(formatExportPresetSummary(preset, '高品質')).toContain('1080p')
  })
})

describe('exportPresets persistence', () => {
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

  it('保存・読み込み・削除できる', () => {
    expect(loadExportPresets()).toEqual([])
    const preset = buildExportPreset('テスト', 'standard', '1080p', null, null)
    saveExportPreset(preset)
    expect(loadExportPresets()).toHaveLength(1)
    expect(loadExportPresets()[0].name).toBe('テスト')

    deleteExportPreset(preset.id)
    expect(loadExportPresets()).toEqual([])
  })

  it('replaceExportPresets で一覧を置き換える', () => {
    const a = buildExportPreset('A', 'light', '720p', null, null)
    replaceExportPresets([a])
    expect(loadExportPresets()).toHaveLength(1)
  })
})
