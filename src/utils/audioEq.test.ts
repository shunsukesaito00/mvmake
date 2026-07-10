import { describe, expect, it } from 'vitest'
import { DEFAULT_AUDIO_EQ } from '../types/project'
import {
  EQ_GAIN_MAX,
  EQ_GAIN_MIN,
  EQ_HIGH_FREQ,
  EQ_LOW_FREQ,
  EQ_MID_FREQ,
  clampEqGain,
  isEqActive,
  resolveAudioEq,
} from './audioEq'

describe('resolveAudioEq', () => {
  it('未設定時はデフォルト', () => {
    expect(resolveAudioEq()).toEqual(DEFAULT_AUDIO_EQ)
  })

  it('部分指定をマージする', () => {
    expect(resolveAudioEq({ enabled: true, lowGain: 3, midGain: 0, highGain: -2 })).toEqual({
      enabled: true,
      lowGain: 3,
      midGain: 0,
      highGain: -2,
    })
  })
})

describe('isEqActive', () => {
  it('無効時は false', () => {
    expect(isEqActive({ enabled: false, lowGain: 6, midGain: 0, highGain: 0 })).toBe(false)
  })

  it('有効かつゲイン0でも true', () => {
    expect(isEqActive({ enabled: true, lowGain: 0, midGain: 0, highGain: 0 })).toBe(true)
  })
})

describe('clampEqGain', () => {
  it('範囲内にクランプする', () => {
    expect(clampEqGain(20)).toBe(EQ_GAIN_MAX)
    expect(clampEqGain(-20)).toBe(EQ_GAIN_MIN)
    expect(clampEqGain(3)).toBe(3)
  })
})

describe('EQ constants', () => {
  it('周波数定数が定義されている', () => {
    expect(EQ_LOW_FREQ).toBe(200)
    expect(EQ_MID_FREQ).toBe(1000)
    expect(EQ_HIGH_FREQ).toBe(4000)
  })
})
