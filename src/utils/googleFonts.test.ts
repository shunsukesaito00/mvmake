import { describe, expect, it, vi } from 'vitest'
import {
  GOOGLE_FONT_OPTIONS,
  FontLoadError,
  buildCanvasFontString,
  buildGoogleFontsStylesheetUrl,
  collectProjectFontFamilies,
  ensureProjectFontsLoaded,
  isCatalogGoogleFont,
  normalizeGoogleFontFamily,
} from './googleFonts'
import type { Project } from '../types/project'

describe('googleFonts', () => {
  it('カタログは 10 種以上', () => {
    expect(GOOGLE_FONT_OPTIONS.length).toBeGreaterThanOrEqual(10)
  })

  it('buildGoogleFontsStylesheetUrl に family パラメータを含める', () => {
    const url = buildGoogleFontsStylesheetUrl(['Noto Sans JP', 'Zen Old Mincho'])
    expect(url).toContain('fonts.googleapis.com')
    expect(url).toContain('Noto+Sans+JP')
    expect(url).toContain('Zen+Old+Mincho')
  })

  it('collectProjectFontFamilies はテキストクリップのフォントを集める', () => {
    const project = {
      tracks: [{
        id: 't1',
        type: 'text',
        name: 'Text',
        muted: false,
        locked: false,
        clips: [{
          id: 'c1',
          type: 'text',
          trackId: 't1',
          startTime: 0,
          duration: 3,
          sourceStart: 0,
          sourceDuration: 3,
          text: {
            content: 'Hi',
            fontFamily: 'Yuji Syuku',
            fontSize: 48,
            color: '#fff',
            strokeColor: '#000',
            strokeWidth: 0,
            shadowColor: '#000',
            shadowBlur: 0,
            textAlign: 'center',
            lineHeight: 1.2,
            verticalAlign: 'center',
            backgroundColor: '',
            backgroundPadding: 16,
            backgroundRadius: 8,
          },
          transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          animation: { type: 'none', duration: 0 },
        }],
      }],
      mediaAssets: [],
    } as unknown as Project

    expect(collectProjectFontFamilies(project)).toEqual(['Yuji Syuku'])
  })

  it('normalizeGoogleFontFamily は未知フォントをデフォルトへ', () => {
    expect(normalizeGoogleFontFamily('Unknown Font')).toBe('Noto Sans JP')
    expect(normalizeGoogleFontFamily('Zen Maru Gothic')).toBe('Zen Maru Gothic')
  })

  it('isCatalogGoogleFont でカタログ判定', () => {
    expect(isCatalogGoogleFont('Kaisei Decol')).toBe(true)
    expect(isCatalogGoogleFont('Arial')).toBe(false)
  })

  it('buildCanvasFontString を生成する', () => {
    expect(buildCanvasFontString('Noto Serif JP', 72)).toBe('bold 72px "Noto Serif JP", sans-serif')
  })

  it('ensureProjectFontsLoaded は document 未使用時に成功する', async () => {
    const project = {
      tracks: [{
        id: 't1',
        type: 'text',
        name: 'Text',
        muted: false,
        locked: false,
        clips: [{
          id: 'c1',
          type: 'text',
          trackId: 't1',
          startTime: 0,
          duration: 3,
          sourceStart: 0,
          sourceDuration: 3,
          text: {
            content: 'Hi',
            fontFamily: 'Zen Maru Gothic',
            fontSize: 48,
            color: '#fff',
            strokeColor: '#000',
            strokeWidth: 0,
            shadowColor: '#000',
            shadowBlur: 0,
            textAlign: 'center',
            lineHeight: 1.2,
            verticalAlign: 'center',
            backgroundColor: '',
            backgroundPadding: 16,
            backgroundRadius: 8,
          },
          transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          animation: { type: 'none', duration: 0 },
        }],
      }],
      mediaAssets: [],
    } as unknown as Project

    await expect(ensureProjectFontsLoaded(project)).resolves.toBeUndefined()
  })

  it('ensureProjectFontsLoaded はロード失敗時に FontLoadError', async () => {
    const family = GOOGLE_FONT_OPTIONS[0]!.family
    const fonts = {
      load: vi.fn().mockResolvedValue([]),
      ready: Promise.resolve(),
      check: vi.fn().mockReturnValue(false),
    }
    vi.stubGlobal('document', {
      fonts,
      head: { appendChild: vi.fn() },
      createElement: vi.fn(() => ({ id: '', rel: '', href: '' })),
      getElementById: vi.fn(() => null),
    })

    const project = {
      tracks: [{
        id: 't1',
        type: 'text',
        name: 'Text',
        muted: false,
        locked: false,
        clips: [{
          id: 'c1',
          type: 'text',
          trackId: 't1',
          startTime: 0,
          duration: 3,
          sourceStart: 0,
          sourceDuration: 3,
          text: {
            content: 'Hi',
            fontFamily: family,
            fontSize: 48,
            color: '#fff',
            strokeColor: '#000',
            strokeWidth: 0,
            shadowColor: '#000',
            shadowBlur: 0,
            textAlign: 'center',
            lineHeight: 1.2,
            verticalAlign: 'center',
            backgroundColor: '',
            backgroundPadding: 16,
            backgroundRadius: 8,
          },
          transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, opacity: 1 },
          animation: { type: 'none', duration: 0 },
        }],
      }],
      mediaAssets: [],
    } as unknown as Project

    await expect(ensureProjectFontsLoaded(project)).rejects.toBeInstanceOf(FontLoadError)
    vi.unstubAllGlobals()
  })
})
