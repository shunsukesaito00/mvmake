import { describe, it, expect, vi } from 'vitest'
import {
  applyVolumeNormalizeToAudio,
  computeNormalizeMultiplier,
  formatNormalizeResult,
  getEffectiveAudioPeak,
  measurePeakAmplitude,
  MIN_MEASURABLE_PEAK,
  MAX_AUDIO_VOLUME,
  DEFAULT_NORMALIZE_TARGET_PEAK,
} from './audioNormalize'
import { DEFAULT_AUDIO } from '../types/project'

function mockAudioBuffer(samples: number[], sampleRate = 44100): AudioBuffer {
  const data = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) data[i] = samples[i] ?? 0
  return {
    sampleRate,
    length: samples.length,
    duration: samples.length / sampleRate,
    numberOfChannels: 1,
    getChannelData: () => data,
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as AudioBuffer
}

describe('audioNormalize', () => {
  it('measurePeakAmplitude はソース区間の最大振幅を返す', () => {
    const buffer = mockAudioBuffer([0, 0.2, -0.5, 0.1])
    expect(measurePeakAmplitude(buffer, 0, 4 / buffer.sampleRate)).toBe(0.5)
    expect(measurePeakAmplitude(buffer, 0, 1 / buffer.sampleRate)).toBe(0)
  })

  it('computeNormalizeMultiplier は低ピークほど大きい倍率を返す', () => {
    const quiet = computeNormalizeMultiplier(0.1, DEFAULT_AUDIO)
    const loud = computeNormalizeMultiplier(0.8, DEFAULT_AUDIO)
    expect(quiet).toBeGreaterThan(loud)
    expect(quiet).toBe(MAX_AUDIO_VOLUME)
  })

  it('applyVolumeNormalizeToAudio は音量とキーフレームを同倍率で調整する', () => {
    const audio = {
      ...DEFAULT_AUDIO,
      volume: 1,
      volumeKeyframes: [{ id: 'kf1', time: 1, volume: 0.5 }],
    }
    const { audio: next, multiplier } = applyVolumeNormalizeToAudio(audio, 0.1)
    expect(multiplier).toBeGreaterThan(1)
    expect(next.volume).toBeCloseTo(multiplier, 2)
    expect(next.volumeKeyframes?.[0]?.volume).toBeCloseTo(0.5 * multiplier, 2)
  })

  it('無音に近い素材は倍率 1 のまま', () => {
    const { multiplier } = applyVolumeNormalizeToAudio(DEFAULT_AUDIO, MIN_MEASURABLE_PEAK / 10)
    expect(multiplier).toBe(1)
  })

  it('formatNormalizeResult にピークと倍率を含める', () => {
    expect(formatNormalizeResult(0.2, 2)).toContain('20%')
    expect(formatNormalizeResult(0.9, 1)).toContain('目標ピーク')
  })

  it('getEffectiveAudioPeak はキーフレームの最大値を考慮する', () => {
    const audio = {
      ...DEFAULT_AUDIO,
      volume: 0.4,
      volumeKeyframes: [{ id: 'kf1', time: 0.5, volume: 0.9 }],
    }
    expect(getEffectiveAudioPeak(audio)).toBe(0.9)
  })

  it('音量上限 2 を超えないよう倍率をクランプする', () => {
    const audio = { ...DEFAULT_AUDIO, volume: 1.5 }
    const multiplier = computeNormalizeMultiplier(0.05, audio)
    const { audio: next } = applyVolumeNormalizeToAudio(audio, 0.05)
    expect(multiplier).toBeLessThanOrEqual(MAX_AUDIO_VOLUME / 1.5)
    expect(next.volume).toBeLessThanOrEqual(MAX_AUDIO_VOLUME)
  })

  it('measurePeakAmplitude は sourceStart 以降のみ計測する', () => {
    const buffer = mockAudioBuffer([0.9, 0.1, 0.1, 0.1], 4)
    expect(measurePeakAmplitude(buffer, 0, 4 / 4)).toBeCloseTo(0.9, 5)
    expect(measurePeakAmplitude(buffer, 1 / 4, 3 / 4)).toBeCloseTo(0.1, 5)
  })

  it('目標ピーク付近の素材は倍率 1 のまま', () => {
    const multiplier = computeNormalizeMultiplier(DEFAULT_NORMALIZE_TARGET_PEAK, DEFAULT_AUDIO)
    expect(multiplier).toBeCloseTo(1, 2)
  })

  it('decodeAudioBlob は AudioContext でデコードする', async () => {
    const decodeAudioData = vi.fn().mockResolvedValue(mockAudioBuffer([0.3]))
    const close = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('AudioContext', class {
      decodeAudioData = decodeAudioData
      close = close
    })

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/wav' })
    const { decodeAudioBlob } = await import('./audioNormalize')
    const buffer = await decodeAudioBlob(blob)
    expect(buffer.getChannelData(0)[0]).toBeCloseTo(0.3)
    expect(decodeAudioData).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })
})
