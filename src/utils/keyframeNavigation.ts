import type { Clip } from '../types/project'

export type KeyframeNavType = 'transform' | 'volume' | 'speed'

export interface SelectedNavKeyframe {
  clipId: string
  type: KeyframeNavType
  keyframeId: string
}

export interface KeyframeNavEntry {
  id: string
  type: KeyframeNavType
  time: number
}

const TIME_EPS = 0.0005

const TYPE_ORDER: Record<KeyframeNavType, number> = {
  speed: 0,
  volume: 1,
  transform: 2,
}

function compareEntries(a: KeyframeNavEntry, b: KeyframeNavEntry): number {
  if (Math.abs(a.time - b.time) > TIME_EPS) return a.time - b.time
  return TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
}

export function listClipKeyframeNavEntries(clip: Clip): KeyframeNavEntry[] {
  const entries: KeyframeNavEntry[] = []

  if ('transformKeyframes' in clip && clip.transformKeyframes?.length) {
    for (const kf of clip.transformKeyframes) {
      entries.push({ id: kf.id, type: 'transform', time: kf.time })
    }
  }

  if (clip.type === 'video' || clip.type === 'audio') {
    for (const kf of clip.audio.volumeKeyframes ?? []) {
      entries.push({ id: kf.id, type: 'volume', time: kf.time })
    }
  }

  if (clip.type === 'video') {
    for (const kf of clip.speedKeyframes ?? []) {
      entries.push({ id: kf.id, type: 'speed', time: kf.time })
    }
  }

  return entries.sort(compareEntries)
}

export function findAdjacentKeyframeNavEntry(
  entries: KeyframeNavEntry[],
  localTime: number,
  direction: 'prev' | 'next',
  currentKeyframeId?: string | null,
): KeyframeNavEntry | null {
  if (!entries.length) return null
  const sorted = [...entries].sort(compareEntries)

  if (direction === 'next') {
    if (currentKeyframeId) {
      const idx = sorted.findIndex((e) => e.id === currentKeyframeId)
      if (idx >= 0 && idx < sorted.length - 1) {
        const current = sorted[idx]
        if (Math.abs(current.time - localTime) <= TIME_EPS) {
          return sorted[idx + 1]
        }
      }
    }
    return sorted.find((e) => e.time > localTime + TIME_EPS) ?? null
  }

  if (currentKeyframeId) {
    const idx = sorted.findIndex((e) => e.id === currentKeyframeId)
    if (idx > 0) {
      const current = sorted[idx]
      if (Math.abs(current.time - localTime) <= TIME_EPS) {
        return sorted[idx - 1]
      }
    }
  }

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].time < localTime - TIME_EPS) return sorted[i]
  }
  return null
}

export function clipLocalTimeAt(clipStartTime: number, absoluteTime: number, clipDuration: number): number {
  return Math.max(0, Math.min(clipDuration, absoluteTime - clipStartTime))
}
