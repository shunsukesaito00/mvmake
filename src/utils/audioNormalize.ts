import type { AudioSettings } from '../types/project'

export const DEFAULT_NORMALIZE_TARGET_PEAK = 0.9
export const MAX_AUDIO_VOLUME = 2
export const MIN_MEASURABLE_PEAK = 0.00001

export function measurePeakAmplitude(
  buffer: AudioBuffer,
  sourceStart = 0,
  sourceDuration?: number,
): number {
  const sampleRate = buffer.sampleRate
  const startSample = Math.max(0, Math.floor(sourceStart * sampleRate))
  const endSample =
    sourceDuration != null
      ? Math.min(buffer.length, Math.floor((sourceStart + sourceDuration) * sampleRate))
      : buffer.length

  let peak = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = startSample; i < endSample; i++) {
      const abs = Math.abs(data[i] ?? 0)
      if (abs > peak) peak = abs
    }
  }
  return peak
}

export function getEffectiveAudioPeak(audio: AudioSettings): number {
  const keyframePeak = audio.volumeKeyframes?.reduce((max, kf) => Math.max(max, kf.volume), 0) ?? 0
  return Math.max(audio.volume, keyframePeak)
}

export function computeNormalizeMultiplier(
  measuredPeak: number,
  audio: AudioSettings,
  targetPeak = DEFAULT_NORMALIZE_TARGET_PEAK,
): number {
  if (measuredPeak <= MIN_MEASURABLE_PEAK) return 1
  const maxEffective = getEffectiveAudioPeak(audio)
  if (maxEffective <= MIN_MEASURABLE_PEAK) return 1
  return Math.min(MAX_AUDIO_VOLUME / maxEffective, targetPeak / measuredPeak)
}

export function applyVolumeNormalizeToAudio(
  audio: AudioSettings,
  measuredPeak: number,
  targetPeak = DEFAULT_NORMALIZE_TARGET_PEAK,
): { audio: AudioSettings; multiplier: number } {
  const multiplier = computeNormalizeMultiplier(measuredPeak, audio, targetPeak)
  if (multiplier === 1) return { audio, multiplier: 1 }

  const keyframes = audio.volumeKeyframes?.map((kf) => ({
    ...kf,
    volume: Math.min(MAX_AUDIO_VOLUME, kf.volume * multiplier),
  }))

  return {
    audio: {
      ...audio,
      volume: Math.min(MAX_AUDIO_VOLUME, audio.volume * multiplier),
      volumeKeyframes: keyframes,
    },
    multiplier,
  }
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer()
  const ctx = new AudioContext()
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    await ctx.close()
  }
}

export async function normalizeAudioSettingsFromBlob(
  blob: Blob,
  audio: AudioSettings,
  sourceStart: number,
  sourceDuration: number,
  targetPeak = DEFAULT_NORMALIZE_TARGET_PEAK,
): Promise<{ audio: AudioSettings; measuredPeak: number; multiplier: number }> {
  const buffer = await decodeAudioBlob(blob)
  const measuredPeak = measurePeakAmplitude(buffer, sourceStart, sourceDuration)
  const { audio: nextAudio, multiplier } = applyVolumeNormalizeToAudio(audio, measuredPeak, targetPeak)
  return { audio: nextAudio, measuredPeak, multiplier }
}

export function formatNormalizeResult(
  measuredPeak: number,
  multiplier: number,
  targetPeak = DEFAULT_NORMALIZE_TARGET_PEAK,
): string {
  if (multiplier <= 1.001) {
    return `すでに目標ピーク(${Math.round(targetPeak * 100)}%)付近です`
  }
  return `ピーク ${Math.round(measuredPeak * 100)}% → 約 ${Math.round(targetPeak * 100)}%（×${multiplier.toFixed(2)}）`
}
