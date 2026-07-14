import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getExportChimeTones,
  playExportChime,
  shouldPlayExportChime,
} from './exportChime'

describe('exportChime', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('getExportChimeTones は outcome 別に異なる音色を返す', () => {
    expect(getExportChimeTones('success')[0].frequency).toBeGreaterThan(
      getExportChimeTones('failure')[0].frequency,
    )
    expect(getExportChimeTones('partial').length).toBeGreaterThan(0)
  })

  it('shouldPlayExportChime は有効かつ非ミュート時のみ true', () => {
    expect(shouldPlayExportChime({ enabled: true })).toBe(true)
    expect(shouldPlayExportChime({ enabled: true, muted: false })).toBe(true)
    expect(shouldPlayExportChime({ enabled: false })).toBe(false)
    expect(shouldPlayExportChime({ enabled: true, muted: true })).toBe(false)
  })

  it('playExportChime は E2E フックへ outcome を記録できる', () => {
    const bag: string[] = []
    vi.stubGlobal('__FABLE_E2E_CHIMES__', bag)
    expect(playExportChime('failure', { enabled: true })).toBe(true)
    expect(bag).toEqual(['failure'])
  })

  it('playExportChime は無効時に鳴らさない', () => {
    const bag: string[] = []
    vi.stubGlobal('__FABLE_E2E_CHIMES__', bag)
    expect(playExportChime('success', { enabled: false })).toBe(false)
    expect(bag).toEqual([])
  })

  it('playExportChime はミュート時に鳴らさない', () => {
    const bag: string[] = []
    vi.stubGlobal('__FABLE_E2E_CHIMES__', bag)
    expect(playExportChime('success', { enabled: true, muted: true })).toBe(false)
    expect(bag).toEqual([])
  })
})
