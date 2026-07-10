import type { AudioEqSettings } from '../types/project'
import { DEFAULT_AUDIO_EQ } from '../types/project'

export const EQ_LOW_FREQ = 200
export const EQ_MID_FREQ = 1000
export const EQ_HIGH_FREQ = 4000
export const EQ_GAIN_MIN = -12
export const EQ_GAIN_MAX = 12

export interface EqFilterChain {
  input: AudioNode
  output: AudioNode
}

export function resolveAudioEq(eq?: AudioEqSettings): AudioEqSettings {
  if (!eq) return { ...DEFAULT_AUDIO_EQ }
  return {
    enabled: eq.enabled ?? false,
    lowGain: eq.lowGain ?? 0,
    midGain: eq.midGain ?? 0,
    highGain: eq.highGain ?? 0,
  }
}

export function isEqActive(eq?: AudioEqSettings): boolean {
  return resolveAudioEq(eq).enabled
}

/** Web Audio の BiquadFilter 3バンド EQ チェーンを構築 */
export function connectEqChain(context: BaseAudioContext, eq?: AudioEqSettings): EqFilterChain {
  const settings = resolveAudioEq(eq)
  if (!settings.enabled) {
    const bypass = context.createGain()
    bypass.gain.value = 1
    return { input: bypass, output: bypass }
  }

  const low = context.createBiquadFilter()
  low.type = 'lowshelf'
  low.frequency.value = EQ_LOW_FREQ
  low.gain.value = settings.lowGain

  const mid = context.createBiquadFilter()
  mid.type = 'peaking'
  mid.frequency.value = EQ_MID_FREQ
  mid.Q.value = 1
  mid.gain.value = settings.midGain

  const high = context.createBiquadFilter()
  high.type = 'highshelf'
  high.frequency.value = EQ_HIGH_FREQ
  high.gain.value = settings.highGain

  low.connect(mid)
  mid.connect(high)
  return { input: low, output: high }
}

export function clampEqGain(value: number): number {
  return Math.max(EQ_GAIN_MIN, Math.min(EQ_GAIN_MAX, value))
}
