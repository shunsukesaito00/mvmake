/** この件数以上は高速インポート（メタデータ並列・サムネイル遅延） */
export const BULK_IMPORT_FILE_THRESHOLD = 8

/** メタデータ抽出の並列数 */
export const MEDIA_METADATA_CONCURRENCY = 4

/** サムネイル/波形生成の同時実行数 */
export const ENRICHMENT_CONCURRENCY = 2

export function isBulkMediaImport(fileCount: number): boolean {
  return fileCount >= BULK_IMPORT_FILE_THRESHOLD
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []
  const limit = Math.max(1, Math.min(concurrency, items.length))
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) break
      results[index] = await mapper(items[index]!, index)
    }
  })

  await Promise.all(workers)
  return results
}

export async function enqueueEnrichmentTasks<T extends { id: string }>(
  items: T[],
  concurrency: number,
  enrich: (item: T) => Promise<unknown>,
  onStart: (item: T) => void,
  onComplete: (item: T, result: unknown) => void,
  onFinally: (item: T) => void,
): Promise<void> {
  if (items.length === 0) return

  await mapWithConcurrency(items, concurrency, async (item) => {
    onStart(item)
    try {
      const result = await enrich(item)
      onComplete(item, result)
    } finally {
      onFinally(item)
    }
  })
}
