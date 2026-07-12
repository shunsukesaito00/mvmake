import type { Track, TrackType } from '../types/project'

export const MIN_TRACKS_BY_TYPE: Record<TrackType, number> = {
  video: 1,
  text: 1,
  audio: 1,
}

const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  video: '映像',
  text: 'テキスト',
  audio: 'オーディオ',
}

export type TrackRemovalResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'has-clips' | 'min-count' }

export function countTracksByType(tracks: Track[], type: TrackType): number {
  return tracks.filter((t) => t.type === type).length
}

export function defaultTrackName(type: TrackType, tracks: Track[]): string {
  const label = TRACK_TYPE_LABELS[type]
  const sameType = tracks.filter((t) => t.type === type)
  const usedNames = new Set(sameType.map((t) => t.name))
  let index = sameType.length + 1
  let candidate = `${label} ${index}`
  while (usedNames.has(candidate)) {
    index += 1
    candidate = `${label} ${index}`
  }
  return candidate
}

export function canRemoveTrack(tracks: Track[], trackId: string): TrackRemovalResult {
  const track = tracks.find((t) => t.id === trackId)
  if (!track) return { ok: false, reason: 'not-found' }
  if (track.clips.length > 0) return { ok: false, reason: 'has-clips' }
  if (countTracksByType(tracks, track.type) <= MIN_TRACKS_BY_TYPE[track.type]) {
    return { ok: false, reason: 'min-count' }
  }
  return { ok: true }
}

export function findTrackInsertIndex(tracks: Track[], type: TrackType, afterTrackId?: string): number {
  if (afterTrackId) {
    const idx = tracks.findIndex((t) => t.id === afterTrackId)
    if (idx >= 0) return idx + 1
  }
  for (let i = tracks.length - 1; i >= 0; i--) {
    if (tracks[i].type === type) return i + 1
  }
  return tracks.length
}

export function createTrack(type: TrackType, tracks: Track[], id: string): Track {
  return {
    id,
    name: defaultTrackName(type, tracks),
    type,
    clips: [],
    muted: false,
    locked: false,
    volume: 1,
    solo: false,
  }
}
