import type { Track, Transition } from '../types/project'

export type BatchTransitionScope = 'selected-track' | 'all-video-tracks'

const ADJACENCY_TOLERANCE = 0.05

/** 同一トラック上で前クリップと隣接する映像クリップ(2枚目以降)の ID */
export function getAdjacentTransitionTargets(track: Track): string[] {
  const visual = track.clips
    .filter((clip) => clip.type === 'video' || clip.type === 'image')
    .sort((a, b) => a.startTime - b.startTime)

  const ids: string[] = []
  for (let i = 1; i < visual.length; i++) {
    const prev = visual[i - 1]
    const curr = visual[i]
    const prevEnd = prev.startTime + prev.duration
    if (Math.abs(curr.startTime - prevEnd) <= ADJACENCY_TOLERANCE) {
      ids.push(curr.id)
    }
  }
  return ids
}

export function collectBatchTransitionClipIds(
  tracks: Track[],
  scope: BatchTransitionScope,
  selectedTrackId?: string | null,
): string[] {
  const targetTracks =
    scope === 'selected-track'
      ? tracks.filter((track) => track.id === selectedTrackId && track.type === 'video')
      : tracks.filter((track) => track.type === 'video')

  const ids = new Set<string>()
  for (const track of targetTracks) {
    for (const id of getAdjacentTransitionTargets(track)) ids.add(id)
  }
  return [...ids]
}

export function formatBatchTransitionSummary(count: number, label: string): string {
  return `${count}件のクリップに${label}を一括適用しました`
}

export function isValidBatchTransition(transition: Transition): boolean {
  return transition.duration > 0
}
