/** 再生中の currentTime UI 更新間隔（8Hz） */
export const PLAYBACK_UI_SYNC_INTERVAL_MS = 125

export function shouldSyncPlaybackUi(lastSyncMs: number, nowMs: number): boolean {
  return nowMs - lastSyncMs >= PLAYBACK_UI_SYNC_INTERVAL_MS
}
