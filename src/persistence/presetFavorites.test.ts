import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isPresetFavorite,
  loadPresetFavorites,
  replacePresetFavorites,
  togglePresetFavorite,
} from './presetFavorites'

describe('presetFavorites', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null
      },
      setItem(key: string, value: string) {
        this.store[key] = value
      },
    })
    replacePresetFavorites({ text: [], colorLook: [], transition: [] })
  })

  it('toggle で text お気に入りを追加・削除する', () => {
    togglePresetFavorite('text', 'opening')
    expect(isPresetFavorite('text', 'opening')).toBe(true)
    togglePresetFavorite('text', 'opening')
    expect(isPresetFavorite('text', 'opening')).toBe(false)
  })

  it('種類ごとに独立して保持する', () => {
    togglePresetFavorite('text', 'opening')
    togglePresetFavorite('colorLook', 'wedding-warm')
    togglePresetFavorite('transition', 'crossfade')
    const all = loadPresetFavorites()
    expect(all.text).toEqual(['opening'])
    expect(all.colorLook).toEqual(['wedding-warm'])
    expect(all.transition).toEqual(['crossfade'])
  })
})
