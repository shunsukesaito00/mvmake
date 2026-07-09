import { describe, expect, it } from 'vitest'
import {
  buildRecordingBlob,
  formatNarrationFileName,
  formatRecordingDuration,
  NARRATION_MIN_DURATION_SEC,
} from './narrationRecording'

describe('narrationRecording', () => {
  it('formatNarrationFileName はナレーション接頭辞を付ける', () => {
    const name = formatNarrationFileName(new Date('2026-07-09T12:30:45.000Z'))
    expect(name).toMatch(/^ナレーション_/)
    expect(name).toContain('.webm')
  })

  it('buildRecordingBlob でチャンクを結合する', () => {
    const blob = buildRecordingBlob([new Uint8Array([1, 2]), new Uint8Array([3])], 'audio/webm')
    expect(blob.type).toBe('audio/webm')
    expect(blob.size).toBe(3)
  })

  it('formatRecordingDuration', () => {
    expect(formatRecordingDuration(5.4)).toBe('5.4s')
    expect(formatRecordingDuration(65.2)).toBe('1:05.2')
  })

  it('NARRATION_MIN_DURATION_SEC', () => {
    expect(NARRATION_MIN_DURATION_SEC).toBe(0.1)
  })
})
