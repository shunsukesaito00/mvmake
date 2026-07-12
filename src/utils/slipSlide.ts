import type { AudioClip, Clip, VideoClip } from '../types/project'
import { clampTrimEnd, clampTrimStart } from './clipUtils'
import { getSourceOffsetAtLocalTime, getSpeedAtLocalTime } from './speedKeyframes'

const MIN_DURATION = 0.2
const ADJACENCY_TOLERANCE = 0.05

export function canSlipClip(clip: Clip): clip is VideoClip | AudioClip {
  return clip.type === 'video' || clip.type === 'audio'
}

export function computeSlipClip(
  clip: VideoClip | AudioClip,
  delta: number,
  mediaAssets: { id: string; duration: number }[],
): VideoClip | AudioClip | null {
  if (Math.abs(delta) < 0.0001) return clip

  const asset = mediaAssets.find((a) => a.id === clip.mediaId)
  const newSourceStart = clip.sourceStart + delta
  if (newSourceStart < 0) return null

  if (clip.type === 'video') {
    const sourceEnd = newSourceStart + getSourceOffsetAtLocalTime(clip, clip.duration)
    if (asset && sourceEnd > asset.duration + 0.001) return null
    return { ...clip, sourceStart: newSourceStart }
  }

  const speed = clip.speed ?? 1
  const sourceEnd = newSourceStart + clip.duration * speed
  if (asset && sourceEnd > asset.duration + 0.001) return null
  return { ...clip, sourceStart: newSourceStart }
}

export interface AdjacentClips {
  prev: Clip | null
  next: Clip | null
}

export function findAdjacentClips(clips: Clip[], clipId: string): AdjacentClips {
  const sorted = [...clips].sort((a, b) => a.startTime - b.startTime)
  const index = sorted.findIndex((c) => c.id === clipId)
  if (index < 0) return { prev: null, next: null }

  const curr = sorted[index]
  const prev = index > 0 ? sorted[index - 1] : null
  const next = index < sorted.length - 1 ? sorted[index + 1] : null

  return {
    prev: prev && Math.abs(prev.startTime + prev.duration - curr.startTime) <= ADJACENCY_TOLERANCE ? prev : null,
    next: next && Math.abs(curr.startTime + curr.duration - next.startTime) <= ADJACENCY_TOLERANCE ? next : null,
  }
}

export function canSlideClip(clips: Clip[], clipId: string): boolean {
  const { prev, next } = findAdjacentClips(clips, clipId)
  return prev !== null && next !== null
}

function sourceDeltaForHeadExtension(clip: VideoClip, localAmount: number): number {
  return localAmount * getSpeedAtLocalTime(clip, 0)
}

function extendClipEnd(clip: Clip, delta: number, mediaAssets: { id: string; duration: number }[]): Clip | null {
  if (delta <= 0) return shrinkClipEnd(clip, -delta)
  const newDuration = clip.duration + delta
  if (newDuration < MIN_DURATION) return null

  if (clip.type === 'video' || clip.type === 'audio') {
    const capped = clampTrimEnd(clip, newDuration, mediaAssets)
    if (capped < MIN_DURATION) return null
    return { ...clip, duration: capped, sourceDuration: capped }
  }

  return { ...clip, duration: newDuration, sourceDuration: newDuration }
}

function shrinkClipEnd(clip: Clip, amount: number): Clip | null {
  if (amount <= 0) return clip
  const newDuration = clip.duration - amount
  if (newDuration < MIN_DURATION) return null
  return { ...clip, duration: newDuration, sourceDuration: newDuration }
}

function adjustNextClipForSlideRight(next: Clip, delta: number, mediaAssets: { id: string; duration: number }[]): Clip | null {
  const newStartTime = next.startTime + delta
  const newDuration = next.duration - delta
  if (newDuration < MIN_DURATION) return null

  if (next.type === 'video') {
    const sourceDelta = getSourceOffsetAtLocalTime(next, delta)
    const trimmed = clampTrimStart(next, newStartTime, newDuration, next.sourceStart + sourceDelta, mediaAssets)
    if (!trimmed) return null
    return { ...next, ...trimmed }
  }

  if (next.type === 'audio') {
    const speed = next.speed ?? 1
    const trimmed = clampTrimStart(next, newStartTime, newDuration, next.sourceStart + delta * speed, mediaAssets)
    if (!trimmed) return null
    return { ...next, ...trimmed }
  }

  return { ...next, startTime: newStartTime, duration: newDuration, sourceDuration: newDuration }
}

function adjustNextClipForSlideLeft(next: Clip, amount: number, mediaAssets: { id: string; duration: number }[]): Clip | null {
  const newStartTime = next.startTime - amount
  if (newStartTime < -0.001) return null
  const newDuration = next.duration + amount
  if (newDuration < MIN_DURATION) return null

  if (next.type === 'video') {
    const sourceDelta = sourceDeltaForHeadExtension(next, amount)
    const trimmed = clampTrimStart(next, Math.max(0, newStartTime), newDuration, next.sourceStart - sourceDelta, mediaAssets)
    if (!trimmed) return null
    return { ...next, ...trimmed }
  }

  if (next.type === 'audio') {
    const speed = next.speed ?? 1
    const trimmed = clampTrimStart(next, Math.max(0, newStartTime), newDuration, next.sourceStart - amount * speed, mediaAssets)
    if (!trimmed) return null
    return { ...next, ...trimmed }
  }

  return { ...next, startTime: Math.max(0, newStartTime), duration: newDuration, sourceDuration: newDuration }
}

export interface SlideSnapshot {
  prev: Clip
  selected: Clip
  next: Clip
}

export function slideClipsFromSnapshot(
  snapshot: SlideSnapshot,
  delta: number,
  mediaAssets: { id: string; duration: number }[],
): SlideSnapshot | null {
  if (Math.abs(delta) < 0.0001) return snapshot

  const { prev, selected, next } = snapshot

  if (delta > 0) {
    const newPrev = extendClipEnd(prev, delta, mediaAssets)
    if (!newPrev) return null
    const newNext = adjustNextClipForSlideRight(next, delta, mediaAssets)
    if (!newNext) return null
    const newSelected = { ...selected, startTime: selected.startTime + delta }
    return { prev: newPrev, selected: newSelected, next: newNext }
  }

  const amount = -delta
  const newPrev = shrinkClipEnd(prev, amount)
  if (!newPrev) return null
  const newNext = adjustNextClipForSlideLeft(next, amount, mediaAssets)
  if (!newNext) return null
  const newSelected = { ...selected, startTime: Math.max(0, selected.startTime + delta) }
  return { prev: newPrev, selected: newSelected, next: newNext }
}

export function applySlideSnapshotToClips(clips: Clip[], snapshot: SlideSnapshot): Clip[] {
  return clips.map((c) => {
    if (c.id === snapshot.prev.id) return snapshot.prev
    if (c.id === snapshot.selected.id) return snapshot.selected
    if (c.id === snapshot.next.id) return snapshot.next
    return c
  })
}

export function slideClipOnTrack(
  clips: Clip[],
  clipId: string,
  delta: number,
  mediaAssets: { id: string; duration: number }[],
): Clip[] | null {
  const { prev, next } = findAdjacentClips(clips, clipId)
  const selected = clips.find((c) => c.id === clipId)
  if (!prev || !next || !selected) return null

  const result = slideClipsFromSnapshot({ prev, selected, next }, delta, mediaAssets)
  if (!result) return null
  return applySlideSnapshotToClips(clips, result)
}

export interface RollingEditPair {
  prev: Clip
  next: Clip
}

export function listAdjacentClipPairs(clips: Clip[]): RollingEditPair[] {
  const sorted = [...clips].sort((a, b) => a.startTime - b.startTime)
  const pairs: RollingEditPair[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const prev = sorted[i]
    const next = sorted[i + 1]
    if (Math.abs(prev.startTime + prev.duration - next.startTime) <= ADJACENCY_TOLERANCE) {
      pairs.push({ prev, next })
    }
  }
  return pairs
}

export function computeRollingEdit(
  snapshot: RollingEditPair,
  delta: number,
  mediaAssets: { id: string; duration: number }[],
): RollingEditPair | null {
  if (Math.abs(delta) < 0.0001) return snapshot

  const { prev, next } = snapshot

  if (delta > 0) {
    const newPrev = extendClipEnd(prev, delta, mediaAssets)
    if (!newPrev) return null
    const newNext = adjustNextClipForSlideRight(next, delta, mediaAssets)
    if (!newNext) return null
    return { prev: newPrev, next: newNext }
  }

  const amount = -delta
  const newPrev = shrinkClipEnd(prev, amount)
  if (!newPrev) return null
  const newNext = adjustNextClipForSlideLeft(next, amount, mediaAssets)
  if (!newNext) return null
  return { prev: newPrev, next: newNext }
}

export function rollingEditOnTrack(
  clips: Clip[],
  prevClipId: string,
  nextClipId: string,
  delta: number,
  mediaAssets: { id: string; duration: number }[],
): Clip[] | null {
  const prev = clips.find((c) => c.id === prevClipId)
  const next = clips.find((c) => c.id === nextClipId)
  if (!prev || !next) return null
  if (Math.abs(prev.startTime + prev.duration - next.startTime) > ADJACENCY_TOLERANCE) return null

  const result = computeRollingEdit({ prev, next }, delta, mediaAssets)
  if (!result) return null
  return clips.map((c) => {
    if (c.id === prevClipId) return result.prev
    if (c.id === nextClipId) return result.next
    return c
  })
}
