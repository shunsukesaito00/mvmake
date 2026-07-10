import { describe, expect, it } from 'vitest'
import {
  buildNarrationFileName,
  canRetryNarrationError,
  classifyGetUserMediaError,
  extensionForMimeType,
  formatRecordingElapsed,
  mergeRecordedChunks,
} from './narrationRecorder'

describe('narrationRecorder', () => {
  it('MIME タイプから拡張子を返す', () => {
    expect(extensionForMimeType('audio/webm;codecs=opus')).toBe('webm')
    expect(extensionForMimeType('audio/wav')).toBe('wav')
    expect(extensionForMimeType('audio/ogg;codecs=opus')).toBe('ogg')
    expect(extensionForMimeType('audio/mp4')).toBe('m4a')
  })

  it('録音ファイル名を生成する', () => {
    const date = new Date('2026-07-09T14:30:45')
    expect(buildNarrationFileName('audio/webm', date)).toBe('narration-20260709-143045.webm')
    expect(buildNarrationFileName('audio/wav', date)).toBe('narration-20260709-143045.wav')
  })

  it('録音チャンクを1つの Blob に結合する', () => {
    const chunks = [
      new Blob(['a'], { type: 'audio/webm' }),
      new Blob(['b'], { type: 'audio/webm' }),
    ]
    const merged = mergeRecordedChunks(chunks)
    expect(merged).not.toBeNull()
    expect(merged!.type).toBe('audio/webm')
    expect(merged!.size).toBeGreaterThan(0)
  })

  it('空チャンクは null を返す', () => {
    expect(mergeRecordedChunks([])).toBeNull()
  })

  it('経過時間を mm:ss 形式で表示する', () => {
    expect(formatRecordingElapsed(0)).toBe('0:00')
    expect(formatRecordingElapsed(65.4)).toBe('1:05')
    expect(formatRecordingElapsed(125)).toBe('2:05')
  })

  it('classifyGetUserMediaError が権限拒否を分類する', () => {
    const error = classifyGetUserMediaError(new DOMException('denied', 'NotAllowedError'))
    expect(error.code).toBe('permission_denied')
    expect(error.title).toContain('許可')
  })

  it('classifyGetUserMediaError がデバイス未検出を分類する', () => {
    const error = classifyGetUserMediaError(new DOMException('not found', 'NotFoundError'))
    expect(error.code).toBe('no_device')
  })

  it('canRetryNarrationError は unsupported のみ再試行不可', () => {
    expect(canRetryNarrationError('permission_denied')).toBe(true)
    expect(canRetryNarrationError('unsupported')).toBe(false)
  })
})
