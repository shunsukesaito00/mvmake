import { describe, expect, it } from 'vitest'
import type { ChapterExportEntry } from './chapterBatchExport'
import {
  buildPartialChapterZipFilename,
  buildPartialSuccessChapterZipFilename,
  canDownloadPartialChapterZip,
  canSkipFailedAndContinue,
  createChapterExportQueue,
  finalizeChapterQueueOnAbort,
  formatBatchExportProgressDetail,
  formatChapterQueueCancelDetail,
  formatChapterQueueFailureDetail,
  formatChapterQueueItemStatus,
  formatChapterQueueSkipContinueSummary,
  getChapterQueueSummary,
  getFailedChapterIndices,
  getPartialChapterZipButtonLabel,
  getPartialChapterZipHint,
  getPendingChapterIndices,
  getResumableChapterCount,
  getSkipFailedContinueButtonLabel,
  hasPartialChapterProgress,
  isChapterQueueComplete,
  isChapterQueuePartiallySuccessful,
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

  it('formatChapterQueueItemStatus は日本語ラベルを返す', () => {
    expect(formatChapterQueueItemStatus('pending')).toBe('待機中')
    expect(formatChapterQueueItemStatus('running')).toBe('書き出し中')
    expect(formatChapterQueueItemStatus('done')).toBe('完了')
    expect(formatChapterQueueItemStatus('failed')).toBe('失敗')
  })

  it('formatBatchExportProgressDetail は章と全体進捗を表示する', () => {
    const queue = createChapterExportQueue(entries)
    queue.items[0]!.status = 'done'
    queue.items[1]!.status = 'running'
    queue.items[1]!.progress = 0.5
    expect(formatBatchExportProgressDetail(queue, 0.42, '残り約 30秒')).toBe(
      '章 2/3「新郎プロフィール」 50% · 全体 42% · 残り約 30秒',
    )
    queue.items[1]!.status = 'pending'
    queue.items[1]!.progress = undefined
    expect(formatBatchExportProgressDetail(queue, 0.33, '残り約 1分')).toBe('33% 完了 · 残り約 1分')
  })

  it('runChapterExportQueue は書き出し中の章 progress を更新する', async () => {
    const queue = createChapterExportQueue(entries.slice(0, 1))
    const progressSnapshots: number[] = []
    await runChapterExportQueue(
      queue,
      async (_entry, _index, onChapterProgress) => {
        onChapterProgress(0.25)
        progressSnapshots.push(queue.items[0]?.progress ?? -1)
        onChapterProgress(0.75)
        progressSnapshots.push(queue.items[0]?.progress ?? -1)
        return new Blob([new Uint8Array([1])])
      },
      { onOverallProgress: () => {} },
    )
    expect(progressSnapshots).toEqual([0.25, 0.75])
    expect(queue.items[0]?.progress).toBeUndefined()
    expect(queue.items[0]?.status).toBe('done')
  })

  it('formatChapterQueueFailureDetail は失敗章のエラーメッセージを含む', () => {
    const queue = createChapterExportQueue(entries)
    queue.items[0]!.status = 'done'
    queue.items[1]!.status = 'failed'
    queue.items[1]!.errorMessage = 'encode failed'
    expect(formatChapterQueueFailureDetail(queue)).toContain('「新郎プロフィール」: encode failed')
    expect(formatChapterQueueFailureDetail(queue)).toContain('完了済みの章は保持されています。')
  })

  it('finalizeChapterQueueOnAbort は running を pending に戻す', () => {
    const queue = createChapterExportQueue(entries)
    queue.items[0]!.status = 'done'
    queue.items[1]!.status = 'running'
    queue.items[1]!.progress = 0.4
    finalizeChapterQueueOnAbort(queue)
    expect(queue.items[0]?.status).toBe('done')
    expect(queue.items[1]?.status).toBe('pending')
    expect(queue.items[1]?.progress).toBeUndefined()
  })

  it('hasPartialChapterProgress / getResumableChapterCount / formatChapterQueueCancelDetail', () => {
    const queue = createChapterExportQueue(entries)
    expect(hasPartialChapterProgress(queue)).toBe(false)
    expect(getResumableChapterCount(queue)).toBe(0)

    queue.items[0]!.status = 'done'
    expect(hasPartialChapterProgress(queue)).toBe(true)
    expect(getResumableChapterCount(queue)).toBe(2)
    expect(formatChapterQueueCancelDetail(queue)).toContain('1 章が完了済み')
    expect(formatChapterQueueCancelDetail(queue)).toContain('残り 2 章')
    expect(formatChapterQueueCancelDetail(queue)).toContain('ZIP で保存')
  })

  it('canDownloadPartialChapterZip / ラベル / ファイル名', () => {
    const queue = createChapterExportQueue(entries)
    expect(canDownloadPartialChapterZip(queue)).toBe(false)
    queue.items[0]!.status = 'done'
    queue.items[0]!.blob = new Blob([new Uint8Array([1])])
    expect(canDownloadPartialChapterZip(queue)).toBe(true)
    expect(getPartialChapterZipButtonLabel(1)).toBe('完了した 1 章を ZIP で保存')
    expect(getPartialChapterZipHint(1)).toContain('1 章だけ')
    expect(buildPartialChapterZipFilename('婚礼本編', 1)).toBe('婚礼本編_chapters_partial_1.zip')

    queue.items[1]!.status = 'done'
    queue.items[2]!.status = 'done'
    expect(canDownloadPartialChapterZip(queue)).toBe(false)
  })

  it('continueOnError は失敗後も残り章を続行する', async () => {
    const queue = createChapterExportQueue(entries)
    await runChapterExportQueue(
      queue,
      async (entry) => {
        if (entry.label === '新郎プロフィール') throw new Error('encode failed')
        return new Blob([new Uint8Array([1])])
      },
      { onOverallProgress: () => {}, continueOnError: true },
    )
    expect(queue.items[0]?.status).toBe('done')
    expect(queue.items[1]?.status).toBe('failed')
    expect(queue.items[2]?.status).toBe('done')
    expect(isChapterQueuePartiallySuccessful(queue)).toBe(true)
    expect(formatChapterQueueSkipContinueSummary(queue)).toContain('2 章を ZIP 保存')
    expect(formatChapterQueueSkipContinueSummary(queue)).toContain('新郎プロフィール')
    expect(buildPartialSuccessChapterZipFilename('婚礼', 2, 1)).toBe('婚礼_chapters_2ok_1fail.zip')
  })

  it('canSkipFailedAndContinue / ラベル', () => {
    const queue = createChapterExportQueue(entries)
    expect(canSkipFailedAndContinue(queue)).toBe(false)
    queue.items[0]!.status = 'done'
    queue.items[1]!.status = 'failed'
    expect(canSkipFailedAndContinue(queue)).toBe(true)
    expect(getPendingChapterIndices(queue)).toEqual([2])
    expect(getSkipFailedContinueButtonLabel(1)).toContain('残り 1 章')
    queue.items[2]!.status = 'done'
    expect(canSkipFailedAndContinue(queue)).toBe(false)
    expect(isChapterQueuePartiallySuccessful(queue)).toBe(true)
  })
})
