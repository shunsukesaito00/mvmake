export type PresetFavoriteKind = 'text' | 'colorLook' | 'transition'

export interface PresetFavorites {
  text: string[]
  colorLook: string[]
  transition: string[]
}

const STORAGE_KEY = 'fable-preset-favorites'

const EMPTY: PresetFavorites = { text: [], colorLook: [], transition: [] }

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))]
}

function readRaw(): PresetFavorites {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<PresetFavorites>
    return {
      text: normalizeIds(parsed.text),
      colorLook: normalizeIds(parsed.colorLook),
      transition: normalizeIds(parsed.transition),
    }
  } catch {
    return { ...EMPTY }
  }
}

function writeRaw(favorites: PresetFavorites): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

export function loadPresetFavorites(): PresetFavorites {
  return readRaw()
}

export function isPresetFavorite(kind: PresetFavoriteKind, id: string): boolean {
  return readRaw()[kind].includes(id)
}

export function togglePresetFavorite(kind: PresetFavoriteKind, id: string): PresetFavorites {
  const current = readRaw()
  const set = new Set(current[kind])
  if (set.has(id)) set.delete(id)
  else set.add(id)
  const next = { ...current, [kind]: [...set] }
  writeRaw(next)
  return next
}

export function replacePresetFavorites(favorites: PresetFavorites): void {
  writeRaw({
    text: normalizeIds(favorites.text),
    colorLook: normalizeIds(favorites.colorLook),
    transition: normalizeIds(favorites.transition),
  })
}
