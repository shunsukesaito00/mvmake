import { describe, expect, it } from 'vitest'
import {
  formatExportAudioDecodeSkipMessage,
  mergeExportAudioDecodeSkips,
} from './exportAudioDecode'

describe('exportAudioDecode', () => {
  it('formatExportAudioDecodeSkipMessage は 0 件で null', () => {
    expect(formatExportAudioDecodeSkipMessage([])).toBeNull()
  })

  it('formatExportAudioDecodeSkipMessage は 1 件で素材名を含む', () => {
    expect(formatExportAudioDecodeSkipMessage([
      { assetId: 'a1', assetName: 'broken.wav' },
    ])).toBe('書き出しから音声を除外しました: broken.wav（デコードに失敗）')
  })

  it('formatExportAudioDecodeSkipMessage は複数件を要約する', () => {
    expect(formatExportAudioDecodeSkipMessage([
      { assetId: 'a1', assetName: 'a.wav' },
      { assetId: 'a2', assetName: 'b.wav' },
    ])).toBe('書き出しから音声を 2 件除外しました（デコード失敗）: a.wav、b.wav')
  })

  it('mergeExportAudioDecodeSkips は assetId で重複排除する', () => {
    expect(mergeExportAudioDecodeSkips(
      [{ assetId: 'a1', assetName: 'a.wav' }],
      [{ assetId: 'a1', assetName: 'a.wav' }, { assetId: 'a2', assetName: 'b.wav' }],
    )).toEqual([
      { assetId: 'a1', assetName: 'a.wav' },
      { assetId: 'a2', assetName: 'b.wav' },
    ])
  })
})
