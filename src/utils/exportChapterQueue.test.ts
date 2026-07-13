import { describe, expect, it } from 'vitest'
import type { ChapterExportEntry } from './chapterBatchExport'
import {
  createChapterExportQueue,
  formatChapterQueueFailureDetail,
  getChapterQueueSummary,
  getFailedChapterIndices,
  isChapterQueueComplete,
  runChapterExportQueue,
  zipCompletedChapterQueue,
} from './exportChapterQueue'

const entries: ChapterExportEntry[] = [
  { filename: '01_a.mp4', label: 'オープニング', start: 0, duration: 2 },
  { filename: '02_b.mp4', label: '新郎プロフィール', start: 2, duration: 2 },
  { filename: '03_c.mp4', label: 'エンディング', start: 4, duration: 2 },
]

describe('exportChapterQueue', () => {
  it('createChapterExportQueue は pending で初期化する', () => {
    const queue = createChapterExportQueue(entries)
    expect(queue.items).toHaveLength(3)
    expect(queue.items.every((item) => item.status === 'pending')).toBe(true)
  })

  it('runChapterExportQueue は逐次書き出しして完了する', async () => {
    const queue = createChapterExportQueue(entries)
    const progress: number[] = []
    await runChapterExportQueue(
      queue,
      async () => new Blob([new Uint8Array([1])]),
      { onOverallProgress: (value) => progress.push(value) },
    )
    expect(isChapterQueueComplete(queue)).toBe(true)
    expect(progress.at(-1)).toBe(1)
  })

  it('途中失敗時は完了章を保持し failed にする', async () => {
    const queue = createChapterExportQueue(entries)
    await runChapterExportQueue(
      queue,
      async (entry) => {
        if (entry.label === '新郎プロフィール') throw new Error('encode failed')
        return new Blob([new Uint8Array([1])])
      },
      { onOverallProgress: () => {} },
    )
    expect(queue.items[0]?.status).toBe('done')
    expect(queue.items[1]?.status).toBe('failed')
    expect(queue.items[2]?.status).toBe('pending')
    expect(getFailedChapterIndices(queue)).toEqual([1])
    expect(formatChapterQueueFailureDetail(queue)).toContain('新郎プロフィール')
    expect(formatChapterQueueFailureDetail(queue)).toContain('完了済み')
  })

  it('onlyIndices で失敗章のみ再試行できる', async () => {
    const queue = createChapterExportQueue(entries)
    await runChapterExportQueue(
      queue,
      async (entry) => {
        if (entry.label === '新郎プロフィール') throw new Error('encode failed')
        return new Blob([new Uint8Array([1])])
      },
      { onOverallProgress: () => {} },
    )

    await runChapterExportQueue(
      queue,
      async () => new Blob([new Uint8Array([2])]),
      {
        onOverallProgress: () => {},
        onlyIndices: getFailedChapterIndices(queue),
      },
    )

    expect(isChapterQueueComplete(queue)).toBe(false)
    expect(queue.items[1]?.status).toBe('done')
    expect(queue.items[2]?.status).toBe('pending')

    await runChapterExportQueue(
      queue,
      async () => new Blob([new Uint8Array([3])]),
      { onOverallProgress: () => {} },
    )
    expect(isChapterQueueComplete(queue)).toBe(true)
    const zip = await zipCompletedChapterQueue(queue)
    expect(zip.type).toBe('application/zip')
  })

  it('getChapterQueueSummary は進捗を要約する', () => {
    const queue = createChapterExportQueue(entries)
    expect(getChapterQueueSummary(queue)).toBe('0/3 章')
    queue.items[0]!.status = 'done'
    queue.items[1]!.status = 'failed'
    expect(getChapterQueueSummary(queue)).toBe('1/3 章完了（1 章失敗）')
  })
})
