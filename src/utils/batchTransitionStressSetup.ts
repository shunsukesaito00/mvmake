import type { ImageClip, MediaAsset, Project, Track } from '../types/project'
import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { collectBatchTransitionClipIds } from './batchTransition'
import { createId } from './id'
import { useProjectStore } from '../store/projectStore'

/** 主映像トラックの隣接クリップ数（トランジション対象は clipCount - 1） */
export const BATCH_TRANSITION_STRESS_PRIMARY_CLIPS = 21
/** 副映像トラックの隣接クリップ数 */
export const BATCH_TRANSITION_STRESS_SECONDARY_CLIPS = 11
export const BATCH_TRANSITION_STRESS_CLIP_DURATION_SEC = 3

function placeholderImageAsset(index: number): MediaAsset {
  return {
    id: `stress-batch-img-${index}`,
    name: `batch-photo-${String(index + 1).padStart(3, '0')}.jpg`,
    type: 'image',
    blob: new Blob(),
    url: `blob:stress-batch-${index}`,
    duration: 10,
  }
}

function buildAdjacentImageClips(
  trackId: string,
  count: number,
  mediaId: string,
  durationSec: number,
): ImageClip[] {
  return Array.from({ length: count }, (_, i): ImageClip => ({
    id: createId(),
    trackId,
    type: 'image',
    mediaId,
    startTime: i * durationSec,
    duration: durationSec,
    sourceStart: 0,
    sourceDuration: durationSec,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { ...DEFAULT_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
  }))
}

export function createBatchTransitionStressProject(): Project {
  const asset = placeholderImageAsset(0)
  const primaryTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }
  const secondaryTrack: Track = {
    id: createId(),
    name: '映像 2',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }
  const textTrack: Track = {
    id: createId(),
    name: 'テキスト',
    type: 'text',
    clips: [],
    muted: false,
    locked: false,
  }
  const audioTrack: Track = {
    id: createId(),
    name: 'BGM',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
  }

  primaryTrack.clips = buildAdjacentImageClips(
    primaryTrack.id,
    BATCH_TRANSITION_STRESS_PRIMARY_CLIPS,
    asset.id,
    BATCH_TRANSITION_STRESS_CLIP_DURATION_SEC,
  )
  secondaryTrack.clips = buildAdjacentImageClips(
    secondaryTrack.id,
    BATCH_TRANSITION_STRESS_SECONDARY_CLIPS,
    asset.id,
    BATCH_TRANSITION_STRESS_CLIP_DURATION_SEC,
  )

  return normalizeProject({
    id: createId(),
    name: '一括トランジションストレステスト',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [asset],
    markers: [],
    tracks: [primaryTrack, secondaryTrack, textTrack, audioTrack],
  })
}

export interface BatchTransitionStressStats {
  primaryTrackId: string
  secondaryTrackId: string
  primaryClipCount: number
  secondaryClipCount: number
  allVideoTargetCount: number
  primaryOnlyTargetCount: number
  secondaryOnlyTargetCount: number
  firstPrimaryClipId: string
  firstSecondaryClipId: string
}

export function getBatchTransitionStressStats(project: Project): BatchTransitionStressStats {
  const primaryTrack = project.tracks.find((t) => t.name === '映像 1' && t.type === 'video')
  const secondaryTrack = project.tracks.find((t) => t.name === '映像 2' && t.type === 'video')
  if (!primaryTrack || !secondaryTrack) {
    throw new Error('batch transition stress project: missing video tracks')
  }

  const primaryOnlyTargetCount = collectBatchTransitionClipIds(
    project.tracks,
    'selected-track',
    primaryTrack.id,
  ).length
  const secondaryOnlyTargetCount = collectBatchTransitionClipIds(
    project.tracks,
    'selected-track',
    secondaryTrack.id,
  ).length

  return {
    primaryTrackId: primaryTrack.id,
    secondaryTrackId: secondaryTrack.id,
    primaryClipCount: primaryTrack.clips.length,
    secondaryClipCount: secondaryTrack.clips.length,
    allVideoTargetCount: collectBatchTransitionClipIds(project.tracks, 'all-video-tracks').length,
    primaryOnlyTargetCount,
    secondaryOnlyTargetCount,
    firstPrimaryClipId: primaryTrack.clips[0]!.id,
    firstSecondaryClipId: secondaryTrack.clips[0]!.id,
  }
}

export function seedBatchTransitionStress(): BatchTransitionStressStats {
  const project = createBatchTransitionStressProject()
  useProjectStore.getState().loadProject(project)
  return getBatchTransitionStressStats(project)
}
