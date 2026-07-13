import type { ChapterExportEntry } from './chapterBatchExport'
import { zipMp4Blobs } from './chapterBatchExport'

export type ChapterQueueItemStatus = 'pending' | 'running' | 'done' | 'failed'

export type ChapterExportQueueItem = {
  entry: ChapterExportEntry
  status: ChapterQueueItemStatus
  blob?: Blob
  errorMessage?: string
}

export type ChapterExportQueue = {
  items: ChapterExportQueueItem[]
}

export function createChapterExportQueue(entries: ChapterExportEntry[]): ChapterExportQueue {
  return {
    items: entries.map((entry) => ({ entry, status: 'pending' })),
  }
}

export function cloneChapterExportQueue(queue: ChapterExportQueue): ChapterExportQueue {
  return {
    items: queue.items.map((item) => ({
      entry: item.entry,
      status: item.status,
      blob: item.blob,
      errorMessage: item.errorMessage,
    })),
  }
}

export function getChapterQueueDoneCount(queue: ChapterExportQueue): number {
  return queue.items.filter((item) => item.status === 'done').length
}

export function getFailedChapterIndices(queue: ChapterExportQueue): number[] {
  return queue.items.flatMap((item, index) => (item.status === 'failed' ? [index] : []))
}

export function hasFailedChapters(queue: ChapterExportQueue): boolean {
  return queue.items.some((item) => item.status === 'failed')
}

export function isChapterQueueComplete(queue: ChapterExportQueue): boolean {
  return queue.items.length > 0 && queue.items.every((item) => item.status === 'done')
}

export function getChapterQueueSummary(queue: ChapterExportQueue): string {
  const total = queue.items.length
  const done = getChapterQueueDoneCount(queue)
  const failed = getFailedChapterIndices(queue).length
  const running = queue.items.find((item) => item.status === 'running')
  if (running) return `章 ${done + 1}/${total}「${running.entry.label}」を書き出し中…`
  if (failed > 0) return `${done}/${total} 章完了（${failed} 章失敗）`
  if (done === total) return `${total}/${total} 章完了`
  return `0/${total} 章`
}

export function formatChapterQueueFailureDetail(queue: ChapterExportQueue): string {
  const failed = queue.items.filter((item) => item.status === 'failed')
  if (failed.length === 0) return '章の書き出しに失敗しました。'
  const labels = failed.map((item) => `「${item.entry.label}」`).join('、')
  const done = getChapterQueueDoneCount(queue)
  const suffix = done > 0 ? '完了済みの章は保持されています。' : ''
  return `${labels}の書き出しに失敗しました。${suffix}`
}

export async function runChapterExportQueue(
  queue: ChapterExportQueue,
  exportChapter: (
    entry: ChapterExportEntry,
    index: number,
    onChapterProgress: (progress: number) => void,
  ) => Promise<Blob>,
  options: {
    onOverallProgress: (progress: number) => void
    onQueueChange?: (queue: ChapterExportQueue) => void
    signal?: AbortSignal
    onlyIndices?: number[]
  },
): Promise<ChapterExportQueue> {
  const total = queue.items.length
  const indices = options.onlyIndices ?? queue.items.map((_, index) => index)

  for (const index of indices) {
    if (options.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    const item = queue.items[index]
    if (!item || item.status === 'done') continue

    item.status = 'running'
    item.errorMessage = undefined
    options.onQueueChange?.(queue)

    try {
      const blob = await exportChapter(item.entry, index, (chapterProgress) => {
        const completed = getChapterQueueDoneCount(queue)
        options.onOverallProgress((completed + chapterProgress) / total)
      })
      item.blob = blob
      item.status = 'done'
    } catch (err) {
      if (options.signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) throw err
      item.status = 'failed'
      item.errorMessage = err instanceof Error ? err.message : '不明なエラー'
      options.onQueueChange?.(queue)
      break
    }

    options.onQueueChange?.(queue)
  }

  options.onOverallProgress(getChapterQueueDoneCount(queue) / total)
  return queue
}

export async function zipCompletedChapterQueue(queue: ChapterExportQueue): Promise<Blob> {
  const files = queue.items.flatMap((item) =>
    item.status === 'done' && item.blob
      ? [{ name: item.entry.filename, blob: item.blob }]
      : [],
  )
  if (files.length === 0) throw new Error('書き出し済みの章がありません')
  return zipMp4Blobs(files)
}
