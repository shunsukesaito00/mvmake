import { create } from 'zustand'
import {
  type AudioClip,
  type AdjustmentClip,
  type Clip,
  DEFAULT_AUDIO,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_DUCKING,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  DEFAULT_TEXT_LINE_HEIGHT,
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  DEFAULT_VISUAL_FADE,
  type ImageClip,
  type LutAsset,
  type MediaAsset,
  normalizeProject,
  type Project,
  PROJECT_TEMPLATES,
  type ProjectTemplate,
  type TextClip,
  type TextPreset,
  type TextStyle,
  type TimelineMarker,
  type Track,
  type TrackType,
  type Transition,
  type TransitionType,
  type VideoClip,
} from '../types/project'
import { clearMediaCache } from '../engine/compositor'
import { audioEngine } from '../engine/audioEngine'
import { createId } from '../utils/id'
import { buildPhotoGuideClips, buildTemplateMarkers, buildTemplateTextClips } from '../utils/weddingTemplate'
import { buildTextClipsFromSrtCues, parseSrt } from '../utils/srtParser'
import { isPhotoGuideClip } from '../utils/photoGuide'
import { buildGuideSlideshowImageClips } from '../utils/photoGuideSlideshow'
import { findChapterRangeByMarkerId, isExportableChapterRange } from '../utils/chapterRangeExport'
import { beatMarkerLabel, countBeatMarkers, generateBeatMarkerTimes } from '../utils/beatMarkers'
import { normalizeMarkerUpdates } from '../utils/markerEdit'
import { collectBatchTransitionClipIds, collectBatchTransitionRemovalClipIds, type BatchTransitionScope } from '../utils/batchTransition'
import {
  buildCrossVisualClip,
  canReplaceClipWithMedia,
  cloneProject,
  computeMediaReplacement,
  duplicateClip,
  findCompatibleTrack,
  getRippleDeleteDelta,
  isCompatibleTrack,
  isVisualMediaClip,
  resolveClipOverlap,
  rippleShiftClips,
  rippleTrimClipsOnTrack,
  trackTypeForClip,
} from '../utils/clipUtils'
import { getProjectDuration, sanitizeMediaDuration } from '../utils/time'
import type { ProjectSettingsPreset } from '../types/projectSettingsPreset'
import type { UserProjectTemplate } from '../types/userProjectTemplate'
import { snapshotFromProjectSettingsPreset } from '../utils/projectSettingsPresetUtils'
import { applyUserProjectTemplateToTracks } from '../utils/userProjectTemplate'
import { loadTimelinePixelsPerSecond, saveTimelinePixelsPerSecond } from '../persistence/timelineZoom'
import { clampTimelinePixelsPerSecond } from '../utils/timelineZoom'
import { parseCubeLut, preloadProjectLuts, primeParsedLutCache, clearParsedLutCache } from '../utils/cubeLut'
import {
  canSlideClip,
  canSlipClip,
  computeSlipClip,
  rollingEditOnTrack,
  slideClipOnTrack,
  type SlideSnapshot,
  type RollingEditPair,
} from '../utils/slipSlide'
import { splitTransformKeyframes, type TransformTimelineProperty } from '../utils/transformKeyframesTimeline'
import { splitVolumeKeyframes } from '../utils/volumeKeyframesTimeline'
import { ensureProjectFontsLoaded } from '../utils/googleFonts'
import { splitSpeedKeyframes } from '../utils/speedKeyframesTimeline'
import { getSourceOffsetAtLocalTime } from '../utils/speedKeyframes'
import { canRemoveTrack, createTrack, findTrackInsertIndex } from '../utils/trackManagement'
import { type PlaybackShuttleRate, cycleForwardShuttleRate } from '../utils/playbackShuttle'
import { prepareTrackClipsForInsert } from '../utils/rippleInsert'
import {
  clipLocalTimeAt,
  findAdjacentKeyframeNavEntry,
  listClipKeyframeNavEntries,
  type SelectedNavKeyframe,
} from '../utils/keyframeNavigation'
import { findPreferredNarrationTrack } from '../utils/videoAudioLink'

const MAX_HISTORY = 50

export interface SlideshowOptions {
  durationPerImage: number
  transitionType: TransitionType | 'none'
  transitionDuration: number
  kenBurns: boolean
}

export type GuideSlideshowOptions = Omit<SlideshowOptions, 'durationPerImage'>

function createDefaultTracks(): Track[] {
  return [
    { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
    { id: createId(), name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
    { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    { id: createId(), name: '調整', type: 'video', clips: [], muted: false, locked: false },
    { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
  ]
}

function createDefaultProject(): Project {
  return normalizeProject({
    id: createId(),
    name: '新規プロジェクト',
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: createDefaultTracks(),
    mediaAssets: [],
    lutAssets: [],
    markers: [],
  })
}

export interface TimelineDragState {
  clipId: string
  mode: 'move' | 'trimStart' | 'trimEnd' | 'slip' | 'slide' | 'rollingEdit' | 'playhead' | 'volumeKeyframe' | 'speedKeyframe' | 'speedBezierHandle' | 'transformKeyframe' | 'transformBezierHandle' | 'marker'
  startX: number
  startY: number
  originalStartTime: number
  originalDuration: number
  originalSourceStart: number
  originalTrackId: string
  originalTime?: number
  keyframeId?: string
  originalKeyframeTime?: number
  originalKeyframeVolume?: number
  originalKeyframeSpeed?: number
  originalKeyframeOpacity?: number
  transformKeyframeProperty?: TransformTimelineProperty
  originalKeyframePropertyValue?: number
  transformBezierHandleType?: 'in' | 'out'
  originalBezierTimeOffset?: number
  originalBezierValueOffset?: number
  transformTimelineLaneHeight?: number
  markerId?: string
  slideSnapshot?: SlideSnapshot
  rollingEditSnapshot?: RollingEditPair
  originalEditTime?: number
  /** 複数選択時の一括移動用（主クリップ以外） */
  companionMoves?: Array<{ clipId: string; originalStartTime: number; originalTrackId: string }>
}

function syncClipSelection(ids: string[]) {
  return { selectedClipIds: ids, selectedClipId: ids[0] ?? null }
}

function clearClipSelectionState() {
  return syncClipSelection([])
}

export type TimelineEditTool = 'selection' | 'slip' | 'slide'
export type ColorPreviewMode = 'normal' | 'beforeAfter'
export type { SelectedNavKeyframe } from '../utils/keyframeNavigation'

interface ProjectState {
  project: Project
  currentTime: number
  isPlaying: boolean
  selectedClipIds: string[]
  /** 後方互換: 先頭の選択クリップ ID */
  selectedClipId: string | null
  selectedMarkerId: string | null
  pixelsPerSecond: number
  dragState: TimelineDragState | null
  exportProgress: number
  isExporting: boolean
  restoreReady: boolean
  past: Project[]
  future: Project[]
  clipboard: Clip | null
  rippleDelete: boolean
  rippleInsert: boolean
  inPoint: number | null
  outPoint: number | null
  showSafeAreas: boolean
  loopPlayback: boolean
  showPlayHint: boolean
  showExportHint: boolean
  coachmarkFromSample: boolean
  timelineEditTool: TimelineEditTool
  colorPreviewMode: ColorPreviewMode
  showColorScope: boolean
  playbackShuttleRate: PlaybackShuttleRate
  selectedNavKeyframe: SelectedNavKeyframe | null

  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackShuttleRate: (rate: PlaybackShuttleRate) => void
  shuttleForward: () => void
  shuttleStop: () => void
  setSelectedClipId: (id: string | null) => void
  setSelectedClipIds: (ids: string[]) => void
  selectClipAtClick: (clipId: string, additive: boolean) => void
  selectAllClipsOnActiveTrack: () => void
  clearClipSelection: () => void
  setSelectedMarkerId: (id: string | null) => void
  setPixelsPerSecond: (pps: number) => void
  setDragState: (state: TimelineDragState | null) => void
  setExportProgress: (progress: number) => void
  setIsExporting: (exporting: boolean) => void
  setRestoreReady: (ready: boolean) => void
  setProjectName: (name: string) => void
  setRippleDelete: (v: boolean) => void
  setRippleInsert: (v: boolean) => void
  setShowSafeAreas: (v: boolean) => void
  setLoopPlayback: (v: boolean) => void
  setShowPlayHint: (v: boolean) => void
  setShowExportHint: (v: boolean) => void
  setCoachmarkFromSample: (v: boolean) => void
  setTimelineEditTool: (tool: TimelineEditTool) => void
  setColorPreviewMode: (mode: ColorPreviewMode) => void
  setShowColorScope: (show: boolean) => void
  setInPoint: (time: number | null) => void
  setOutPoint: (time: number | null) => void
  clearInOut: () => void
  setInOutFromMarker: (markerId: string) => boolean

  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  addMediaAsset: (asset: MediaAsset) => void
  importLutFile: (file: File) => Promise<boolean>
  removeLutAsset: (id: string) => void
  updateMediaAsset: (id: string, updates: Partial<MediaAsset>) => void
  removeMediaAsset: (id: string) => void
  addClipFromMedia: (mediaId: string, trackId?: string, startTime?: number) => boolean
  addSlideshow: (mediaIds: string[], options: SlideshowOptions) => number
  addSlideshowToGuide: (guideClipId: string, mediaIds: string[], options: GuideSlideshowOptions) => number
  addTextClip: (preset: TextPreset, trackId?: string, startTime?: number) => void
  addAdjustmentClip: (trackId?: string, startTime?: number, duration?: number) => void
  importSrtSubtitles: (content: string, trackId?: string) => number
  updateClip: (clipId: string, updates: Partial<Clip>, recordHistory?: boolean) => void
  replaceClipMedia: (clipId: string, newMediaId: string) => boolean
  removeClip: (clipId: string, ripple?: boolean) => void
  removeSelectedClips: (ripple?: boolean) => void
  duplicateSelectedClip: () => void
  /** クリップを同位置に複製して新IDを返す。履歴は呼び出し側で積むこと(Alt+ドラッグ用) */
  duplicateClipInPlace: (clipId: string) => string | null
  copySelectedClip: () => void
  pasteClip: () => void
  splitClipAt: (clipId: string, time: number) => void
  moveClip: (clipId: string, trackId: string, startTime: number, recordHistory?: boolean) => void
  slipSelectedClip: (deltaSeconds: number) => boolean
  slideSelectedClip: (deltaSeconds: number) => boolean
  rollingTrimAtEditPoint: (prevClipId: string, nextClipId: string, deltaSeconds: number, recordHistory?: boolean) => boolean
  setSelectedNavKeyframe: (selection: SelectedNavKeyframe | null) => void
  jumpToAdjacentKeyframe: (direction: 'prev' | 'next') => boolean
  detachVideoAudio: (clipId: string) => boolean
  linkVideoAudio: (clipId: string) => boolean
  prepareNarrationForVideoClip: (clipId: string) => {
    clipId: string
    audioTrackId: string
    startTime: number
    duration: number
  } | null
  applyRippleTrimOnTrack: (trackId: string, trimmedClipId: string, endBefore: number, delta: number) => void
  setClipTransition: (clipId: string, transition: Transition | undefined) => void
  applyBatchTransitions: (
    scope: BatchTransitionScope,
    transition: Transition,
  ) => number
  clearBatchTransitions: (scope: BatchTransitionScope) => number
  toggleTrackMute: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void
  setTrackVolume: (trackId: string, volume: number, recordHistory?: boolean) => void
  toggleTrackLock: (trackId: string) => void
  addTrack: (type: TrackType, afterTrackId?: string) => string
  removeTrack: (trackId: string) => boolean
  renameTrack: (trackId: string, name: string) => void
  setProjectSettings: (settings: { width?: number; height?: number; fps?: number }) => void
  applyProjectSettingsPreset: (preset: ProjectSettingsPreset) => void
  applyTemplate: (template: ProjectTemplate) => void
  applyUserProjectTemplate: (template: UserProjectTemplate) => void
  createProjectFromUserTemplate: (template: UserProjectTemplate) => void
  addMarker: (time: number, label?: string) => void
  addBeatMarker: (time?: number) => void
  addBeatMarkersAtInterval: (interval: number) => number
  updateMarker: (id: string, updates: Partial<Pick<TimelineMarker, 'label' | 'time'>>, recordHistory?: boolean) => void
  removeMarker: (id: string) => void

  getSelectedClip: () => Clip | null
  getSelectedMarker: () => TimelineMarker | null
  getProjectDuration: () => number
  getSnapPoints: (excludeClipId?: string, excludeMarkerId?: string) => number[]
  getPlaybackRange: () => { start: number; end: number }
  resetProject: () => void
  loadProject: (project: Project) => void
}

function findClip(project: Project, clipId: string): { clip: Clip; track: Track } | null {
  for (const track of project.tracks) {
    const clip = track.clips.find((c) => c.id === clipId)
    if (clip) return { clip, track }
  }
  return null
}

function createClipFromMedia(asset: MediaAsset, trackId: string, startTime: number): Clip {
  const mediaDuration = sanitizeMediaDuration(asset.duration)
  const base = {
    id: createId(),
    trackId,
    startTime,
    duration: mediaDuration,
    sourceStart: 0,
    sourceDuration: mediaDuration,
  }

  if (asset.type === 'video') {
    return {
      ...base,
      type: 'video',
      mediaId: asset.id,
      transform: { ...DEFAULT_TRANSFORM },
      audio: { ...DEFAULT_AUDIO },
      speed: 1,
      color: { ...DEFAULT_COLOR },
      crop: { ...DEFAULT_CROP },
      ...DEFAULT_VISUAL_FADE,
    } satisfies VideoClip
  }

  if (asset.type === 'image') {
    return {
      ...base,
      type: 'image',
      mediaId: asset.id,
      transform: { ...DEFAULT_TRANSFORM },
      kenBurns: { ...DEFAULT_KEN_BURNS },
      color: { ...DEFAULT_COLOR },
      crop: { ...DEFAULT_CROP },
      ...DEFAULT_VISUAL_FADE,
    } satisfies ImageClip
  }

  return {
    ...base,
    type: 'audio',
    mediaId: asset.id,
    audio: { ...DEFAULT_AUDIO },
    speed: 1,
    ducking: { ...DEFAULT_DUCKING },
  } satisfies AudioClip
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createDefaultProject(),
  currentTime: 0,
  isPlaying: false,
  selectedClipIds: [],
  selectedClipId: null,
  selectedMarkerId: null,
  pixelsPerSecond: loadTimelinePixelsPerSecond() ?? 80,
  dragState: null,
  exportProgress: 0,
  isExporting: false,
  restoreReady: false,
  past: [],
  future: [],
  clipboard: null,
  rippleDelete: true,
  rippleInsert: false,
  inPoint: null,
  outPoint: null,
  showSafeAreas: false,
  loopPlayback: false,
  showPlayHint: false,
  showExportHint: false,
  coachmarkFromSample: false,
  timelineEditTool: 'selection',
  colorPreviewMode: 'normal',
  showColorScope: false,
  playbackShuttleRate: 1,
  selectedNavKeyframe: null,

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set((state) => ({
    isPlaying: playing,
    playbackShuttleRate: playing ? state.playbackShuttleRate : 1,
  })),
  setPlaybackShuttleRate: (rate) => set({ playbackShuttleRate: rate }),
  shuttleForward: () => {
    const state = get()
    const { start, end } = state.getPlaybackRange()
    if (state.currentTime >= end) set({ currentTime: start })

    if (!state.isPlaying) {
      set({ playbackShuttleRate: 1, isPlaying: true })
      return
    }
    set({ playbackShuttleRate: cycleForwardShuttleRate(state.playbackShuttleRate) })
  },
  shuttleStop: () => set({ isPlaying: false, playbackShuttleRate: 1 }),
  setSelectedClipId: (id) => set((state) => ({
    ...syncClipSelection(id ? [id] : []),
    selectedMarkerId: null,
    selectedNavKeyframe: id && state.selectedNavKeyframe?.clipId === id
      ? state.selectedNavKeyframe
      : null,
  })),
  setSelectedClipIds: (ids) => set({ ...syncClipSelection(ids), selectedMarkerId: null }),
  selectClipAtClick: (clipId, additive) => {
    const { selectedClipIds } = get()
    if (additive) {
      const next = selectedClipIds.includes(clipId)
        ? selectedClipIds.filter((id) => id !== clipId)
        : [...selectedClipIds, clipId]
      set({ ...syncClipSelection(next), selectedMarkerId: null })
      return
    }
    set({ ...syncClipSelection([clipId]), selectedMarkerId: null })
  },
  selectAllClipsOnActiveTrack: () => {
    const { project, selectedClipId, selectedClipIds } = get()
    const anchorId = selectedClipId ?? selectedClipIds[0]
    if (!anchorId) return
    const found = findClip(project, anchorId)
    if (!found) return
    set({ ...syncClipSelection(found.track.clips.map((c) => c.id)), selectedMarkerId: null })
  },
  clearClipSelection: () => set({ ...clearClipSelectionState(), selectedMarkerId: null, selectedNavKeyframe: null }),
  setSelectedMarkerId: (id) => set({ selectedMarkerId: id, ...clearClipSelectionState(), selectedNavKeyframe: null }),
  setPixelsPerSecond: (pps) => {
    const clamped = clampTimelinePixelsPerSecond(pps)
    saveTimelinePixelsPerSecond(clamped)
    set({ pixelsPerSecond: clamped })
  },
  setDragState: (state) => set({ dragState: state }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setRestoreReady: (ready) => set({ restoreReady: ready }),
  setRippleDelete: (v) => set({ rippleDelete: v }),
  setRippleInsert: (v) => set({ rippleInsert: v }),
  setShowSafeAreas: (v) => set({ showSafeAreas: v }),
  setLoopPlayback: (v) => set({ loopPlayback: v }),
  setShowPlayHint: (v) => set({ showPlayHint: v }),
  setShowExportHint: (v) => set({ showExportHint: v }),
  setCoachmarkFromSample: (v) => set({ coachmarkFromSample: v }),
  setTimelineEditTool: (tool) => set({ timelineEditTool: tool }),
  setColorPreviewMode: (mode) => set({ colorPreviewMode: mode }),
  setShowColorScope: (show) => set({ showColorScope: show }),
  setInPoint: (time) => set({ inPoint: time }),
  setOutPoint: (time) => set({ outPoint: time }),
  clearInOut: () => set({ inPoint: null, outPoint: null }),
  setInOutFromMarker: (markerId) => {
    const duration = get().getProjectDuration()
    const range = findChapterRangeByMarkerId(markerId, get().project.markers ?? [], duration)
    if (!range || !isExportableChapterRange(range.start, range.end)) return false
    set({ inPoint: range.start, outPoint: range.end })
    return true
  },

  setProjectName: (name) => {
    get().pushHistory()
    set((state) => ({ project: { ...state.project, name }, future: [] }))
  },

  pushHistory: () => {
    const { project, past } = get()
    set({ past: [...past, cloneProject(project)].slice(-MAX_HISTORY), future: [] })
  },

  undo: () => {
    const { past, project, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set({
      project: previous,
      past: past.slice(0, -1),
      future: [cloneProject(project), ...future].slice(0, MAX_HISTORY),
      selectedClipIds: [],
      selectedClipId: null,
      selectedMarkerId: null,
    })
  },

  redo: () => {
    const { past, project, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      project: next,
      past: [...past, cloneProject(project)].slice(-MAX_HISTORY),
      future: future.slice(1),
      selectedClipIds: [],
      selectedClipId: null,
      selectedMarkerId: null,
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  addMediaAsset: (asset) =>
    set((state) => ({
      project: { ...state.project, mediaAssets: [...state.project.mediaAssets, asset] },
    })),

  importLutFile: async (file) => {
    const text = await file.text()
    const parsed = parseCubeLut(text)
    if (!parsed) return false

    const asset: LutAsset = {
      id: createId(),
      name: file.name.replace(/\.cube$/i, '') || 'LUT',
      blob: new Blob([text], { type: 'text/plain' }),
      size: parsed.size,
      title: parsed.title,
    }
    primeParsedLutCache(asset.id, parsed)
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        lutAssets: [...(state.project.lutAssets ?? []), asset],
      },
      future: [],
    }))
    return true
  },

  removeLutAsset: (id) => {
    get().pushHistory()
    clearParsedLutCache(id)
    set((state) => ({
      project: {
        ...state.project,
        lutAssets: (state.project.lutAssets ?? []).filter((a) => a.id !== id),
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (
              (clip.type === 'video' || clip.type === 'image' || clip.type === 'adjustment')
              && clip.lutId === id
            ) {
              return { ...clip, lutId: undefined, lutIntensity: undefined }
            }
            return clip
          }),
        })),
      },
      future: [],
    }))
  },

  updateMediaAsset: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        mediaAssets: state.project.mediaAssets.map((asset) =>
          asset.id === id ? { ...asset, ...updates } : asset,
        ),
      },
    })),

  removeMediaAsset: (id) => {
    get().pushHistory()
    set((state) => {
      const asset = state.project.mediaAssets.find((a) => a.id === id)
      if (asset) URL.revokeObjectURL(asset.url)
      return {
        project: {
          ...state.project,
          mediaAssets: state.project.mediaAssets.filter((a) => a.id !== id),
          tracks: state.project.tracks.map((track) => ({
            ...track,
            clips: track.clips.filter((c) => {
              if (c.type === 'text') return true
              return 'mediaId' in c && c.mediaId !== id
            }),
          })),
        },
        future: [],
      }
    })
  },

  addClipFromMedia: (mediaId, trackId, startTime) => {
    const { project } = get()
    const asset = project.mediaAssets.find((a) => a.id === mediaId)
    if (!asset) return false

    let targetTrack = trackId ? project.tracks.find((t) => t.id === trackId) : undefined
    if (targetTrack?.locked) return false
    if (targetTrack && !isCompatibleTrack(asset, targetTrack)) return false
    if (!targetTrack) targetTrack = findCompatibleTrack(project.tracks, asset)
    if (!targetTrack) return false

    get().pushHistory()
    const clipStart = startTime ?? getProjectDuration(project.tracks)
    const clip = createClipFromMedia(asset, targetTrack.id, clipStart)
    const updatedClips = prepareTrackClipsForInsert(
      targetTrack.clips,
      clip,
      clipStart,
      get().rippleInsert,
    )

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === targetTrack!.id ? { ...t, clips: updatedClips } : t,
        ),
      },
      ...syncClipSelection([clip.id]),
      future: [],
    }))
    return true
  },

  addSlideshow: (mediaIds, options) => {
    const { project } = get()
    const images = mediaIds
      .map((id) => project.mediaAssets.find((a) => a.id === id))
      .filter((a): a is MediaAsset => !!a && a.type === 'image')
    if (images.length === 0) return 0

    const targetTrack = project.tracks.find((t) => t.type === 'video' && !t.locked)
    if (!targetTrack) return 0

    get().pushHistory()

    // 既存クリップの末尾から連続配置する
    let cursor = targetTrack.clips.reduce((end, c) => Math.max(end, c.startTime + c.duration), 0)
    const newClips: ImageClip[] = images.map((asset, i) => {
      const clip: ImageClip = {
        id: createId(),
        trackId: targetTrack.id,
        startTime: cursor,
        duration: options.durationPerImage,
        sourceStart: 0,
        sourceDuration: options.durationPerImage,
        type: 'image',
        mediaId: asset.id,
        transform: { ...DEFAULT_TRANSFORM },
        kenBurns: { ...DEFAULT_KEN_BURNS, enabled: options.kenBurns },
        color: { ...DEFAULT_COLOR },
        crop: { ...DEFAULT_CROP },
        ...DEFAULT_VISUAL_FADE,
      }
      if (i > 0 && options.transitionType !== 'none') {
        clip.transition = { type: options.transitionType, duration: options.transitionDuration }
      }
      cursor += options.durationPerImage
      return clip
    })

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === targetTrack.id ? { ...t, clips: [...t.clips, ...newClips] } : t,
        ),
      },
      ...clearClipSelectionState(),
      future: [],
    }))
    return newClips.length
  },

  addSlideshowToGuide: (guideClipId, mediaIds, options) => {
    const { project } = get()
    const found = findClip(project, guideClipId)
    if (!found || !isPhotoGuideClip(found.clip)) return 0

    const guide = found.clip
    const images = mediaIds
      .map((id) => project.mediaAssets.find((a) => a.id === id))
      .filter((a): a is MediaAsset => !!a && a.type === 'image')
    if (images.length === 0) return 0

    const targetTrack = project.tracks.find((t) => t.type === 'video' && !t.locked)
    if (!targetTrack) return 0

    get().pushHistory()

    const newClips = buildGuideSlideshowImageClips(
      guide.startTime,
      guide.duration,
      targetTrack.id,
      images.map((a) => a.id),
      options,
    )

    const firstClipId = newClips[0]?.id ?? null

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => {
          if (t.id === targetTrack.id) return { ...t, clips: [...t.clips, ...newClips] }
          if (t.id === found.track.id) return { ...t, clips: t.clips.filter((c) => c.id !== guideClipId) }
          return t
        }),
      },
      ...syncClipSelection(firstClipId ? [firstClipId] : []),
      future: [],
    }))
    return newClips.length
  },

  addTextClip: (preset, trackId, startTime) => {
    const { project } = get()
    const textTrack =
      project.tracks.find((t) => t.id === trackId && t.type === 'text' && !t.locked) ??
      project.tracks.find((t) => t.type === 'text' && !t.locked)
    if (!textTrack) return

    get().pushHistory()

    const textStyle: TextStyle = {
      content: preset.text.content ?? 'テキスト',
      fontFamily: preset.text.fontFamily ?? 'Noto Sans JP',
      fontSize: preset.text.fontSize ?? 48,
      color: preset.text.color ?? '#ffffff',
      strokeColor: preset.text.strokeColor ?? '#000000',
      strokeWidth: preset.text.strokeWidth ?? 0,
      shadowColor: preset.text.shadowColor ?? 'rgba(0,0,0,0.5)',
      shadowBlur: preset.text.shadowBlur ?? 4,
      textAlign: preset.text.textAlign ?? 'center',
      lineHeight: preset.text.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT,
      verticalAlign: preset.text.verticalAlign ?? 'center',
      backgroundColor: preset.text.backgroundColor ?? '',
      backgroundPadding: preset.text.backgroundPadding ?? DEFAULT_TEXT_BACKGROUND_PADDING,
      backgroundRadius: preset.text.backgroundRadius ?? DEFAULT_TEXT_BACKGROUND_RADIUS,
    }

    const clip: TextClip = {
      id: createId(),
      trackId: textTrack.id,
      startTime: startTime ?? getProjectDuration(project.tracks),
      duration: preset.duration,
      sourceStart: 0,
      sourceDuration: preset.duration,
      type: 'text',
      text: textStyle,
      transform: { ...DEFAULT_TRANSFORM, ...preset.transform },
      animation: {
        type: preset.animation?.type ?? 'fadeIn',
        duration: preset.animation?.duration ?? 0.8,
      },
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === textTrack.id ? { ...t, clips: [...t.clips, clip] } : t,
        ),
      },
      ...syncClipSelection([clip.id]),
      future: [],
    }))
  },

  addAdjustmentClip: (trackId, startTime, duration) => {
    const { project } = get()
    const videoTrack =
      project.tracks.find((t) => t.id === trackId && t.type === 'video' && !t.locked) ??
      project.tracks.find((t) => t.type === 'video' && t.name === '調整' && !t.locked) ??
      [...project.tracks].reverse().find((t) => t.type === 'video' && !t.locked)
    if (!videoTrack) return

    get().pushHistory()
    const projectDuration = Math.max(getProjectDuration(project.tracks), 10)
    const clipStart = startTime ?? 0
    const clipDuration = duration ?? Math.max(0.2, projectDuration - clipStart)

    const clip: AdjustmentClip = {
      id: createId(),
      trackId: videoTrack.id,
      startTime: clipStart,
      duration: clipDuration,
      sourceStart: 0,
      sourceDuration: clipDuration,
      type: 'adjustment',
      color: { ...DEFAULT_COLOR },
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === videoTrack.id ? { ...t, clips: [...t.clips, clip] } : t,
        ),
      },
      ...syncClipSelection([clip.id]),
      currentTime: Math.max(state.currentTime, clipStart),
      future: [],
    }))
  },

  importSrtSubtitles: (content, trackId) => {
    const cues = parseSrt(content)
    if (cues.length === 0) return 0

    const { project } = get()
    const textTrack =
      project.tracks.find((t) => t.id === trackId && t.type === 'text' && !t.locked) ??
      project.tracks.find((t) => t.type === 'text' && !t.locked)
    if (!textTrack) return 0

    get().pushHistory()
    const clips = buildTextClipsFromSrtCues(cues, textTrack.id)

    const nextProject = {
      ...get().project,
      tracks: get().project.tracks.map((t) =>
        t.id === textTrack.id ? { ...t, clips: [...t.clips, ...clips] } : t,
      ),
    }

    set({
      project: nextProject,
      ...syncClipSelection(clips[clips.length - 1] ? [clips[clips.length - 1].id] : []),
      future: [],
    })

    ensureProjectFontsLoaded(nextProject).catch(console.error)

    return clips.length
  },

  updateClip: (clipId, updates, recordHistory = false) => {
    if (recordHistory) get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) =>
            clip.id === clipId ? ({ ...clip, ...updates } as Clip) : clip,
          ),
        })),
      },
      ...(recordHistory ? { future: [] } : {}),
    }))
  },

  replaceClipMedia: (clipId, newMediaId) => {
    const { project } = get()
    const found = findClip(project, clipId)
    if (!found) return false
    const { clip } = found
    if (clip.type === 'text' || clip.type === 'adjustment') return false
    if (found.track.locked) return false

    const asset = project.mediaAssets.find((a) => a.id === newMediaId)
    if (!asset || !canReplaceClipWithMedia(clip, asset)) return false
    if (!isCompatibleTrack(asset, found.track)) return false
    if (clip.mediaId === newMediaId) return false

    let newClip: Clip
    if (isVisualMediaClip(clip) && (asset.type === 'video' || asset.type === 'image')) {
      if (asset.type === clip.type) {
        const updates = computeMediaReplacement(clip, newMediaId, project.mediaAssets)
        if (!updates) return false
        newClip = { ...clip, ...updates }
      } else {
        const replaced = buildCrossVisualClip(clip, newMediaId, project.mediaAssets)
        if (!replaced) return false
        newClip = replaced
      }
    } else if (clip.type === 'audio' && asset.type === 'audio') {
      const updates = computeMediaReplacement(clip, newMediaId, project.mediaAssets)
      if (!updates) return false
      newClip = { ...clip, ...updates }
    } else {
      return false
    }

    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) =>
          track.id === found.track.id
            ? { ...track, clips: track.clips.map((clip) => (clip.id === clipId ? newClip : clip)) }
            : track,
        ),
      },
      future: [],
    }))
    clearMediaCache()
    return true
  },

  removeClip: (clipId, ripple) => {
    const { project, rippleDelete } = get()
    const found = findClip(project, clipId)
    if (!found) return

    get().pushHistory()
    const useRipple = ripple ?? rippleDelete
    const clipEnd = found.clip.startTime + found.clip.duration
    const delta = useRipple ? getRippleDeleteDelta(found.clip) : 0

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => {
          let clips = track.clips.filter((c) => c.id !== clipId)
          if (useRipple && track.id === found.track.id) {
            clips = rippleShiftClips(clips, clipEnd, delta)
          }
          return { ...track, clips }
        }),
      },
      ...syncClipSelection(
        state.selectedClipIds.filter((id) => id !== clipId),
      ),
      future: [],
    }))
  },

  removeSelectedClips: (ripple) => {
    const { selectedClipIds, project, rippleDelete } = get()
    if (selectedClipIds.length === 0) return

    get().pushHistory()
    const useRipple = ripple ?? rippleDelete
    const idsSet = new Set(selectedClipIds)

    const tracks = project.tracks.map((track) => {
      const toRemove = track.clips
        .filter((c) => idsSet.has(c.id))
        .sort((a, b) => b.startTime - a.startTime)
      if (toRemove.length === 0) return track

      let clips = [...track.clips]
      for (const clip of toRemove) {
        const current = clips.find((c) => c.id === clip.id)
        if (!current) continue
        const clipEnd = current.startTime + current.duration
        const delta = useRipple ? getRippleDeleteDelta(current) : 0
        clips = clips.filter((c) => c.id !== clip.id)
        if (useRipple) clips = rippleShiftClips(clips, clipEnd, delta)
      }
      return { ...track, clips }
    })

    set({
      project: { ...project, tracks },
      ...clearClipSelectionState(),
      future: [],
    })
  },

  duplicateSelectedClip: () => {
    const { selectedClipIds, project } = get()
    if (selectedClipIds.length === 0) return

    get().pushHistory()
    const additions = new Map<string, Clip[]>()
    const newIds: string[] = []

    for (const clipId of selectedClipIds) {
      const found = findClip(project, clipId)
      if (!found) continue
      const newClip = duplicateClip(found.clip, createId)
      newIds.push(newClip.id)
      const list = additions.get(found.track.id) ?? []
      list.push(newClip)
      additions.set(found.track.id, list)
    }
    if (newIds.length === 0) return

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => {
          const added = additions.get(t.id)
          return added ? { ...t, clips: [...t.clips, ...added] } : t
        }),
      },
      ...syncClipSelection(newIds),
      future: [],
    }))
  },

  duplicateClipInPlace: (clipId) => {
    const { project } = get()
    const found = findClip(project, clipId)
    if (!found || found.track.locked) return null

    const newClip = { ...structuredClone(found.clip), id: createId() }
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === found.track.id ? { ...t, clips: [...t.clips, newClip] } : t,
        ),
      },
      future: [],
    }))
    return newClip.id
  },

  copySelectedClip: () => {
    const clip = get().getSelectedClip()
    if (clip) set({ clipboard: structuredClone(clip) })
  },

  pasteClip: () => {
    const { clipboard, project, currentTime, rippleInsert } = get()
    if (!clipboard) return

    const track = project.tracks.find((t) => t.id === clipboard.trackId && !t.locked)
    if (!track || trackTypeForClip(clipboard) !== track.type) return

    get().pushHistory()
    const newClip = {
      ...structuredClone(clipboard),
      id: createId(),
      startTime: currentTime,
    }
    const updatedClips = prepareTrackClipsForInsert(track.clips, newClip, currentTime, rippleInsert)

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === track.id ? { ...t, clips: updatedClips } : t,
        ),
      },
      ...syncClipSelection([newClip.id]),
      future: [],
    }))
  },

  splitClipAt: (clipId, time) => {
    const { project } = get()
    const found = findClip(project, clipId)
    if (!found) return
    const { clip } = found
    if (time <= clip.startTime || time >= clip.startTime + clip.duration) return

    get().pushHistory()
    const splitOffset = time - clip.startTime
    const secondSourceStart =
      clip.type === 'video'
        ? clip.sourceStart + getSourceOffsetAtLocalTime(clip, splitOffset)
        : clip.sourceStart + splitOffset * (clip.type === 'audio' ? (clip.speed ?? 1) : 1)

    const splitKeyframes =
      'transformKeyframes' in clip && clip.transformKeyframes?.length
        ? splitTransformKeyframes(clip.transformKeyframes, splitOffset)
        : null
    const firstDuration = splitOffset
    const secondDuration = clip.duration - splitOffset
    const splitSpeedKf =
      clip.type === 'video' && clip.speedKeyframes?.length
        ? splitSpeedKeyframes(clip.speedKeyframes, splitOffset)
        : null
    const splitVolumeKf =
      (clip.type === 'video' || clip.type === 'audio') && clip.audio.volumeKeyframes?.length
        ? splitVolumeKeyframes(clip.audio.volumeKeyframes, splitOffset)
        : null
    const audioClip = clip.type === 'video' || clip.type === 'audio' ? clip : null

    const firstClip: Clip = {
      ...clip,
      duration: firstDuration,
      sourceDuration: firstDuration,
      ...(clip.type === 'video' || clip.type === 'image' ? { transition: undefined } : {}),
      ...(splitKeyframes ? { transformKeyframes: splitKeyframes.first } : {}),
      ...(splitSpeedKf && clip.type === 'video' ? { speedKeyframes: splitSpeedKf.first } : {}),
      ...(splitVolumeKf && audioClip ? { audio: { ...audioClip.audio, volumeKeyframes: splitVolumeKf.first } } : {}),
    }
    const secondClip: Clip = {
      ...clip,
      id: createId(),
      startTime: time,
      duration: secondDuration,
      sourceStart: secondSourceStart,
      sourceDuration: secondDuration,
      ...(splitKeyframes ? { transformKeyframes: splitKeyframes.second } : {}),
      ...(splitSpeedKf && clip.type === 'video' ? { speedKeyframes: splitSpeedKf.second } : {}),
      ...(splitVolumeKf && audioClip ? { audio: { ...audioClip.audio, volumeKeyframes: splitVolumeKf.second } } : {}),
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.flatMap((c) => (c.id !== clipId ? [c] : [firstClip, secondClip])),
        })),
      },
      ...syncClipSelection([secondClip.id]),
      future: [],
    }))
  },

  moveClip: (clipId, trackId, startTime, recordHistory = true) => {
    const { project } = get()
    const found = findClip(project, clipId)
    if (!found) return
    const targetTrack = project.tracks.find((t) => t.id === trackId)
    if (!targetTrack || targetTrack.locked) return
    if (trackTypeForClip(found.clip) !== targetTrack.type) return
    if (recordHistory) get().pushHistory()

    const otherClips = targetTrack.clips.filter((c) => c.id !== clipId)
    const resolvedStart = resolveClipOverlap(found.clip, otherClips, Math.max(0, startTime))
    const updatedClip = { ...found.clip, trackId, startTime: resolvedStart }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips:
            track.id === found.track.id
              ? track.clips.filter((c) => c.id !== clipId)
              : track.id === trackId
                ? [...track.clips, updatedClip]
                : track.clips,
        })),
      },
      ...(recordHistory ? { future: [] } : {}),
    }))
  },

  slipSelectedClip: (deltaSeconds) => {
    const { selectedClipId, project } = get()
    if (!selectedClipId) return false
    const found = findClip(project, selectedClipId)
    if (!found || found.track.locked) return false
    if (!canSlipClip(found.clip)) return false

    const slipped = computeSlipClip(found.clip, deltaSeconds, project.mediaAssets)
    if (!slipped || slipped.sourceStart === found.clip.sourceStart) return false

    get().pushHistory()
    get().updateClip(selectedClipId, { sourceStart: slipped.sourceStart })
    return true
  },

  slideSelectedClip: (deltaSeconds) => {
    const { selectedClipId, project } = get()
    if (!selectedClipId) return false
    const found = findClip(project, selectedClipId)
    if (!found || found.track.locked) return false
    if (!canSlideClip(found.track.clips, selectedClipId)) return false

    const updated = slideClipOnTrack(found.track.clips, selectedClipId, deltaSeconds, project.mediaAssets)
    if (!updated) return false

    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) =>
          track.id === found.track.id ? { ...track, clips: updated } : track,
        ),
      },
      future: [],
    }))
    return true
  },

  rollingTrimAtEditPoint: (prevClipId, nextClipId, deltaSeconds, recordHistory = true) => {
    const { project } = get()
    for (const track of project.tracks) {
      const hasPrev = track.clips.some((c) => c.id === prevClipId)
      const hasNext = track.clips.some((c) => c.id === nextClipId)
      if (!hasPrev || !hasNext) continue
      if (track.locked) return false

      const updated = rollingEditOnTrack(track.clips, prevClipId, nextClipId, deltaSeconds, project.mediaAssets)
      if (!updated) return false

      if (recordHistory) get().pushHistory()
      set((state) => ({
        project: {
          ...state.project,
          tracks: state.project.tracks.map((t) =>
            t.id === track.id ? { ...t, clips: updated } : t,
          ),
        },
        ...(recordHistory ? { future: [] } : {}),
      }))
      return true
    }
    return false
  },

  setSelectedNavKeyframe: (selection) => set({ selectedNavKeyframe: selection }),

  jumpToAdjacentKeyframe: (direction) => {
    const { selectedClipId, project, currentTime, selectedNavKeyframe } = get()
    if (!selectedClipId) return false

    const found = findClip(project, selectedClipId)
    if (!found) return false

    const entries = listClipKeyframeNavEntries(found.clip)
    if (!entries.length) return false

    const localTime = clipLocalTimeAt(found.clip.startTime, currentTime, found.clip.duration)
    const currentId = selectedNavKeyframe?.clipId === selectedClipId
      ? selectedNavKeyframe.keyframeId
      : null
    const target = findAdjacentKeyframeNavEntry(entries, localTime, direction, currentId)
    if (!target) return false

    set({
      currentTime: found.clip.startTime + target.time,
      selectedNavKeyframe: {
        clipId: selectedClipId,
        type: target.type,
        keyframeId: target.id,
      },
    })
    return true
  },

  detachVideoAudio: (clipId) => {
    const found = findClip(get().project, clipId)
    if (!found || found.clip.type !== 'video') return false
    if (found.clip.audioLinked === false) return true

    get().pushHistory()
    get().updateClip(clipId, { audioLinked: false })
    return true
  },

  linkVideoAudio: (clipId) => {
    const found = findClip(get().project, clipId)
    if (!found || found.clip.type !== 'video') return false
    if (found.clip.audioLinked !== false) return true

    get().pushHistory()
    get().updateClip(clipId, { audioLinked: true })
    return true
  },

  prepareNarrationForVideoClip: (clipId) => {
    const { project } = get()
    const found = findClip(project, clipId)
    if (!found || found.clip.type !== 'video') return null

    const audioTrack = findPreferredNarrationTrack(project.tracks)
    if (!audioTrack) return null

    get().pushHistory()
    get().updateClip(clipId, { audioLinked: false })
    set({
      ...syncClipSelection([clipId]),
      currentTime: found.clip.startTime,
      future: [],
    })

    return {
      clipId,
      audioTrackId: audioTrack.id,
      startTime: found.clip.startTime,
      duration: found.clip.duration,
    }
  },

  applyRippleTrimOnTrack: (trackId, trimmedClipId, endBefore, delta) => {
    if (Math.abs(delta) < 0.001) return
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) =>
          track.id !== trackId
            ? track
            : { ...track, clips: rippleTrimClipsOnTrack(track.clips, trimmedClipId, endBefore, delta) },
        ),
      },
    }))
  },

  setClipTransition: (clipId, transition) => {
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== clipId) return clip
            if (clip.type === 'audio' || clip.type === 'text') return clip
            return { ...clip, transition }
          }),
        })),
      },
      future: [],
    }))
  },

  applyBatchTransitions: (scope, transition) => {
    const { project, selectedClipId } = get()
    const selectedTrackId =
      scope === 'selected-track' && selectedClipId
        ? findClip(project, selectedClipId)?.track.id ?? null
        : null

    if (scope === 'selected-track' && !selectedTrackId) return 0

    const clipIds = collectBatchTransitionClipIds(project.tracks, scope, selectedTrackId)
    if (clipIds.length === 0) return 0

    const idSet = new Set(clipIds)
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (!idSet.has(clip.id)) return clip
            if (clip.type !== 'video' && clip.type !== 'image') return clip
            return { ...clip, transition }
          }),
        })),
      },
      future: [],
    }))
    return clipIds.length
  },

  clearBatchTransitions: (scope) => {
    const { project, selectedClipId } = get()
    const selectedTrackId =
      scope === 'selected-track' && selectedClipId
        ? findClip(project, selectedClipId)?.track.id ?? null
        : null

    if (scope === 'selected-track' && !selectedTrackId) return 0

    const clipIds = collectBatchTransitionRemovalClipIds(project.tracks, scope, selectedTrackId)
    if (clipIds.length === 0) return 0

    const idSet = new Set(clipIds)
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (!idSet.has(clip.id)) return clip
            if (clip.type !== 'video' && clip.type !== 'image') return clip
            return { ...clip, transition: undefined }
          }),
        })),
      },
      future: [],
    }))
    return clipIds.length
  },

  toggleTrackMute: (trackId) => {
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, muted: !t.muted } : t,
        ),
      },
      future: [],
    }))
    audioEngine.updateTrackGains(get().project)
  },

  toggleTrackSolo: (trackId) => {
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, solo: !t.solo } : t,
        ),
      },
      future: [],
    }))
    audioEngine.updateTrackGains(get().project)
  },

  setTrackVolume: (trackId, volume, recordHistory = true) => {
    const clamped = Math.max(0, Math.min(2, volume))
    if (recordHistory) get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, volume: clamped } : t,
        ),
      },
      ...(recordHistory ? { future: [] } : {}),
    }))
    audioEngine.updateTrackGains(get().project)
  },

  toggleTrackLock: (trackId) => {
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, locked: !t.locked } : t,
        ),
      },
      future: [],
    }))
  },

  addTrack: (type, afterTrackId) => {
    const { project } = get()
    const newTrack = createTrack(type, project.tracks, createId())
    const insertIndex = findTrackInsertIndex(project.tracks, type, afterTrackId)
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: [
          ...state.project.tracks.slice(0, insertIndex),
          newTrack,
          ...state.project.tracks.slice(insertIndex),
        ],
      },
      future: [],
    }))
    audioEngine.updateTrackGains(get().project)
    return newTrack.id
  },

  removeTrack: (trackId) => {
    const { project } = get()
    if (!canRemoveTrack(project.tracks, trackId).ok) return false
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.filter((t) => t.id !== trackId),
      },
      future: [],
    }))
    audioEngine.updateTrackGains(get().project)
    return true
  },

  renameTrack: (trackId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, name: trimmed } : t,
        ),
      },
      future: [],
    }))
  },

  setProjectSettings: (settings) => {
    get().pushHistory()
    set((state) => ({
      project: { ...state.project, ...settings },
      future: [],
    }))
  },

  applyProjectSettingsPreset: (preset) => {
    get().pushHistory()
    const snapshot = snapshotFromProjectSettingsPreset(preset)
    set((state) => ({
      project: {
        ...state.project,
        width: snapshot.width,
        height: snapshot.height,
        fps: snapshot.fps,
      },
      rippleDelete: snapshot.rippleDelete,
      loopPlayback: snapshot.loopPlayback,
      future: [],
    }))
  },

  applyTemplate: (template) => {
    get().pushHistory()
    const textTrack = get().project.tracks.find((t) => t.type === 'text')
    if (!textTrack) return

    const textClips = buildTemplateTextClips(template, textTrack.id)
    const guideClips = buildPhotoGuideClips(template, textTrack.id)
    const markers = buildTemplateMarkers(template)

    set((state) => ({
      project: {
        ...state.project,
        name: template.name,
        markers: [...(state.project.markers ?? []), ...markers],
        tracks: state.project.tracks.map((t) =>
          t.id === textTrack.id ? { ...t, clips: [...t.clips, ...textClips, ...guideClips] } : t,
        ),
      },
      future: [],
    }))
  },

  applyUserProjectTemplate: (template) => {
    get().pushHistory()
    const emptyTracks = get().project.tracks.map((track) => ({ ...track, clips: [] }))
    const { tracks, markers } = applyUserProjectTemplateToTracks(template, emptyTracks)
    set((state) => ({
      project: {
        ...state.project,
        width: template.width,
        height: template.height,
        fps: template.fps,
        tracks,
        markers,
      },
      ...clearClipSelectionState(),
      selectedMarkerId: null,
      future: [],
    }))
  },

  createProjectFromUserTemplate: (template) => {
    const { project } = get()
    for (const asset of project.mediaAssets) URL.revokeObjectURL(asset.url)
    clearMediaCache()
    const tracks = createDefaultTracks()
    const { tracks: nextTracks, markers } = applyUserProjectTemplateToTracks(template, tracks)
    set({
      project: normalizeProject({
        id: createId(),
        name: template.label,
        width: template.width,
        height: template.height,
        fps: template.fps,
        tracks: nextTracks,
        mediaAssets: [],
        markers,
      }),
      currentTime: 0,
      isPlaying: false,
      ...clearClipSelectionState(),
      selectedMarkerId: null,
      clipboard: null,
      inPoint: null,
      outPoint: null,
      past: [],
      future: [],
      showPlayHint: false,
      showExportHint: false,
      coachmarkFromSample: false,
    })
  },

  addMarker: (time, label) => {
    get().pushHistory()
    const marker: TimelineMarker = { id: createId(), time, label: label ?? `Marker ${time.toFixed(1)}s`, type: 'chapter' }
    set((state) => ({
      project: { ...state.project, markers: [...(state.project.markers ?? []), marker] },
      future: [],
    }))
  },

  addBeatMarker: (time) => {
    const t = time ?? get().currentTime
    get().pushHistory()
    const beatIndex = countBeatMarkers(get().project.markers ?? []) + 1
    const marker: TimelineMarker = { id: createId(), time: t, label: beatMarkerLabel(beatIndex), type: 'beat' }
    set((state) => ({
      project: { ...state.project, markers: [...(state.project.markers ?? []), marker] },
      future: [],
    }))
  },

  addBeatMarkersAtInterval: (interval) => {
    if (interval <= 0) return 0
    const { project, selectedClipId } = get()
    let start = 0
    let end = get().getProjectDuration()
    if (selectedClipId) {
      const found = findClip(project, selectedClipId)
      if (found?.clip.type === 'audio') {
        start = found.clip.startTime
        end = found.clip.startTime + found.clip.duration
      }
    }
    const times = generateBeatMarkerTimes(start, end, interval)
    if (times.length === 0) return 0

    get().pushHistory()
    const baseIndex = countBeatMarkers(project.markers ?? [])
    const newMarkers: TimelineMarker[] = times.map((time, i) => ({
      id: createId(),
      time,
      label: beatMarkerLabel(baseIndex + i + 1),
      type: 'beat' as const,
    }))
    set((state) => ({
      project: { ...state.project, markers: [...(state.project.markers ?? []), ...newMarkers] },
      future: [],
    }))
    return newMarkers.length
  },

  removeMarker: (id) => {
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        markers: (state.project.markers ?? []).filter((m) => m.id !== id),
      },
      selectedMarkerId: state.selectedMarkerId === id ? null : state.selectedMarkerId,
      future: [],
    }))
  },

  updateMarker: (id, updates, recordHistory = false) => {
    if (recordHistory) get().pushHistory()
    const duration = get().getProjectDuration()
    const normalized = normalizeMarkerUpdates(updates, duration)
    set((state) => {
      const exists = (state.project.markers ?? []).some((m) => m.id === id)
      if (!exists) return state
      return {
        project: {
          ...state.project,
          markers: (state.project.markers ?? []).map((m) =>
            m.id === id ? { ...m, ...normalized } : m,
          ),
        },
        ...(recordHistory ? { future: [] } : {}),
      }
    })
  },

  getSelectedClip: () => {
    const { project, selectedClipId } = get()
    if (!selectedClipId) return null
    return findClip(project, selectedClipId)?.clip ?? null
  },

  getSelectedMarker: () => {
    const { project, selectedMarkerId } = get()
    if (!selectedMarkerId) return null
    return (project.markers ?? []).find((m) => m.id === selectedMarkerId) ?? null
  },

  getProjectDuration: () => {
    const d = getProjectDuration(get().project.tracks)
    return d > 0 ? d : 0.01
  },

  getPlaybackRange: () => {
    const { inPoint, outPoint } = get()
    const end = get().getProjectDuration()
    return { start: inPoint ?? 0, end: outPoint ?? end }
  },

  getSnapPoints: (excludeClipId, excludeMarkerId) => {
    const { project, currentTime, inPoint, outPoint } = get()
    const points = new Set<number>([0, currentTime])
    if (inPoint !== null) points.add(inPoint)
    if (outPoint !== null) points.add(outPoint)
    for (const marker of project.markers ?? []) {
      if (marker.id === excludeMarkerId) continue
      points.add(marker.time)
    }
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        if (clip.id === excludeClipId) continue
        points.add(clip.startTime)
        points.add(clip.startTime + clip.duration)
      }
    }
    return Array.from(points)
  },

  resetProject: () => {
    const { project } = get()
    for (const asset of project.mediaAssets) URL.revokeObjectURL(asset.url)
    clearMediaCache()
    set({
      project: createDefaultProject(),
      currentTime: 0,
      isPlaying: false,
      ...clearClipSelectionState(),
      selectedMarkerId: null,
      clipboard: null,
      inPoint: null,
      outPoint: null,
      past: [],
      future: [],
      showPlayHint: false,
      showExportHint: false,
      coachmarkFromSample: false,
      playbackShuttleRate: 1,
    })
  },

  loadProject: (project) => {
    clearMediaCache()
    const normalized = normalizeProject(project)
    set({
      project: normalized,
      currentTime: 0,
      isPlaying: false,
      playbackShuttleRate: 1,
      ...clearClipSelectionState(),
      selectedMarkerId: null,
      past: [],
      future: [],
      showPlayHint: false,
      showExportHint: false,
      coachmarkFromSample: false,
    })
    ensureProjectFontsLoaded(normalized).catch(console.error)
    preloadProjectLuts(normalized.lutAssets ?? []).catch(console.error)
  },
}))

export { PROJECT_TEMPLATES }
