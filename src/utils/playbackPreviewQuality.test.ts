import { describe, expect, it } from 'vitest'
import {
  PLAYBACK_SCOPE_UPDATE_INTERVAL_MS,
  PLAYBACK_TIMELINE_SCROLL_INTERVAL_MS,
  PLAYBACK_VU_UPDATE_INTERVAL_MS,
  getPlaybackPreviewMode,
  shouldCaptureColorScope,
  shouldRenderBeforeAfterPreview,
  shouldScrollTimelineDuringPlayback,
  shouldUpdatePlaybackScope,
  shouldUpdatePlaybackVu,
  useCssColorFallbackWhilePlaying,
} from './playbackPreviewQuality'

describe('playbackPreviewQuality', () => {
  it('再生中は CSS フォールバックと lightweight モード', () => {
    expect(useCssColorFallbackWhilePlaying(true)).toBe(true)
    expect(useCssColorFallbackWhilePlaying(false)).toBe(false)
    expect(getPlaybackPreviewMode(true)).toBe('lightweight')
    expect(getPlaybackPreviewMode(false)).toBe('full')
  })

  it('Before/After は停止時のみ', () => {
    expect(shouldRenderBeforeAfterPreview(false, 'beforeAfter')).toBe(true)
    expect(shouldRenderBeforeAfterPreview(true, 'beforeAfter')).toBe(false)
    expect(shouldRenderBeforeAfterPreview(true, 'normal')).toBe(false)
  })

  it('スコープは再生中 2Hz、停止時は毎回', () => {
    const now = 1000
    expect(shouldCaptureColorScope(false, true, 0, now)).toBe(true)
    expect(shouldCaptureColorScope(true, true, now - PLAYBACK_SCOPE_UPDATE_INTERVAL_MS, now)).toBe(true)
    expect(shouldCaptureColorScope(true, true, now - 100, now)).toBe(false)
    expect(shouldCaptureColorScope(true, false, 0, now)).toBe(false)
  })

  it('タイムラインスクロールと VU は間隔で間引く', () => {
    const now = 2000
    expect(shouldScrollTimelineDuringPlayback(now - PLAYBACK_TIMELINE_SCROLL_INTERVAL_MS, now)).toBe(true)
    expect(shouldScrollTimelineDuringPlayback(now - 50, now)).toBe(false)
    expect(shouldUpdatePlaybackVu(now - PLAYBACK_VU_UPDATE_INTERVAL_MS, now)).toBe(true)
    expect(shouldUpdatePlaybackVu(now - 50, now)).toBe(false)
    expect(shouldUpdatePlaybackScope(now - 499, now)).toBe(false)
  })
})
