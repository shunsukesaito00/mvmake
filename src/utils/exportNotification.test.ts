import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatExportNotification,
  notifyExportCompletion,
  requestNotificationPermission,
  shouldNotifyExportCompletion,
} from './exportNotification'

describe('exportNotification', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('formatExportNotification は outcome 別の文言を返す', () => {
    expect(formatExportNotification('success').title).toContain('完了')
    expect(formatExportNotification('partial', '2章保存').body).toContain('2章保存')
    expect(formatExportNotification('failure').title).toContain('失敗')
  })

  it('shouldNotifyExportCompletion は許可・有効・非表示時のみ true', () => {
    expect(shouldNotifyExportCompletion({
      enabled: true,
      permission: 'granted',
      documentHidden: true,
    })).toBe(true)
    expect(shouldNotifyExportCompletion({
      enabled: true,
      permission: 'granted',
      documentHidden: false,
    })).toBe(false)
    expect(shouldNotifyExportCompletion({
      enabled: false,
      permission: 'granted',
      documentHidden: true,
    })).toBe(false)
    expect(shouldNotifyExportCompletion({
      enabled: true,
      permission: 'denied',
      documentHidden: true,
    })).toBe(false)
  })

  it('notifyExportCompletion は条件を満たすと Notification を生成する', () => {
    const ctor = vi.fn()
    vi.stubGlobal('Notification', Object.assign(ctor, { permission: 'granted' }))
    vi.stubGlobal('document', { hidden: true })

    expect(notifyExportCompletion('success', '完了トースト文言', { enabled: true })).toBe(true)
    expect(ctor).toHaveBeenCalledWith(
      'FABLE: 書き出し完了',
      expect.objectContaining({ body: '完了トースト文言', tag: 'fable-export-success' }),
    )
  })

  it('requestNotificationPermission は未対応なら unsupported', async () => {
    vi.stubGlobal('Notification', undefined)
    expect(await requestNotificationPermission()).toBe('unsupported')
  })
})
