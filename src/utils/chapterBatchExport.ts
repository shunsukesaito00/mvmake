import { Zip, ZipPassThrough } from 'fflate'
import type { MarkerChapterRange } from './markerExport'

export class ChapterBatchExportError extends Error {
  readonly chapterLabel: string
  readonly chapterIndex: number

  constructor(chapterLabel: string, chapterIndex: number, totalChapters: number, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : '不明なエラー'
    super(`章「${chapterLabel}」(${chapterIndex + 1}/${totalChapters}章目)の書き出しに失敗しました: ${detail}`)
    this.name = 'ChapterBatchExportError'
    this.chapterLabel = chapterLabel
    this.chapterIndex = chapterIndex
    if (cause instanceof Error) this.cause = cause
  }
}

export class ChapterZipBuildError extends Error {
  constructor(entryCount: number, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : '不明なエラー'
    super(`ZIP の作成に失敗しました（${entryCount} 章分の MP4 は生成済み）: ${detail}`)
    this.name = 'ChapterZipBuildError'
    if (cause instanceof Error) this.cause = cause
  }
}

export interface ChapterExportEntry {
  filename: string
  label: string
  start: number
  duration: number
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

function rejectZipError(reject: (reason: unknown) => void, entryCount: number, err: unknown): void {
  if (err instanceof ChapterBatchExportError || isAbortError(err)) {
    reject(err)
    return
  }
  reject(new ChapterZipBuildError(entryCount, err))
}

async function zipStreaming(files: { name: string; data: Uint8Array }[], entryCount: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const parts: Uint8Array[] = []
    const zip = new Zip((err, chunk, final) => {
      if (err) {
        reject(new ChapterZipBuildError(entryCount, err))
        return
      }
      if (chunk) parts.push(chunk)
      if (final) resolve(new Blob(parts as BlobPart[], { type: 'application/zip' }))
    })

    try {
      for (const file of files) {
        const entry = new ZipPassThrough(file.name)
        zip.add(entry)
        entry.push(file.data, true)
      }
      zip.end()
    } catch (err) {
      rejectZipError(reject, entryCount, err)
    }
  })
}

/** ZIP 内ファイル名に使えない文字を除去 */
export function sanitizeFileBase(name: string): string {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 48) || 'chapter'
}

/** 章区間ごとの MP4 ファイル名と書き出し範囲を生成 */
export function buildChapterExportEntries(
  projectName: string,
  chapters: MarkerChapterRange[],
  minDuration = 0.01,
): ChapterExportEntry[] {
  const base = sanitizeFileBase(projectName || 'movie')
  return chapters
    .filter((chapter) => chapter.end - chapter.start >= minDuration)
    .map((chapter, index) => ({
      filename: `${base}_${String(index + 1).padStart(2, '0')}_${sanitizeFileBase(chapter.label)}.mp4`,
      label: chapter.label,
      start: chapter.start,
      duration: chapter.end - chapter.start,
    }))
}

export async function zipMp4Blobs(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const zipped: { name: string; data: Uint8Array }[] = []
  for (const file of files) {
    zipped.push({ name: file.name, data: new Uint8Array(await file.blob.arrayBuffer()) })
  }
  return zipStreaming(zipped, files.length)
}

/** 各章を順次エクスポートし ZIP 化。ZipPassThrough で章 MP4 を逐次投入し同時保持を抑える */
export async function exportAllChaptersToZip(
  exportChapter: (entry: ChapterExportEntry, onChapterProgress: (progress: number) => void) => Promise<Blob>,
  entries: ChapterExportEntry[],
  onOverallProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  if (entries.length === 0) {
    throw new Error('書き出し可能な章がありません')
  }

  return new Promise((resolve, reject) => {
    const parts: Uint8Array[] = []
    const zip = new Zip((err, chunk, final) => {
      if (err) {
        reject(new ChapterZipBuildError(entries.length, err))
        return
      }
      if (chunk) parts.push(chunk)
      if (final) resolve(new Blob(parts as BlobPart[], { type: 'application/zip' }))
    })

    ;(async () => {
      try {
        for (let i = 0; i < entries.length; i++) {
          if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
          const entry = entries[i]!
          let blob: Blob
          try {
            blob = await exportChapter(entry, (chapterProgress) => {
              onOverallProgress((i + chapterProgress) / entries.length)
            })
          } catch (err) {
            if (signal?.aborted || isAbortError(err)) throw err
            throw new ChapterBatchExportError(entry.label, i, entries.length, err)
          }
          const data = new Uint8Array(await blob.arrayBuffer())
          const file = new ZipPassThrough(entry.filename)
          zip.add(file)
          file.push(data, true)
        }
        onOverallProgress(1)
        zip.end()
      } catch (err) {
        rejectZipError(reject, entries.length, err)
      }
    })()
  })
}

/** 各章を順次エクスポートし、全体進捗を 0〜1 で報告 */
export async function exportAllChapters(
  exportChapter: (entry: ChapterExportEntry, onChapterProgress: (progress: number) => void) => Promise<Blob>,
  entries: ChapterExportEntry[],
  onOverallProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<{ name: string; blob: Blob }[]> {
  const results: { name: string; blob: Blob }[] = []
  for (let i = 0; i < entries.length; i++) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
    const entry = entries[i]!
    let blob: Blob
    try {
      blob = await exportChapter(entry, (chapterProgress) => {
        onOverallProgress((i + chapterProgress) / entries.length)
      })
    } catch (err) {
      if (signal?.aborted || isAbortError(err)) throw err
      throw new ChapterBatchExportError(entry.label, i, entries.length, err)
    }
    results.push({ name: entry.filename, blob })
  }
  onOverallProgress(1)
  return results
}

export function formatBatchExportSummary(entryCount: number): string {
  return `${entryCount} 章を個別 MP4 化して ZIP にまとめます`
}
