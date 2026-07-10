/** 時刻 t で描画候補になりうるクリップ index（隣接トランジション用に前後も含む） */
export function getCandidateVisualClipIndices(
  sorted: Array<{ startTime: number; duration: number }>,
  time: number,
): number[] {
  if (sorted.length === 0) return []

  let lo = 0
  let hi = sorted.length - 1
  let anchor = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].startTime <= time) {
      anchor = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  const indices = new Set<number>()
  for (let i = anchor - 1; i <= anchor + 2; i++) {
    if (i >= 0 && i < sorted.length) indices.add(i)
  }
  return [...indices].sort((a, b) => a - b)
}
