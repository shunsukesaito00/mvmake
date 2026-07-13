import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getChapterExportContinueOnErrorHint,
  getChapterExportContinueOnErrorLabel,
  loadChapterExportContinueOnError,
  saveChapterExportContinueOnError,
} from './chapterExportPrefs'

describe('chapterExportPrefs', () => {
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
    expect(loadChapterExportContinueOnError()).toBe(false)
  })

  it('保存した値を読み戻せる', () => {
    saveChapterExportContinueOnError(true)
    expect(loadChapterExportContinueOnError()).toBe(true)
    saveChapterExportContinueOnError(false)
    expect(loadChapterExportContinueOnError()).toBe(false)
  })

  it('壊れた JSON は false にフォールバックする', () => {
    localStorage.setItem('fable-chapter-export-continue-on-error', '{bad')
    expect(loadChapterExportContinueOnError()).toBe(false)
  })

  it('ラベルとヒントを返す', () => {
    expect(getChapterExportContinueOnErrorLabel()).toContain('スキップして続行')
    expect(getChapterExportContinueOnErrorHint()).toContain('成功章')
  })
})
