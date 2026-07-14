import type { ChapterExportEntry } from './chapterBatchExport'
import { sanitizeFileBase, zipMp4Blobs } from './chapterBatchExport'

export type ChapterQueueItemStatus = 'pending' | 'running' | 'done' | 'failed'

export type ChapterExportQueueItem = {
  entry: ChapterExportEntry
  status: ChapterQueueItemStatus
  blob?: Blob
  errorMessage?: string
  /** 書き出し中のみ 0〜1 */
  progress?: number
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
      progress: item.progress,
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

export function hasPartialChapterProgress(queue: ChapterExportQueue): boolean {
  return queue.items.some((item) => item.status === 'done' || item.status === 'failed')
}

export function getPendingChapterIndices(queue: ChapterExportQueue): number[] {
  return queue.items.flatMap((item, index) => (item.status === 'pending' ? [index] : []))
}

export function getResumableChapterCount(queue: ChapterExportQueue): number {
  const done = getChapterQueueDoneCount(queue)
  if (done === 0 || hasFailedChapters(queue)) return 0
  const pending = getPendingChapterIndices(queue).length
  return pending > 0 ? pending : 0
}

/** キャンセル時に書き出し中の章を pending に戻し、完了済み章は保持する */
export function finalizeChapterQueueOnAbort(queue: ChapterExportQueue): ChapterExportQueue {
  for (const item of queue.items) {
    if (item.status === 'running') {
      item.status = 'pending'
      item.progress = undefined
    }
  }
  return queue
}

export function formatChapterQueueItemStatus(status: ChapterQueueItemStatus): string {
  switch (status) {
    case 'pending':
      return '待機中'
    case 'running':
      return '書き出し中'
    case 'done':
      return '完了'
    case 'failed':
      return '失敗'
  }
}

export function formatBatchExportProgressDetail(
  queue: ChapterExportQueue,
  overallProgress: number,
  etaLabel: string,
): string {
  const total = queue.items.length
  const done = getChapterQueueDoneCount(queue)
  const running = queue.items.find((item) => item.status === 'running')
  const percent = Math.round(overallProgress * 100)
  if (running) {
    const chapterNum = done + 1
    const chapterPercent =
      running.progress != null ? ` ${Math.round(running.progress * 100)}%` : ''
    return `章 ${chapterNum}/${total}「${running.entry.label}」${chapterPercent} · 全体 ${percent}% · ${etaLabel}`
  }
  return `${percent}% 完了 · ${etaLabel}`
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
  const lines = failed.map((item) => {
    const label = `「${item.entry.label}」`
    return item.errorMessage ? `${label}: ${item.errorMessage}` : label
  })
  const done = getChapterQueueDoneCount(queue)
  const suffix = done > 0 ? '完了済みの章は保持されています。' : ''
  return `${lines.join('\n')}${suffix ? `\n${suffix}` : ''}`
}

export function formatChapterQueueCancelDetail(queue: ChapterExportQueue): string {
  const done = getChapterQueueDoneCount(queue)
  const pending = getPendingChapterIndices(queue).length
  if (done > 0) {
    const pendingPart = pending > 0 ? `残り ${pending} 章は未書き出しです。` : ''
    return `${done} 章が完了済みです。${pendingPart}完了分を ZIP で保存するか、続きから再試行できます。`
  }
  return '処理は中断されました。設定を変更して再試行できます。'
}

/** 全章完了前に、完了済み章が 1 つ以上あるとき部分 ZIP を保存できる */
export function canDownloadPartialChapterZip(queue: ChapterExportQueue): boolean {
  return getChapterQueueDoneCount(queue) > 0 && !isChapterQueueComplete(queue)
}

export function getPartialChapterZipButtonLabel(doneCount: number): string {
  return `完了した ${doneCount} 章を ZIP で保存`
}

export function getPartialChapterZipHint(doneCount: number): string {
  return `書き出し済みの ${doneCount} 章だけを今すぐ ZIP ダウンロードできます。未完了の章は含まれません。`
}

export function buildPartialChapterZipFilename(projectName: string, doneCount: number): string {
  return `${sanitizeFileBase(projectName || 'movie')}_chapters_partial_${doneCount}.zip`
}

export function canSkipFailedAndContinue(queue: ChapterExportQueue): boolean {
  return hasFailedChapters(queue) && getPendingChapterIndices(queue).length > 0
}

export function getSkipFailedContinueButtonLabel(pendingCount: number): string {
  return pendingCount > 0 ? `失敗をスキップして続行（残り ${pendingCount} 章）` : '失敗をスキップして続行'
}

export function getSkipFailedContinueHint(pendingCount: number): string {
  return `失敗した章はそのまま残し、未完了の ${pendingCount} 章だけを書き出します。終わったら成功章だけの ZIP を保存します。`
}

/** 未処理がなく、完了と失敗が混在している（部分成功） */
export function isChapterQueuePartiallySuccessful(queue: ChapterExportQueue): boolean {
  if (queue.items.length === 0) return false
  if (getPendingChapterIndices(queue).length > 0) return false
  if (queue.items.some((item) => item.status === 'running')) return false
  return getChapterQueueDoneCount(queue) > 0 && hasFailedChapters(queue)
}

export function formatChapterQueueSkipContinueSummary(queue: ChapterExportQueue): string {
  const done = getChapterQueueDoneCount(queue)
  const failed = getFailedChapterIndices(queue).length
  const failedLabels = queue.items
    .filter((item) => item.status === 'failed')
    .map((item) => `「${item.entry.label}」`)
    .join('、')
  if (failed === 0) return `${done} 章を ZIP で書き出しました`
  return `${done} 章を ZIP 保存（${failed} 章失敗: ${failedLabels}）`
}

export function buildPartialSuccessChapterZipFilename(projectName: string, doneCount: number, failedCount: number): string {
  return `${sanitizeFileBase(projectName || 'movie')}_chapters_${doneCount}ok_${failedCount}fail.zip`
}

/** 章ごとの成功/失敗一覧をコピー用テキストにする */
export function formatChapterQueueCopySummary(queue: ChapterExportQueue, projectName = ''): string {
  const total = queue.items.length
  const done = getChapterQueueDoneCount(queue)
  const failed = getFailedChapterIndices(queue).length
  const pending = getPendingChapterIndices(queue).length
  const header = [
    projectName ? `プロジェクト: ${projectName}` : null,
    `章書き出し結果: ${done}/${total} 完了・${failed} 失敗・${pending} 待機`,
    '',
  ].filter((line): line is string => line != null)

  const body = queue.items.map((item) => {
    const status = formatChapterQueueItemStatus(item.status)
    const err =
      item.status === 'failed' && item.errorMessage ? ` — ${item.errorMessage}` : ''
    return `- ${item.entry.label}: ${status}${err}`
  })

  return [...header, ...body].join('\n')
}

export function canCopyChapterQueueSummary(queue: ChapterExportQueue): boolean {
  return queue.items.some(
    (item) => item.status === 'done' || item.status === 'failed' || item.status === 'pending',
  ) && hasFailedChapters(queue)
}

export function getCopyChapterQueueSummaryButtonLabel(): string {
  return '失敗サマリーをコピー'
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through
  }
  try {
    if (typeof document === 'undefined') return false
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
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
    /** true のとき失敗しても残り章を続行する */
    continueOnError?: boolean
  },
): Promise<ChapterExportQueue> {
  const total = queue.items.length
  const indices = options.onlyIndices ?? queue.items.map((_, index) => index)
  const continueOnError = options.continueOnError === true

  for (const index of indices) {
    if (options.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')

    const item = queue.items[index]
    if (!item || item.status === 'done') continue

    item.status = 'running'
    item.progress = 0
    item.errorMessage = undefined
    options.onQueueChange?.(queue)

    try {
      const blob = await exportChapter(item.entry, index, (chapterProgress) => {
        item.progress = chapterProgress
        options.onQueueChange?.(queue)
        const completed = getChapterQueueDoneCount(queue)
        options.onOverallProgress((completed + chapterProgress) / total)
      })
      item.blob = blob
      item.status = 'done'
      item.progress = undefined
    } catch (err) {
      if (options.signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) throw err
      item.status = 'failed'
      item.progress = undefined
      item.errorMessage = err instanceof Error ? err.message : '不明なエラー'
      options.onQueueChange?.(queue)
      if (!continueOnError) break
      continue
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
