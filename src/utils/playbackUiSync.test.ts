import { describe, expect, it } from 'vitest'
import { PLAYBACK_UI_SYNC_INTERVAL_MS, shouldSyncPlaybackUi } from './playbackUiSync'

describe('playbackUiSync', () => {
  it('8Hz 間隔で UI 同期を許可する', () => {
    expect(PLAYBACK_UI_SYNC_INTERVAL_MS).toBe(125)
    expect(shouldSyncPlaybackUi(0, 124)).toBe(false)
    expect(shouldSyncPlaybackUi(0, 125)).toBe(true)
    expect(shouldSyncPlaybackUi(100, 225)).toBe(true)
  })
})
