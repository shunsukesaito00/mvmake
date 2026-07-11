import { describe, it, expect, beforeEach } from 'vitest'
import {
  createStressMediaListAssets,
  MEDIA_LIST_STRESS_COUNT,
  seedMediaListStress,
} from './mediaListStressSetup'
import {
  filterAndSortMediaAssets,
  filterMediaAssets,
  isMediaListEmpty,
} from './mediaListFilter'
import { useProjectStore } from '../store/projectStore'

describe('mediaListStressSetup', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject()
  })

  it('createStressMediaListAssets は既定 52 件・種類混在', () => {
    const assets = createStressMediaListAssets()
    expect(assets).toHaveLength(MEDIA_LIST_STRESS_COUNT)
    expect(assets.filter((a) => a.type === 'image')).toHaveLength(45)
    expect(assets.filter((a) => a.type === 'audio')).toHaveLength(5)
    expect(assets.filter((a) => a.type === 'video')).toHaveLength(2)
  })

  it('seedMediaListStress でストアへ投入する', () => {
    const stats = seedMediaListStress()
    expect(stats.mediaCount).toBe(MEDIA_LIST_STRESS_COUNT)
    expect(useProjectStore.getState().project.mediaAssets).toHaveLength(MEDIA_LIST_STRESS_COUNT)
  })
})

describe('mediaListFilter stress', () => {
  const assets = createStressMediaListAssets()

  it('52 件から名前検索で絞り込める', () => {
    expect(filterMediaAssets(assets, 'alpha', 'all')).toHaveLength(1)
    expect(filterMediaAssets(assets, 'photo-', 'all')).toHaveLength(43)
  })

  it('種類フィルタと名前順ソートを同時適用', () => {
    const result = filterAndSortMediaAssets(assets, '', 'audio', 'name')
    expect(result).toHaveLength(5)
    expect(result[0]!.name).toBe('bgm-01.wav')
    expect(result[4]!.name).toBe('bgm-05.wav')
  })

  it('該当なし検索は isMediaListEmpty', () => {
    expect(isMediaListEmpty(assets, 'not-found-xyz', 'all')).toBe(true)
    expect(isMediaListEmpty(assets, 'photo', 'video')).toBe(true)
  })
})
