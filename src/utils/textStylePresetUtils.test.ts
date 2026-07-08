import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  applyTextStylePreset,
  buildSavedTextStylePreset,
  extractTextStyleFields,
  formatTextStylePresetSummary,
} from './textStylePresetUtils'
import {
  deleteTextStylePreset,
  loadTextStylePresets,
  replaceTextStylePresets,
  saveTextStylePreset,
} from '../persistence/textStylePresets'
import type { TextStyle } from '../types/project'

const sampleText: TextStyle = {
  content: 'Hello',
  fontFamily: 'Noto Serif JP',
  fontSize: 64,
  color: '#ff0000',
  strokeColor: '#000000',
  strokeWidth: 2,
  shadowColor: 'rgba(0,0,0,0.5)',
  shadowBlur: 8,
  textAlign: 'center',
  lineHeight: 1.6,
  verticalAlign: 'top',
  backgroundColor: '#00000080',
  backgroundPadding: 12,
  backgroundRadius: 4,
}

describe('textStylePresetUtils', () => {
  it('extractTextStyleFields は content を除く', () => {
    const fields = extractTextStyleFields(sampleText)
    expect(fields).not.toHaveProperty('content')
    expect(fields.fontSize).toBe(64)
    expect(fields.lineHeight).toBe(1.6)
  })

  it('buildSavedTextStylePreset で名前付きスタイルを作成する', () => {
    const preset = buildSavedTextStylePreset('見出し', sampleText)
    expect(preset.name).toBe('見出し')
    expect(preset.style.fontFamily).toBe('Noto Serif JP')
    expect(preset.style.fontSize).toBe(64)
  })

  it('空名は拒否する', () => {
    expect(() => buildSavedTextStylePreset('  ', sampleText)).toThrow('スタイル名')
  })

  it('applyTextStylePreset は content を保持する', () => {
    const preset = buildSavedTextStylePreset('見出し', sampleText)
    const next = applyTextStylePreset({ ...sampleText, content: '乾杯' }, preset.style)
    expect(next.content).toBe('乾杯')
    expect(next.fontSize).toBe(64)
    expect(next.lineHeight).toBe(1.6)
  })

  it('formatTextStylePresetSummary に主要属性を含める', () => {
    const preset = buildSavedTextStylePreset('見出し', sampleText)
    const summary = formatTextStylePresetSummary(preset)
    expect(summary).toContain('Noto Serif JP')
    expect(summary).toContain('64px')
    expect(summary).toContain('行間 1.6倍')
  })
})

describe('textStylePresets persistence', () => {
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
    expect(loadTextStylePresets()).toEqual([])
    const preset = buildSavedTextStylePreset('テスト', sampleText)
    saveTextStylePreset(preset)
    expect(loadTextStylePresets()).toHaveLength(1)
    expect(loadTextStylePresets()[0].name).toBe('テスト')

    deleteTextStylePreset(preset.id)
    expect(loadTextStylePresets()).toEqual([])
  })

  it('replaceTextStylePresets で一覧を置き換える', () => {
    const a = buildSavedTextStylePreset('A', sampleText)
    replaceTextStylePresets([a])
    expect(loadTextStylePresets()).toHaveLength(1)
  })

  it('欠損フィールドを正規化する', () => {
    store['fable-text-style-presets'] = JSON.stringify([
      {
        id: 'legacy',
        name: '旧',
        style: { fontSize: 40, color: '#fff' },
      },
    ])
    const loaded = loadTextStylePresets()[0]
    expect(loaded.style.fontFamily).toBe('Noto Sans JP')
    expect(loaded.style.lineHeight).toBe(1.2)
  })
})
