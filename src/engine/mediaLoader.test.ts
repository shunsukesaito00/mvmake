import { describe, expect, it } from 'vitest'
import { createAudioAssetFromBlob } from '../engine/mediaLoader'

function makeSilentWavBlob(durationSec = 0.5): Blob {
  const sampleRate = 44100
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec))
  const dataSize = numSamples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  return new Blob([buffer], { type: 'audio/wav' })
}

describe('createAudioAssetFromBlob', () => {
  it('durationHint 付きでオーディオ MediaAsset を生成する', async () => {
    const blob = makeSilentWavBlob(0.5)
    const asset = await createAudioAssetFromBlob(blob, 'narration.webm', 0.5)
    expect(asset).not.toBeNull()
    expect(asset?.type).toBe('audio')
    expect(asset?.name).toBe('narration.webm')
    expect(asset?.duration).toBe(0.5)
    expect(asset?.waveform).toHaveLength(100)
    if (asset?.url) URL.revokeObjectURL(asset.url)
  })

  it('短すぎる duration は null を返す', async () => {
    const blob = makeSilentWavBlob(0.05)
    const asset = await createAudioAssetFromBlob(blob, 'short.webm', 0.05)
    expect(asset).toBeNull()
  })
})
