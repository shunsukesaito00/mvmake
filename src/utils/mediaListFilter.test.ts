import { describe, expect, it } from 'vitest'
import {
  filterAndSortMediaAssets,
  filterMediaAssets,
  formatMediaListSummary,
  sortMediaAssets,
  buildMediaOrderIndex,
} from './mediaListFilter'
import type { MediaAsset } from '../types/project'

function asset(id: string, name: string, type: MediaAsset['type']): MediaAsset {
  return {
    id,
    name,
    type,
    blob: new Blob(),
    url: `blob:${id}`,
    duration: type === 'image' ? 5 : 10,
  }
}

describe('mediaListFilter', () => {
  const assets = [
    asset('a', 'zebra.png', 'image'),
    asset('b', 'alpha-photo.jpg', 'image'),
    asset('c', 'bgm.wav', 'audio'),
    asset('d', 'opening.mp4', 'video'),
  ]

  it('名前検索で部分一致フィルタ', () => {
    expect(filterMediaAssets(assets, 'alpha', 'all')).toHaveLength(1)
    expect(filterMediaAssets(assets, 'photo', 'all')[0].name).toBe('alpha-photo.jpg')
  })

  it('種類フィルタ', () => {
    expect(filterMediaAssets(assets, '', 'image')).toHaveLength(2)
    expect(filterMediaAssets(assets, '', 'audio')).toHaveLength(1)
  })

  it('名前順ソート', () => {
    const sorted = sortMediaAssets(assets, 'name', buildMediaOrderIndex(assets))
    expect(sorted.map((a) => a.name)).toEqual([
      'alpha-photo.jpg',
      'bgm.wav',
      'opening.mp4',
      'zebra.png',
    ])
  })

  it('追加順ソート', () => {
    const sorted = sortMediaAssets([assets[2], assets[0]], 'added', buildMediaOrderIndex(assets))
    expect(sorted.map((a) => a.id)).toEqual(['a', 'c'])
  })

  it('filterAndSortMediaAssets を組み合わせる', () => {
    const result = filterAndSortMediaAssets(assets, 'a', 'all', 'name')
    expect(result.map((a) => a.name)).toEqual(['alpha-photo.jpg', 'bgm.wav', 'zebra.png'])
  })

  it('formatMediaListSummary', () => {
    expect(formatMediaListSummary(3, 10)).toBe('3/10件表示')
    expect(formatMediaListSummary(5, 5)).toBe('5件のメディア')
  })
})
