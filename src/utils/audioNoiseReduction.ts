import type { AudioNoiseReductionSettings } from '../types/project'
import { DEFAULT_AUDIO_NOISE_REDUCTION } from '../types/project'

export const NOISE_HIGH_PASS_MIN = 40
export const NOISE_HIGH_PASS_MAX = 300
export const NOISE_LOW_PASS_MIN = 8000
export const NOISE_LOW_PASS_MAX = 16000
export const NOISE_GATE_STRENGTH_MIN = 0
export const NOISE_GATE_STRENGTH_MAX = 1

export interface NoiseReductionChain {
  input: AudioNode
  output: AudioNode
}

export function resolveAudioNoiseReduction(settings?: AudioNoiseReductionSettings): AudioNoiseReductionSettings {
  if (!settings) return { ...DEFAULT_AUDIO_NOISE_REDUCTION }
  return {
    enabled: settings.enabled ?? false,
    highPassHz: settings.highPassHz ?? DEFAULT_AUDIO_NOISE_REDUCTION.highPassHz,
    lowPassHz: settings.lowPassHz ?? DEFAULT_AUDIO_NOISE_REDUCTION.lowPassHz,
    gateStrength: settings.gateStrength ?? DEFAULT_AUDIO_NOISE_REDUCTION.gateStrength,
  }
}

export function isNoiseReductionActive(settings?: AudioNoiseReductionSettings): boolean {
  return resolveAudioNoiseReduction(settings).enabled
}

export function clampHighPassHz(value: number): number {
  return Math.max(NOISE_HIGH_PASS_MIN, Math.min(NOISE_HIGH_PASS_MAX, value))
}

export function clampLowPassHz(value: number): number {
  if (value <= 0) return 0
  return Math.max(NOISE_LOW_PASS_MIN, Math.min(NOISE_LOW_PASS_MAX, value))
}

export function clampGateStrength(value: number): number {
  return Math.max(NOISE_GATE_STRENGTH_MIN, Math.min(NOISE_GATE_STRENGTH_MAX, value))
}

/** 簡易ノイズゲート用の WaveShaper カーブ（小振幅を減衰） */
export function makeNoiseGateCurve(threshold: number, reduction: number): Float32Array<ArrayBuffer> {
  const samples = 65536
  const curve = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    const abs = Math.abs(x)
    curve[i] = abs < threshold ? x * reduction : x
  }
  return curve
}

export function getNoiseGateParams(gateStrength: number): { threshold: number; reduction: number } {
  const strength = clampGateStrength(gateStrength)
  return {
    threshold: 0.002 + (1 - strength) * 0.06,
    reduction: Math.max(0.05, 1 - strength * 0.92),
  }
}

/** Web Audio のハイパス/ローパス + 簡易ゲートチェーンを構築 */
export function connectNoiseReductionChain(
  context: BaseAudioContext,
  settings?: AudioNoiseReductionSettings,
): NoiseReductionChain {
  const resolved = resolveAudioNoiseReduction(settings)
  if (!resolved.enabled) {
    const bypass = context.createGain()
    bypass.gain.value = 1
    return { input: bypass, output: bypass }
  }

  const highPass = context.createBiquadFilter()
  highPass.type = 'highpass'
  highPass.frequency.value = clampHighPassHz(resolved.highPassHz)
  highPass.Q.value = 0.7

  let tail: AudioNode = highPass

  const lowPassHz = clampLowPassHz(resolved.lowPassHz)
  if (lowPassHz > 0) {
    const lowPass = context.createBiquadFilter()
    lowPass.type = 'lowpass'
    lowPass.frequency.value = lowPassHz
    lowPass.Q.value = 0.7
    tail.connect(lowPass)
    tail = lowPass
  }

  if (resolved.gateStrength > 0.01) {
    const gate = context.createWaveShaper()
    const { threshold, reduction } = getNoiseGateParams(resolved.gateStrength)
    gate.curve = makeNoiseGateCurve(threshold, reduction)
    gate.oversample = '2x'
    tail.connect(gate)
    tail = gate
  }

  return { input: highPass, output: tail }
}
