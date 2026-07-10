import type { Project } from '../types/project'

export interface GoogleFontOption {
  family: string
  label: string
  category: 'sans' | 'serif' | 'display'
}

/** 結婚式ムービー向け Google Fonts カタログ（12 種） */
export const GOOGLE_FONT_OPTIONS: GoogleFontOption[] = [
  { family: 'Noto Sans JP', label: 'Noto Sans JP', category: 'sans' },
  { family: 'Noto Serif JP', label: 'Noto Serif JP', category: 'serif' },
  { family: 'Shippori Mincho', label: 'Shippori Mincho', category: 'serif' },
  { family: 'Zen Old Mincho', label: 'Zen Old Mincho', category: 'serif' },
  { family: 'Zen Kaku Gothic New', label: 'Zen Kaku Gothic New', category: 'sans' },
  { family: 'Kaisei Decol', label: 'Kaisei Decol', category: 'serif' },
  { family: 'Kosugi Maru', label: 'Kosugi Maru', category: 'sans' },
  { family: 'M PLUS Rounded 1c', label: 'M PLUS Rounded 1c', category: 'sans' },
  { family: 'Yuji Syuku', label: 'Yuji Syuku', category: 'display' },
  { family: 'Hina Mincho', label: 'Hina Mincho', category: 'serif' },
  { family: 'Sawarabi Mincho', label: 'Sawarabi Mincho', category: 'serif' },
  { family: 'Zen Maru Gothic', label: 'Zen Maru Gothic', category: 'sans' },
]

export const DEFAULT_GOOGLE_FONT = 'Noto Sans JP'

const LINK_ID = 'fable-google-fonts'
const loadedCatalogFamilies = new Set<string>([DEFAULT_GOOGLE_FONT])

function encodeGoogleFontFamily(family: string): string {
  return encodeURIComponent(family).replace(/%20/g, '+')
}

export function buildGoogleFontsStylesheetUrl(
  families: string[] = GOOGLE_FONT_OPTIONS.map((f) => f.family),
): string {
  const familyParams = families
    .map((family) => `family=${encodeGoogleFontFamily(family)}:wght@400;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`
}

export function injectGoogleFontsStylesheet(families?: string[]): void {
  if (typeof document === 'undefined') return
  const targets = families ?? [...loadedCatalogFamilies]
  const url = buildGoogleFontsStylesheetUrl(targets)
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== url) link.href = url
}

export async function ensureGoogleFontsLoaded(families?: string[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const targets = families ?? [...loadedCatalogFamilies]
  targets.forEach((family) => {
    if (isCatalogGoogleFont(family)) loadedCatalogFamilies.add(family)
  })
  injectGoogleFontsStylesheet([...loadedCatalogFamilies])
  await Promise.allSettled(
    targets.flatMap((family) => [
      document.fonts.load(`400 16px "${family}"`),
      document.fonts.load(`700 16px "${family}"`),
    ]),
  )
  await document.fonts.ready
}

/** カタログフォントを1種類ずつ読み込む（UI 選択時用） */
export async function ensureGoogleFontFamily(family: string): Promise<void> {
  if (!isCatalogGoogleFont(family)) return
  await ensureGoogleFontsLoaded([family])
}

export function collectProjectFontFamilies(project: Project): string[] {
  const families = new Set<string>()
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (clip.type === 'text') families.add(clip.text.fontFamily)
    }
  }
  return [...families]
}

export class FontLoadError extends Error {
  readonly failedFamilies: string[]

  constructor(failedFamilies: string[]) {
    super(`フォントの読み込みに失敗しました: ${failedFamilies.join(', ')}`)
    this.name = 'FontLoadError'
    this.failedFamilies = failedFamilies
  }
}

async function loadCatalogFontFamily(family: string): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return true
  if (isCatalogGoogleFont(family)) loadedCatalogFamilies.add(family)
  injectGoogleFontsStylesheet([...loadedCatalogFamilies])
  const specs = [`400 16px "${family}"`, `700 16px "${family}"`]
  await Promise.allSettled(specs.map((spec) => document.fonts.load(spec)))
  await document.fonts.ready
  return specs.every((spec) => document.fonts.check(spec))
}

/** 書き出し前にプロジェクト内テキストのフォントを読み込む（カタログフォントの失敗時は例外） */
export async function ensureProjectFontsLoaded(project: Project): Promise<void> {
  const used = collectProjectFontFamilies(project).map(normalizeGoogleFontFamily)
  const targets = [...new Set([DEFAULT_GOOGLE_FONT, ...used])]
  const failed: string[] = []

  for (const family of targets) {
    if (!isCatalogGoogleFont(family)) continue
    const ok = await loadCatalogFontFamily(family)
    if (!ok) failed.push(family)
  }

  if (failed.length > 0) throw new FontLoadError(failed)
}

export function isCatalogGoogleFont(family: string): boolean {
  return GOOGLE_FONT_OPTIONS.some((f) => f.family === family)
}

export function normalizeGoogleFontFamily(family: string | undefined): string {
  if (!family) return DEFAULT_GOOGLE_FONT
  return isCatalogGoogleFont(family) ? family : DEFAULT_GOOGLE_FONT
}

/** Canvas 2D 用 font 文字列 */
export function buildCanvasFontString(fontFamily: string, fontSize: number, bold = true): string {
  return `${bold ? 'bold ' : ''}${fontSize}px "${fontFamily}", sans-serif`
}
