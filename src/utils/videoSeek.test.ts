import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seekVideoElement, VIDEO_SEEK_TOLERANCE_SEC } from './videoSeek'

function stubWindowTimers() {
  vi.stubGlobal('window', {
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  })
}

describe('seekVideoElement', () => {
  beforeEach(() => {
    stubWindowTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('許容誤差内なら即 resolve する', async () => {
    const video = { currentTime: 1.0 } as HTMLVideoElement
    await expect(seekVideoElement(video, 1.0 + VIDEO_SEEK_TOLERANCE_SEC / 2)).resolves.toBeUndefined()
  })

  it('seeked で resolve する', async () => {
    const handlers = new Map<string, () => void>()
    const video = {
      currentTime: 0,
      addEventListener: (type: string, fn: () => void) => { handlers.set(type, fn) },
      removeEventListener: (type: string) => { handlers.delete(type) },
    } as unknown as HTMLVideoElement

    const promise = seekVideoElement(video, 2)
    handlers.get('seeked')?.()
    await expect(promise).resolves.toBeUndefined()
  })

  it('タイムアウトで reject する', async () => {
    vi.useFakeTimers()
    const video = {
      currentTime: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement

    const promise = seekVideoElement(video, 5, { timeoutMs: 100 })
    const assertion = expect(promise).rejects.toThrow(/タイムアウト/)
    await vi.advanceTimersByTimeAsync(100)
    await assertion
    vi.useRealTimers()
  })

  it('error で reject する', async () => {
    const handlers = new Map<string, () => void>()
    const video = {
      currentTime: 0,
      error: { code: 4 },
      addEventListener: (type: string, fn: () => void) => { handlers.set(type, fn) },
      removeEventListener: (type: string) => { handlers.delete(type) },
    } as unknown as HTMLVideoElement

    const promise = seekVideoElement(video, 3)
    handlers.get('error')?.()
    await expect(promise).rejects.toThrow(/シークに失敗/)
  })
})
