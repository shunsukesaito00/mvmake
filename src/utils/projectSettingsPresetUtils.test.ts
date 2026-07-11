import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildProjectSettingsPreset,
  formatProjectSettingsPresetSummary,
  snapshotFromProjectSettingsPreset,
} from './projectSettingsPresetUtils'
import {
  deleteProjectSettingsPreset,
  loadProjectSettingsPresets,
  replaceProjectSettingsPresets,
  saveProjectSettingsPreset,
  importProjectSettingsPresets,
} from '../persistence/projectSettingsPresets'
import { useProjectStore } from '../store/projectStore'

const sampleSettings = {
  width: 1080,
  height: 1920,
  fps: 24,
  rippleDelete: true,
  loopPlayback: false,
}

describe('projectSettingsPresetUtils', () => {
  it('buildProjectSettingsPreset で名前付き設定を作成する', () => {
    const preset = buildProjectSettingsPreset('縦型婚礼', sampleSettings)
    expect(preset.name).toBe('縦型婚礼')
    expect(preset.width).toBe(1080)
    expect(preset.height).toBe(1920)
    expect(preset.fps).toBe(24)
    expect(preset.rippleDelete).toBe(true)
    expect(preset.loopPlayback).toBe(false)
  })

  it('空のプリセット名は拒否する', () => {
    expect(() => buildProjectSettingsPreset('  ', sampleSettings)).toThrow('プリセット名')
  })

  it('formatProjectSettingsPresetSummary に主要項目を含める', () => {
    const preset = buildProjectSettingsPreset('縦型', sampleSettings)
    const summary = formatProjectSettingsPresetSummary(preset)
    expect(summary).toContain('1080×1920')
    expect(summary).toContain('24fps')
    expect(summary).toContain('リップルON')
  })

  it('snapshotFromProjectSettingsPreset は適用用スナップショットを返す', () => {
    const preset = buildProjectSettingsPreset('縦型', sampleSettings)
    expect(snapshotFromProjectSettingsPreset(preset)).toEqual(sampleSettings)
  })
})

describe('projectSettingsPresets persistence', () => {
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

  it('保存・読み込み・削除ができる', () => {
    expect(loadProjectSettingsPresets()).toEqual([])
    const preset = buildProjectSettingsPreset('テスト', sampleSettings)
    saveProjectSettingsPreset(preset)
    expect(loadProjectSettingsPresets()).toHaveLength(1)
    expect(loadProjectSettingsPresets()[0]?.name).toBe('テスト')

    deleteProjectSettingsPreset(preset.id)
    expect(loadProjectSettingsPresets()).toEqual([])
  })

  it('replaceProjectSettingsPresets で一覧を置き換える', () => {
    const preset = buildProjectSettingsPreset('置換', sampleSettings)
    replaceProjectSettingsPresets([preset])
    expect(loadProjectSettingsPresets()).toHaveLength(1)
  })

  it('破損 JSON は空配列として読み込む', () => {
    localStorage.setItem('fable-project-settings-presets', '{bad-json')
    expect(loadProjectSettingsPresets()).toEqual([])
  })

  it('importProjectSettingsPresets で名前重複を回避する', () => {
    const preset = buildProjectSettingsPreset('縦型婚礼', sampleSettings)
    saveProjectSettingsPreset(preset)
    const result = importProjectSettingsPresets([
      {
        name: '縦型婚礼',
        width: 1920,
        height: 1080,
        fps: 30,
        rippleDelete: false,
        loopPlayback: true,
      },
    ])
    expect(result).toHaveLength(2)
    expect(result[1]?.name).toBe('縦型婚礼 (インポート)')
    expect(loadProjectSettingsPresets()).toHaveLength(2)
  })
})

describe('applyProjectSettingsPreset store', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('プリセット適用で解像度と編集設定を更新する', () => {
    const preset = buildProjectSettingsPreset('縦型婚礼', sampleSettings)
    useProjectStore.getState().applyProjectSettingsPreset(preset)

    const state = useProjectStore.getState()
    expect(state.project.width).toBe(1080)
    expect(state.project.height).toBe(1920)
    expect(state.project.fps).toBe(24)
    expect(state.rippleDelete).toBe(true)
    expect(state.loopPlayback).toBe(false)
  })

  it('プリセット適用を undo で復元できる', () => {
    const before = useProjectStore.getState()
    const preset = buildProjectSettingsPreset('縦型婚礼', sampleSettings)
    useProjectStore.getState().applyProjectSettingsPreset(preset)
    useProjectStore.getState().undo()

    const state = useProjectStore.getState()
    expect(state.project.width).toBe(before.project.width)
    expect(state.project.height).toBe(before.project.height)
    expect(state.project.fps).toBe(before.project.fps)
    expect(state.rippleDelete).toBe(before.rippleDelete)
    expect(state.loopPlayback).toBe(before.loopPlayback)
  })
})
