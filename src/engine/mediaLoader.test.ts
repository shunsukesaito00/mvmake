import { describe, expect, it, vi } from 'vitest'
import { enrichMediaAsset, loadMediaFiles, yieldToMainThread } from '../engine/mediaLoader'
import type { MediaAsset } from '../types/project'

describe('mediaLoader', () => {
  it('yieldToMainThread は次の tick で resolve する', async () => {
    let ticked = false
    const promise = yieldToMainThread().then(() => {
      ticked = true
    })
    expect(ticked).toBe(false)
    await promise
    expect(ticked).toBe(true)
  })

  it('enrichMediaAsset はサムネイル済み画像で空を返す', async () => {
    const asset: MediaAsset = {
      id: 'img1',
      name: 'photo.jpg',
      type: 'image',
      blob: new Blob(),
      url: 'blob:img1',
      duration: 5,
      thumbnail: 'data:image/jpeg;base64,abc',
    }
    expect(await enrichMediaAsset(asset)).toEqual({})
  })

  it('enrichMediaAsset は波形済みオーディオで空を返す', async () => {
    const asset: MediaAsset = {
      id: 'aud1',
      name: 'bgm.wav',
      type: 'audio',
      blob: new Blob(),
      url: 'blob:aud1',
      duration: 10,
      waveform: [0.1, 0.5, 0.2],
    }
    expect(await enrichMediaAsset(asset)).toEqual({})
  })

  it('loadMediaFiles は進捗コールバックを呼ぶ', async () => {
    const file = new File([new Uint8Array(8)], 'photo.png', { type: 'image/png' })
    const progress: string[] = []
    await loadMediaFiles([file], undefined, (state) => {
      progress.push(`${state.phase}:${state.fileName}`)
    })
    expect(progress.length).toBeGreaterThanOrEqual(2)
    expect(progress[0]).toContain('photo.png')
  })

  it('loadMediaFiles は大量ファイルで並列メタデータ経路を使う', async () => {
    class MockImage {
      width = 100
      height = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', MockImage)

    const files = Array.from({ length: 10 }, (_, i) =>
      new File([new Uint8Array(8)], `bulk-${i}.png`, { type: 'image/png' }),
    )
    const assets = await loadMediaFiles(files)
    expect(assets).toHaveLength(10)
    expect(assets.every((asset) => asset.thumbnail === undefined)).toBe(true)

    vi.unstubAllGlobals()
  })
})
