import type { Clip, ImageClip, Project, Track, VideoClip } from '../types/project'
import {
  DEFAULT_AUDIO,
  DEFAULT_KEN_BURNS,
} from '../types/project'

export function isCompatibleTrack(
  asset: { type: string },
  track: Track,
): boolean {
  if (asset.type === 'audio') return track.type === 'audio'
  if (asset.type === 'video' || asset.type === 'image') return track.type === 'video'
  return false
}

export function findCompatibleTrack(
  tracks: Track[],
  asset: { type: string },
): Track | undefined {
  return tracks.find((t) => isCompatibleTrack(asset, t) && !t.locked)
}

export function clampTrimEnd(
  clip: Clip,
  newDuration: number,
  mediaAssets: { id: string; duration: number }[],
): number {
  const minDuration = 0.2
  let maxDuration = newDuration

  if (clip.type === 'video' || clip.type === 'audio') {
    const asset = mediaAssets.find((a) => a.id === clip.mediaId)
    const speed = clip.type === 'video' || clip.type === 'audio' ? (clip.speed ?? 1) : 1
    if (asset) {
      maxDuration = Math.min(newDuration, (asset.duration - clip.sourceStart) / speed)
    }
  }

  return Math.max(minDuration, maxDuration)
}

export function clampTrimStart(
  clip: Clip,
  newStartTime: number,
  newDuration: number,
  newSourceStart: number,
  mediaAssets: { id: string; duration: number }[],
): { startTime: number; duration: number; sourceStart: number; sourceDuration: number } | null {
  if (newDuration < 0.2) return null

  if (clip.type === 'video' || clip.type === 'audio') {
    const asset = mediaAssets.find((a) => a.id === clip.mediaId)
    const speed = clip.speed ?? 1
    if (asset) {
      if (newSourceStart < 0) return null
      if (newSourceStart + newDuration * speed > asset.duration) return null
    }
  }

  return {
    startTime: Math.max(0, newStartTime),
    duration: newDuration,
    sourceStart: Math.max(0, newSourceStart),
    sourceDuration: newDuration,
  }
}

export type MediaClip = Extract<Clip, { type: 'video' | 'image' | 'audio' }>
export type VisualMediaClip = VideoClip | ImageClip

export function isVisualMediaClip(clip: Clip): clip is VisualMediaClip {
  return clip.type === 'video' || clip.type === 'image'
}

export function canReplaceClipWithMedia(
  clip: MediaClip,
  asset: { type: string },
): boolean {
  if (clip.type === 'audio') return asset.type === 'audio'
  if (clip.type === 'video' || clip.type === 'image') {
    return asset.type === 'video' || asset.type === 'image'
  }
  return false
}

/** 映像クリップの差し替え候補（同種 + 映像↔画像のクロス差し替え） */
export function getMediaReplaceCandidates(
  clip: MediaClip,
  mediaAssets: Array<{ id: string; type: string }>,
): Array<{ id: string; type: string }> {
  return mediaAssets.filter((asset) => canReplaceClipWithMedia(clip, asset))
}

/** 映像↔画像のクロス差し替えで新しいクリップを構築 */
export function buildCrossVisualClip(
  clip: VisualMediaClip,
  newMediaId: string,
  mediaAssets: Array<{ id: string; duration: number; type: string }>,
): VisualMediaClip | null {
  const asset = mediaAssets.find((a) => a.id === newMediaId)
  if (!asset || (asset.type !== 'video' && asset.type !== 'image')) return null
  if (asset.type === clip.type) return null

  const shared = {
    id: clip.id,
    trackId: clip.trackId,
    startTime: clip.startTime,
    transform: clip.transform,
    color: clip.color,
    crop: clip.crop,
    fadeIn: clip.fadeIn,
    fadeOut: clip.fadeOut,
    transition: clip.transition,
  }

  if (asset.type === 'image') {
    return {
      ...shared,
      type: 'image',
      mediaId: newMediaId,
      duration: clip.duration,
      sourceStart: 0,
      sourceDuration: clip.duration,
      kenBurns: clip.type === 'image' ? clip.kenBurns : { ...DEFAULT_KEN_BURNS },
    } satisfies ImageClip
  }

  const tempVideo: VideoClip = {
    ...shared,
    type: 'video',
    mediaId: newMediaId,
    duration: clip.duration,
    sourceStart: 0,
    sourceDuration: clip.duration,
    audio: clip.type === 'video' ? clip.audio : { ...DEFAULT_AUDIO },
    speed: clip.type === 'video' ? clip.speed : 1,
  }
  const updates = computeMediaReplacement(tempVideo, newMediaId, mediaAssets)
  if (!updates) return null
  return { ...tempVideo, ...updates } satisfies VideoClip
}


export interface MediaReplacementResult {
  mediaId: string
  duration: number
  sourceStart: number
  sourceDuration: number
}

/** クリップのタイミングを維持したまま別メディアへ差し替える際のフィールドを計算 */
export function computeMediaReplacement(
  clip: MediaClip,
  newMediaId: string,
  mediaAssets: { id: string; duration: number }[],
): MediaReplacementResult | null {
  const asset = mediaAssets.find((a) => a.id === newMediaId)
  if (!asset) return null

  if (clip.type === 'image') {
    return {
      mediaId: newMediaId,
      duration: clip.duration,
      sourceStart: clip.sourceStart,
      sourceDuration: clip.sourceDuration,
    }
  }

  let sourceStart = clip.sourceStart
  if (sourceStart >= asset.duration) sourceStart = 0

  const tempClip = { ...clip, mediaId: newMediaId, sourceStart }
  let duration = clampTrimEnd(tempClip, clip.duration, mediaAssets)

  const trimmed = clampTrimStart(tempClip, clip.startTime, duration, sourceStart, mediaAssets)
  if (trimmed) {
    return {
      mediaId: newMediaId,
      duration: trimmed.duration,
      sourceStart: trimmed.sourceStart,
      sourceDuration: trimmed.sourceDuration,
    }
  }

  sourceStart = 0
  duration = clampTrimEnd({ ...clip, mediaId: newMediaId, sourceStart: 0 }, clip.duration, mediaAssets)
  const fallback = clampTrimStart(
    { ...clip, mediaId: newMediaId, sourceStart: 0 },
    clip.startTime,
    duration,
    0,
    mediaAssets,
  )
  if (!fallback) return null

  return {
    mediaId: newMediaId,
    duration: fallback.duration,
    sourceStart: fallback.sourceStart,
    sourceDuration: fallback.sourceDuration,
  }
}

export function duplicateClip(clip: Clip, createId: () => string): Clip {
  const offset = 0.1
  return {
    ...structuredClone(clip),
    id: createId(),
    startTime: clip.startTime + clip.duration + offset,
  }
}

export function cloneProject(project: Project): Project {
  return {
    ...project,
    markers: project.markers ? [...project.markers] : [],
    tracks: project.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => structuredClone(c)),
    })),
    mediaAssets: [...project.mediaAssets],
  }
}

export function getAudioClipsFromProject(
  project: Project,
): Array<{
  clip: Extract<Clip, { type: 'audio' | 'video' }>
  asset: Project['mediaAssets'][0]
  isVideo: boolean
  trackMuted: boolean
}> {
  const assetMap = new Map(project.mediaAssets.map((a) => [a.id, a]))
  const result: Array<{
    clip: Extract<Clip, { type: 'audio' | 'video' }>
    asset: Project['mediaAssets'][0]
    isVideo: boolean
    trackMuted: boolean
  }> = []

  for (const track of project.tracks) {
    if (track.muted) continue
    for (const clip of track.clips) {
      if (clip.type === 'audio') {
        const asset = assetMap.get(clip.mediaId)
        if (asset) result.push({ clip, asset, isVideo: false, trackMuted: false })
      } else if (clip.type === 'video' && track.type === 'video') {
        const asset = assetMap.get(clip.mediaId)
        if (asset) result.push({ clip, asset, isVideo: true, trackMuted: false })
      }
    }
  }

  return result
}

export function trackTypeForClip(clip: Clip): Track['type'] {
  if (clip.type === 'text') return 'text'
  if (clip.type === 'audio') return 'audio'
  return 'video'
}

export function clipsOverlap(a: Clip, b: Clip): boolean {
  return a.startTime < b.startTime + b.duration && b.startTime < a.startTime + a.duration
}

export function resolveClipOverlap(
  clip: Clip,
  otherClips: Clip[],
  proposedStart: number,
): number {
  let start = proposedStart
  const duration = clip.duration

  for (const other of otherClips) {
    if (other.id === clip.id) continue
    const testClip = { ...clip, startTime: start, duration }
    if (clipsOverlap(testClip, other)) {
      start = other.startTime + other.duration + 0.05
    }
  }

  return Math.max(0, start)
}

export function rippleShiftClips(clips: Clip[], afterTime: number, delta: number): Clip[] {
  return clips.map((c) => {
    if (c.startTime >= afterTime) {
      return { ...c, startTime: Math.max(0, c.startTime + delta) }
    }
    return c
  })
}

export function getRippleDeleteDelta(clip: Clip): number {
  return -clip.duration
}

/**
 * ダッキング対象区間: 音声を持つ動画クリップの再生区間をマージして返す。
 * 近接する区間(gap < 0.1s)は1つにまとめる。
 */
export function getDuckingIntervals(project: Project): Array<{ start: number; end: number }> {
  const intervals: Array<{ start: number; end: number }> = []

  for (const track of project.tracks) {
    if (track.muted || track.type !== 'video') continue
    for (const clip of track.clips) {
      if (clip.type !== 'video') continue
      if ((clip.audio?.volume ?? 1) <= 0.01) continue
      intervals.push({ start: clip.startTime, end: clip.startTime + clip.duration })
    }
  }

  intervals.sort((a, b) => a.start - b.start)
  const merged: Array<{ start: number; end: number }> = []
  for (const iv of intervals) {
    const last = merged[merged.length - 1]
    if (last && iv.start <= last.end + 0.1) {
      last.end = Math.max(last.end, iv.end)
    } else {
      merged.push({ ...iv })
    }
  }
  return merged
}
