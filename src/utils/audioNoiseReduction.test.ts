import { describe, expect, it } from 'vitest'
import { DEFAULT_AUDIO_NOISE_REDUCTION } from '../types/project'
import {
  NOISE_HIGH_PASS_MAX,
  NOISE_HIGH_PASS_MIN,
  NOISE_LOW_PASS_MAX,
  clampGateStrength,
  clampHighPassHz,
  clampLowPassHz,
  getNoiseGateParams,
  isNoiseReductionActive,
  makeNoiseGateCurve,
  resolveAudioNoiseReduction,
} from './audioNoiseReduction'

describe('resolveAudioNoiseReduction', () => {
  it('未設定時はデフォルト', () => {
    expect(resolveAudioNoiseReduction()).toEqual(DEFAULT_AUDIO_NOISE_REDUCTION)
  })

  it('部分指定をマージする', () => {
    expect(
      resolveAudioNoiseReduction({ enabled: true, highPassHz: 120, lowPassHz: 10000, gateStrength: 0.4 }),
    ).toEqual({
      enabled: true,
      highPassHz: 120,
      lowPassHz: 10000,
      gateStrength: 0.4,
    })
  })
})

describe('isNoiseReductionActive', () => {
  it('無効時は false', () => {
    expect(isNoiseReductionActive({ enabled: false, highPassHz: 100, lowPassHz: 0, gateStrength: 0.6 })).toBe(false)
  })

  it('有効時は true', () => {
    expect(isNoiseReductionActive({ enabled: true, highPassHz: 100, lowPassHz: 0, gateStrength: 0.6 })).toBe(true)
  })
})

describe('clamp helpers', () => {
  it('ハイパス周波数をクランプする', () => {
    expect(clampHighPassHz(10)).toBe(NOISE_HIGH_PASS_MIN)
    expect(clampHighPassHz(500)).toBe(NOISE_HIGH_PASS_MAX)
    expect(clampHighPassHz(100)).toBe(100)
  })

  it('ローパス周波数をクランプする', () => {
    expect(clampLowPassHz(0)).toBe(0)
    expect(clampLowPassHz(5000)).toBe(8000)
    expect(clampLowPassHz(20000)).toBe(NOISE_LOW_PASS_MAX)
  })

  it('ゲート強度をクランプする', () => {
    expect(clampGateStrength(-0.2)).toBe(0)
    expect(clampGateStrength(1.5)).toBe(1)
    expect(clampGateStrength(0.5)).toBe(0.5)
  })
})

describe('makeNoiseGateCurve', () => {
  it('しきい値以下の振幅を減衰する', () => {
    const curve = makeNoiseGateCurve(0.05, 0.2)
    const nearZero = curve[Math.floor(curve.length / 2)]
    const high = curve[Math.floor(curve.length * 0.95)]
    expect(Math.abs(nearZero)).toBeLessThan(0.05)
    expect(Math.abs(high)).toBeGreaterThan(0.5)
  })
})

describe('getNoiseGateParams', () => {
  it('強度が高いほどしきい値が低く減衰が強い', () => {
    const weak = getNoiseGateParams(0.2)
    const strong = getNoiseGateParams(0.9)
    expect(strong.threshold).toBeLessThan(weak.threshold)
    expect(strong.reduction).toBeLessThan(weak.reduction)
  })
})
