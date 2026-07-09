import { zip, type Zippable } from 'fflate'
import type { MarkerChapterRange } from './markerExport'

export interface ChapterExportEntry {
  filename: string
  label: string
  start: number
  duration: number
}

function zipAsync(data: Zippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(data, (err, result) => (err ? reject(err) : resolve(result)))
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
  const zippable: Zippable = {}
  for (const file of files) {
    zippable[file.name] = new Uint8Array(await file.blob.arrayBuffer())
  }
  const zipped = await zipAsync(zippable)
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
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
    const entry = entries[i]
    const blob = await exportChapter(entry, (chapterProgress) => {
      onOverallProgress((i + chapterProgress) / entries.length)
    })
    results.push({ name: entry.filename, blob })
  }
  onOverallProgress(1)
  return results
}

export function formatBatchExportSummary(entryCount: number): string {
  return `${entryCount} 章を個別 MP4 化して ZIP にまとめます`
}
