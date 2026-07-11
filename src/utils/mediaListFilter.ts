import type { MediaAsset, MediaType } from '../types/project'

export type MediaTypeFilter = 'all' | MediaType
export type MediaSortOrder = 'added' | 'name'

export function buildMediaOrderIndex(assets: MediaAsset[]): Map<string, number> {
  return new Map(assets.map((asset, index) => [asset.id, index]))
}

export function filterMediaAssets(
  assets: MediaAsset[],
  query: string,
  typeFilter: MediaTypeFilter,
): MediaAsset[] {
  const normalized = query.trim().toLowerCase()
  return assets.filter((asset) => {
    if (typeFilter !== 'all' && asset.type !== typeFilter) return false
    if (normalized && !asset.name.toLowerCase().includes(normalized)) return false
    return true
  })
}

export function sortMediaAssets(
  assets: MediaAsset[],
  order: MediaSortOrder,
  orderIndex: Map<string, number>,
): MediaAsset[] {
  const sorted = [...assets]
  if (order === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    return sorted
  }
  sorted.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0))
  return sorted
}

export function filterAndSortMediaAssets(
  assets: MediaAsset[],
  query: string,
  typeFilter: MediaTypeFilter,
  sortOrder: MediaSortOrder,
): MediaAsset[] {
  const orderIndex = buildMediaOrderIndex(assets)
  const filtered = filterMediaAssets(assets, query, typeFilter)
  return sortMediaAssets(filtered, sortOrder, orderIndex)
}

export function formatMediaListSummary(filteredCount: number, totalCount: number): string {
  if (filteredCount === totalCount) return `${totalCount}件のメディア`
  return `${filteredCount}/${totalCount}件表示`
}

/** 検索・フィルタ結果が空か */
export function isMediaListEmpty(
  assets: MediaAsset[],
  query: string,
  typeFilter: MediaTypeFilter,
): boolean {
  return filterMediaAssets(assets, query, typeFilter).length === 0
}
