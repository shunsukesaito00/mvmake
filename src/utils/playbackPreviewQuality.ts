import type { ColorPreviewMode } from '../store/projectStore'

/** 再生中のカラースコープ更新間隔（2Hz） */
export const PLAYBACK_SCOPE_UPDATE_INTERVAL_MS = 500

/** 再生中のタイムライン自動スクロール間隔（4Hz） */
export const PLAYBACK_TIMELINE_SCROLL_INTERVAL_MS = 250

/** 再生中の VU メーター更新間隔（8Hz） */
export const PLAYBACK_VU_UPDATE_INTERVAL_MS = 125

export function shouldUpdatePlaybackScope(lastUpdateMs: number, nowMs: number): boolean {
  return nowMs - lastUpdateMs >= PLAYBACK_SCOPE_UPDATE_INTERVAL_MS
}

export function shouldScrollTimelineDuringPlayback(lastScrollMs: number, nowMs: number): boolean {
  return nowMs - lastScrollMs >= PLAYBACK_TIMELINE_SCROLL_INTERVAL_MS
}

export function shouldUpdatePlaybackVu(lastUpdateMs: number, nowMs: number): boolean {
  return nowMs - lastUpdateMs >= PLAYBACK_VU_UPDATE_INTERVAL_MS
}

/** 再生中はピクセルグレード/LUT を避け CSS filter のみ使う */
export function useCssColorFallbackWhilePlaying(playing: boolean): boolean {
  return playing
}

/** Before/After 分割は停止時のみフル品質 */
export function shouldRenderBeforeAfterPreview(playing: boolean, mode: ColorPreviewMode): boolean {
  return !playing && mode === 'beforeAfter'
}

export function shouldCaptureColorScope(
  playing: boolean,
  showColorScope: boolean,
  lastScopeMs: number,
  nowMs: number,
): boolean {
  if (!showColorScope) return false
  if (!playing) return true
  return shouldUpdatePlaybackScope(lastScopeMs, nowMs)
}

export type PlaybackPreviewMode = 'full' | 'lightweight'

export function getPlaybackPreviewMode(playing: boolean): PlaybackPreviewMode {
  return playing ? 'lightweight' : 'full'
}
