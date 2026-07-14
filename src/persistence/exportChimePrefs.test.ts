import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadExportCompletionChimeEnabled,
  saveExportCompletionChimeEnabled,
  getExportCompletionChimeHint,
  getExportCompletionChimeLabel,
} from './exportChimePrefs'

describe('exportChimePrefs', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return store[key] ?? null
      },
      setItem(key: string, value: string) {
        store[key] = value
      },
      removeItem(key: string) {
        delete store[key]
      },
    })
  })

  it('未設定時は false', () => {
    expect(loadExportCompletionChimeEnabled()).toBe(false)
  })

  it('保存した値を読み戻せる', () => {
    saveExportCompletionChimeEnabled(true)
    expect(loadExportCompletionChimeEnabled()).toBe(true)
  })

  it('ラベルとヒントを返す', () => {
    expect(getExportCompletionChimeLabel()).toContain('チャイム')
    expect(getExportCompletionChimeHint()).toContain('ミュート')
  })
})
