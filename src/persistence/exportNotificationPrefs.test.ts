import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadExportCompletionNotificationEnabled,
  saveExportCompletionNotificationEnabled,
  getExportCompletionNotificationHint,
  getExportCompletionNotificationLabel,
} from './exportNotificationPrefs'

describe('exportNotificationPrefs', () => {
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
    expect(loadExportCompletionNotificationEnabled()).toBe(false)
  })

  it('保存した値を読み戻せる', () => {
    saveExportCompletionNotificationEnabled(true)
    expect(loadExportCompletionNotificationEnabled()).toBe(true)
  })

  it('ラベルとヒントを返す', () => {
    expect(getExportCompletionNotificationLabel()).toContain('通知')
    expect(getExportCompletionNotificationHint()).toContain('タブ')
  })
})
