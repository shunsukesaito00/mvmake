import { create } from 'zustand'
import {
  type AudioClip,
  type Clip,
  DEFAULT_AUDIO,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_DUCKING,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  type ImageClip,
  type MediaAsset,
  normalizeProject,
  type Project,
  PROJECT_TEMPLATES,
  type ProjectTemplate,
  type TextClip,
  TEXT_PRESETS,
  type TextPreset,
  type TextStyle,
  type TimelineMarker,
  type Track,
  type Transition,
  type TransitionType,
  type VideoClip,
} from '../types/project'
import { clearMediaCache } from '../engine/compositor'
import { createId } from '../utils/id'
import {
  cloneProject,
  duplicateClip,
  findCompatibleTrack,
  getRippleDeleteDelta,
  isCompatibleTrack,
  resolveClipOverlap,
  rippleShiftClips,
  trackTypeForClip,
} from '../utils/clipUtils'
import { getProjectDuration } from '../utils/time'

const MAX_HISTORY = 50

export interface SlideshowOptions {
  durationPerImage: number
  transitionType: TransitionType | 'none'
  transitionDuration: number
  kenBurns: boolean
}

function createDefaultTracks(): Track[] {
  return [
    { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
    { id: createId(), name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
    { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
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
    markers: [],
  })
}

export interface TimelineDragState {
  clipId: string
  mode: 'move' | 'trimStart' | 'trimEnd' | 'playhead' | 'volumeKeyframe'
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
}

interface ProjectState {
  project: Project
  currentTime: number
  isPlaying: boolean
  selectedClipId: string | null
  pixelsPerSecond: number
  dragState: TimelineDragState | null
  exportProgress: number
  isExporting: boolean
  restoreReady: boolean
  past: Project[]
  future: Project[]
  clipboard: Clip | null
  rippleDelete: boolean
  inPoint: number | null
  outPoint: number | null
  showSafeAreas: boolean
  loopPlayback: boolean
  showPlayHint: boolean

  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setSelectedClipId: (id: string | null) => void
  setPixelsPerSecond: (pps: number) => void
  setDragState: (state: TimelineDragState | null) => void
  setExportProgress: (progress: number) => void
  setIsExporting: (exporting: boolean) => void
  setRestoreReady: (ready: boolean) => void
  setProjectName: (name: string) => void
  setRippleDelete: (v: boolean) => void
  setShowSafeAreas: (v: boolean) => void
  setLoopPlayback: (v: boolean) => void
  setShowPlayHint: (v: boolean) => void
  setInPoint: (time: number | null) => void
  setOutPoint: (time: number | null) => void
  clearInOut: () => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  addMediaAsset: (asset: MediaAsset) => void
  removeMediaAsset: (id: string) => void
  addClipFromMedia: (mediaId: string, trackId?: string, startTime?: number) => boolean
  addSlideshow: (mediaIds: string[], options: SlideshowOptions) => number
  addTextClip: (preset: TextPreset, trackId?: string, startTime?: number) => void
  updateClip: (clipId: string, updates: Partial<Clip>, recordHistory?: boolean) => void
  removeClip: (clipId: string, ripple?: boolean) => void
  duplicateSelectedClip: () => void
  /** クリップを同位置に複製して新IDを返す。履歴は呼び出し側で積むこと(Alt+ドラッグ用) */
  duplicateClipInPlace: (clipId: string) => string | null
  copySelectedClip: () => void
  pasteClip: () => void
  splitClipAt: (clipId: string, time: number) => void
  moveClip: (clipId: string, trackId: string, startTime: number, recordHistory?: boolean) => void
  setClipTransition: (clipId: string, transition: Transition | undefined) => void
  toggleTrackMute: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void
  setProjectSettings: (settings: { width?: number; height?: number; fps?: number }) => void
  applyTemplate: (template: ProjectTemplate) => void
  addMarker: (time: number, label?: string) => void
  removeMarker: (id: string) => void

  getSelectedClip: () => Clip | null
  getProjectDuration: () => number
  getSnapPoints: (excludeClipId?: string) => number[]
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
  const base = {
    id: createId(),
    trackId,
    startTime,
    duration: asset.duration,
    sourceStart: 0,
    sourceDuration: asset.duration,
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
  selectedClipId: null,
  pixelsPerSecond: 80,
  dragState: null,
  exportProgress: 0,
  isExporting: false,
  restoreReady: false,
  past: [],
  future: [],
  clipboard: null,
  rippleDelete: true,
  inPoint: null,
  outPoint: null,
  showSafeAreas: false,
  loopPlayback: false,
  showPlayHint: false,

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setPixelsPerSecond: (pps) => set({ pixelsPerSecond: Math.max(20, Math.min(300, pps)) }),
  setDragState: (state) => set({ dragState: state }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setRestoreReady: (ready) => set({ restoreReady: ready }),
  setRippleDelete: (v) => set({ rippleDelete: v }),
  setShowSafeAreas: (v) => set({ showSafeAreas: v }),
  setLoopPlayback: (v) => set({ loopPlayback: v }),
  setShowPlayHint: (v) => set({ showPlayHint: v }),
  setInPoint: (time) => set({ inPoint: time }),
  setOutPoint: (time) => set({ outPoint: time }),
  clearInOut: () => set({ inPoint: null, outPoint: null }),

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
      selectedClipId: null,
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
      selectedClipId: null,
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  addMediaAsset: (asset) =>
    set((state) => ({
      project: { ...state.project, mediaAssets: [...state.project.mediaAssets, asset] },
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
    let clipStart = startTime ?? getProjectDuration(project.tracks)
    const clip = createClipFromMedia(asset, targetTrack.id, clipStart)
    clipStart = resolveClipOverlap(clip, targetTrack.clips, clipStart)
    clip.startTime = clipStart

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === targetTrack!.id ? { ...t, clips: [...t.clips, clip] } : t,
        ),
      },
      selectedClipId: clip.id,
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
      selectedClipId: null,
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
      transform: { ...DEFAULT_TRANSFORM },
      animation: { type: 'fadeIn', duration: 0.8 },
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === textTrack.id ? { ...t, clips: [...t.clips, clip] } : t,
        ),
      },
      selectedClipId: clip.id,
      future: [],
    }))
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
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
      future: [],
    }))
  },

  duplicateSelectedClip: () => {
    const { selectedClipId, project } = get()
    if (!selectedClipId) return
    const found = findClip(project, selectedClipId)
    if (!found) return

    get().pushHistory()
    const newClip = duplicateClip(found.clip, createId)
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === found.track.id ? { ...t, clips: [...t.clips, newClip] } : t,
        ),
      },
      selectedClipId: newClip.id,
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
    const { clipboard, project, currentTime } = get()
    if (!clipboard) return

    const track = project.tracks.find((t) => t.id === clipboard.trackId && !t.locked)
    if (!track || trackTypeForClip(clipboard) !== track.type) return

    get().pushHistory()
    const newClip = {
      ...structuredClone(clipboard),
      id: createId(),
      startTime: currentTime,
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === track.id ? { ...t, clips: [...t.clips, newClip] } : t,
        ),
      },
      selectedClipId: newClip.id,
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
    const speed = clip.type === 'video' || clip.type === 'audio' ? (clip.speed ?? 1) : 1
    const firstDuration = splitOffset
    const secondDuration = clip.duration - splitOffset
    const secondSourceStart = clip.sourceStart + splitOffset * speed

    const firstClip: Clip = {
      ...clip,
      duration: firstDuration,
      sourceDuration: firstDuration,
      ...(clip.type === 'video' || clip.type === 'image' ? { transition: undefined } : {}),
    }
    const secondClip: Clip = {
      ...clip,
      id: createId(),
      startTime: time,
      duration: secondDuration,
      sourceStart: secondSourceStart,
      sourceDuration: secondDuration,
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((track) => ({
          ...track,
          clips: track.clips.flatMap((c) => (c.id !== clipId ? [c] : [firstClip, secondClip])),
        })),
      },
      selectedClipId: secondClip.id,
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

  setProjectSettings: (settings) => {
    get().pushHistory()
    set((state) => ({
      project: { ...state.project, ...settings },
      future: [],
    }))
  },

  applyTemplate: (template) => {
    get().pushHistory()
    const textTrack = get().project.tracks.find((t) => t.type === 'text')
    if (!textTrack) return

    const newClips: TextClip[] = template.textClips.map(({ presetId, startTime }) => {
      const preset = TEXT_PRESETS.find((p) => p.id === presetId)
      if (!preset) throw new Error(`Unknown preset: ${presetId}`)
      return {
        id: createId(),
        trackId: textTrack.id,
        startTime,
        duration: preset.duration,
        sourceStart: 0,
        sourceDuration: preset.duration,
        type: 'text' as const,
        text: {
          content: preset.text.content ?? '',
          fontFamily: preset.text.fontFamily ?? 'Noto Sans JP',
          fontSize: preset.text.fontSize ?? 48,
          color: preset.text.color ?? '#ffffff',
          strokeColor: preset.text.strokeColor ?? '#000000',
          strokeWidth: preset.text.strokeWidth ?? 0,
          shadowColor: preset.text.shadowColor ?? 'rgba(0,0,0,0.5)',
          shadowBlur: preset.text.shadowBlur ?? 4,
          textAlign: preset.text.textAlign ?? 'center',
        },
        transform: { ...DEFAULT_TRANSFORM },
        animation: { type: 'fadeIn' as const, duration: 0.8 },
      }
    })

    set((state) => ({
      project: {
        ...state.project,
        name: template.name,
        tracks: state.project.tracks.map((t) =>
          t.id === textTrack.id ? { ...t, clips: [...t.clips, ...newClips] } : t,
        ),
      },
      future: [],
    }))
  },

  addMarker: (time, label) => {
    get().pushHistory()
    const marker: TimelineMarker = { id: createId(), time, label: label ?? `Marker ${time.toFixed(1)}s` }
    set((state) => ({
      project: { ...state.project, markers: [...(state.project.markers ?? []), marker] },
      future: [],
    }))
  },

  removeMarker: (id) => {
    get().pushHistory()
    set((state) => ({
      project: {
        ...state.project,
        markers: (state.project.markers ?? []).filter((m) => m.id !== id),
      },
      future: [],
    }))
  },

  getSelectedClip: () => {
    const { project, selectedClipId } = get()
    if (!selectedClipId) return null
    return findClip(project, selectedClipId)?.clip ?? null
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

  getSnapPoints: (excludeClipId) => {
    const { project, currentTime, inPoint, outPoint } = get()
    const points = new Set<number>([0, currentTime])
    if (inPoint !== null) points.add(inPoint)
    if (outPoint !== null) points.add(outPoint)
    for (const marker of project.markers ?? []) points.add(marker.time)
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
      selectedClipId: null,
      clipboard: null,
      inPoint: null,
      outPoint: null,
      past: [],
      future: [],
      showPlayHint: false,
    })
  },

  loadProject: (project) => {
    clearMediaCache()
    set({
      project: normalizeProject(project),
      currentTime: 0,
      isPlaying: false,
      selectedClipId: null,
      past: [],
      future: [],
      showPlayHint: false,
    })
  },
}))

export { PROJECT_TEMPLATES }
