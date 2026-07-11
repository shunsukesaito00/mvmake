import type { TextPreset } from '../types/project'
import type { PresetFavoriteKind } from '../persistence/presetFavorites'

export type CatalogFilterValue = 'all' | 'favorites' | string

export interface CatalogCategoryOption {
  value: string
  label: string
}

export function isMotionTextPreset(preset: TextPreset): boolean {
  return preset.animation?.type?.startsWith('motion') ?? false
}

export function getTextPresetCatalogCategory(preset: TextPreset): string {
  if (isMotionTextPreset(preset)) return 'motion'
  return preset.category ?? 'title'
}

export function filterCatalogItems<T>(
  items: T[],
  filter: CatalogFilterValue,
  getId: (item: T) => string,
  getCategory: (item: T) => string,
  favoriteIds: string[],
): T[] {
  if (filter === 'favorites') {
    const fav = new Set(favoriteIds)
    return items.filter((item) => fav.has(getId(item)))
  }
  if (filter === 'all') return items
  return items.filter((item) => getCategory(item) === filter)
}

export function buildCatalogFilterOptions(
  categories: CatalogCategoryOption[],
  favoritesLabel = 'よく使う',
): CatalogCategoryOption[] {
  return [{ value: 'all', label: 'すべて' }, ...categories, { value: 'favorites', label: favoritesLabel }]
}

export const TEXT_CATALOG_CATEGORIES: CatalogCategoryOption[] = [
  { value: 'title', label: 'タイトル' },
  { value: 'lowerThird', label: 'ロワーサード' },
  { value: 'subtitle', label: 'テロップ' },
  { value: 'motion', label: 'MG' },
]

export const COLOR_LOOK_CATEGORY_LABELS: Record<string, string> = {
  basic: 'ベーシック',
  wedding: 'ウェディング',
  mood: 'ムード',
  film: 'フィルム',
}

export const COLOR_LOOK_CATALOG_CATEGORIES: CatalogCategoryOption[] = Object.entries(COLOR_LOOK_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const TRANSITION_CATEGORY_LABELS: Record<string, string> = {
  dissolve: 'ディゾルブ',
  wedding: 'ウェディング',
  motion: 'モーション',
}

export const TRANSITION_CATALOG_CATEGORIES: CatalogCategoryOption[] = Object.entries(TRANSITION_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function presetFavoriteKindLabel(kind: PresetFavoriteKind): string {
  if (kind === 'text') return 'テキスト'
  if (kind === 'colorLook') return 'ルック'
  return 'トランジション'
}
