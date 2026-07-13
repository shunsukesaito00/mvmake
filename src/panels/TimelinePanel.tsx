import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { useProjectStore, type TimelineDragState, type TimelineEditTool } from '../store/projectStore'
import type { Clip, Track } from '../types/project'
import { formatTime, snapTime } from '../utils/time'
import { resolveMarkerDragTime, clampMarkerTime } from '../utils/markerEdit'
import { formatTimelineTextLabel } from '../utils/textWrap'
import { snapLocalKeyframeTime, snapVolume } from '../utils/keyframeSnap'
import { clampTrimEnd, clampTrimStart } from '../utils/clipUtils'
import { canSlideClip, canSlipClip, computeSlipClip, computeRollingEdit, findAdjacentClips, listAdjacentClipPairs, slideClipsFromSnapshot } from '../utils/slipSlide'
import {
  computeFitTimelinePixelsPerSecond,
  computeTimelineScrollLeftForTime,
  computeZoomToClipPixelsPerSecond,
  isTimelineTimeVisible,
} from '../utils/timelineZoom'
import { updateVolumeKeyframeList, VOLUME_TIMELINE_LANE_HEIGHT, createVolumeKeyframeAt, volumeAtTimelineClick } from '../utils/volumeKeyframesTimeline'
import { updateSpeedKeyframeList, SPEED_TIMELINE_LANE_HEIGHT, createSpeedKeyframeAt, updateSpeedBezierHandle } from '../utils/speedKeyframesTimeline'
import { SPEED_MAX, SPEED_MIN } from '../utils/speedKeyframes'
import { getSpeedBezierHandleIn, getSpeedBezierHandleOut } from '../utils/speedKeyframeBezier'
import {
  updateTransformKeyframeList,
  createTransformKeyframeAt,
  TRANSFORM_TIMELINE_LANE_HEIGHT,
  applyTransformPropertyLaneDelta,
  updateTransformBezierHandle,
  type TransformTimelineProperty,
} from '../utils/transformKeyframesTimeline'
import { getBezierHandleIn, getBezierHandleOut } from '../utils/transformKeyframeBezier'
import { VolumeKeyframesTimeline } from '../components/VolumeKeyframesTimeline'
import { SpeedKeyframesTimeline } from '../components/SpeedKeyframesTimeline'
import { TransformKeyframesTimeline } from '../components/TransformKeyframesTimeline'
import type { AudioClip, ImageClip, TextClip, VideoClip } from '../types/project'
import { usePlaybackControls } from '../contexts/PlaybackContext'
import { useToastStore } from '../store/toastStore'
import { PanelHeader, IconButton } from '../components/ui'
import { Icons } from '../components/icons'
import { TimelineEditTools } from '../components/TimelineEditTools'
import { useTimelineTrackHeights } from '../hooks/useTimelineTrackHeights'
import { findTrackIndexAtY, sumTrackHeights } from '../persistence/timelineTrackHeights'
import { canRemoveTrack } from '../utils/trackManagement'
import { startResize } from '../hooks/usePanelSize'

const HEADER_WIDTH = 110
const RULER_HEIGHT = 28

const CLIP_MOVE_CURSORS: Record<TimelineEditTool, string> = {
  selection: 'cursor-grab',
  slip: 'cursor-col-resize',
  slide: 'cursor-ew-resize',
}

const CLIP_STYLES: Record<Clip['type'], string> = {
  video: 'bg-gradient-to-r from-clip-video/90 to-clip-video/70',
  image: 'bg-gradient-to-r from-clip-image/90 to-clip-image/70',
  audio: 'bg-gradient-to-r from-clip-audio/90 to-clip-audio/70',
  text: 'bg-gradient-to-r from-clip-text/90 to-clip-text/70',
  adjustment: 'bg-[repeating-linear-gradient(135deg,rgba(201,123,212,0.55)_0px,rgba(201,123,212,0.55)_6px,rgba(139,92,246,0.35)_6px,rgba(139,92,246,0.35)_12px)] ring-1 ring-clip-adjustment/50',
}

/**
 * 再生ヘッドだけを currentTime に購読させる。
 * TimelinePanel 本体が購読すると再生中に毎フレーム全クリップが再レンダリングされるため分離している。
 */
function Playhead({ pixelsPerSecond, totalTrackHeight, onMouseDown }: {
  pixelsPerSecond: number
  totalTrackHeight: number
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const currentTime = useProjectStore((s) => s.currentTime)
  return (
    <div
      className="absolute z-30 w-px cursor-ew-resize bg-accent shadow-[0_0_8px_rgba(201,169,110,0.5)]"
      style={{ left: HEADER_WIDTH + currentTime * pixelsPerSecond, top: RULER_HEIGHT, height: totalTrackHeight }}
      onMouseDown={onMouseDown}
    >
      <div className="absolute -top-0 -left-[5px] h-2.5 w-2.5 rounded-sm bg-accent" />
    </div>
  )
}

function Waveform({ data }: { data?: number[] }) {
  if (!data) return null
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
      {data.map((v, i) => (
        <rect key={i} x={`${(i / data.length) * 100}%`} y={`${50 - (v * 80) / 2}%`} width={`${100 / data.length}%`} height={`${v * 80}%`} fill="white" />
      ))}
    </svg>
  )
}

const SHIFT_DRAG_THRESHOLD = 4

export function TimelinePanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tracksContainerRef = useRef<HTMLDivElement>(null)
  const shiftGestureRef = useRef<{ clip: Clip; startX: number; startY: number } | null>(null)
  // スナップが効いている間、その位置に縦のガイドラインを表示する
  const [snapGuide, setSnapGuide] = useState<number | null>(null)
  const [showAddTrackMenu, setShowAddTrackMenu] = useState(false)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingTrackName, setEditingTrackName] = useState('')

  const project = useProjectStore((s) => s.project)
  const tracks = project.tracks
  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks])
  const { heights: trackHeights, setTrackHeight } = useTimelineTrackHeights(trackIds)
  const totalTrackHeight = sumTrackHeights(trackHeights)
  const markers = project.markers ?? []
  const mediaAssets = project.mediaAssets
  const fps = project.fps
  const pixelsPerSecond = useProjectStore((s) => s.pixelsPerSecond)
  const currentTime = useProjectStore((s) => s.currentTime)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const selectedClipIds = useProjectStore((s) => s.selectedClipIds)
  const selectedClipId = useProjectStore((s) => s.selectedClipId)
  const selectedMarkerId = useProjectStore((s) => s.selectedMarkerId)
  const dragState = useProjectStore((s) => s.dragState)
  const inPoint = useProjectStore((s) => s.inPoint)
  const outPoint = useProjectStore((s) => s.outPoint)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)

  const setPixelsPerSecond = useProjectStore((s) => s.setPixelsPerSecond)
  const setSelectedClipId = useProjectStore((s) => s.setSelectedClipId)
  const selectClipAtClick = useProjectStore((s) => s.selectClipAtClick)
  const clearClipSelection = useProjectStore((s) => s.clearClipSelection)
  const setSelectedMarkerId = useProjectStore((s) => s.setSelectedMarkerId)
  const setDragState = useProjectStore((s) => s.setDragState)
  const updateClip = useProjectStore((s) => s.updateClip)
  const updateMarker = useProjectStore((s) => s.updateMarker)
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const moveClip = useProjectStore((s) => s.moveClip)
  const getSnapPoints = useProjectStore((s) => s.getSnapPoints)
  const timelineEditTool = useProjectStore((s) => s.timelineEditTool)
  const selectedNavKeyframe = useProjectStore((s) => s.selectedNavKeyframe)
  const setSelectedNavKeyframe = useProjectStore((s) => s.setSelectedNavKeyframe)
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute)
  const toggleTrackLock = useProjectStore((s) => s.toggleTrackLock)
  const addTrack = useProjectStore((s) => s.addTrack)
  const removeTrack = useProjectStore((s) => s.removeTrack)
  const renameTrack = useProjectStore((s) => s.renameTrack)
  const removeMarker = useProjectStore((s) => s.removeMarker)
  const showToast = useToastStore((s) => s.showToast)

  const { seek } = usePlaybackControls()
  const duration = getProjectDuration()
  const timelineWidth = Math.max(duration * pixelsPerSecond + 200, 800)
  const mediaMap = new Map(mediaAssets.map((a) => [a.id, a]))

  const fitToContent = () => {
    const container = containerRef.current
    if (!container || duration <= 0) return
    setPixelsPerSecond(computeFitTimelinePixelsPerSecond(duration, container.clientWidth, HEADER_WIDTH))
  }

  const scrollTimelineToTime = useCallback((time: number, pixelsPerSecondOverride?: number) => {
    const container = containerRef.current
    if (!container) return
    const pps = pixelsPerSecondOverride ?? pixelsPerSecond
    container.scrollLeft = computeTimelineScrollLeftForTime(time, pps, container.clientWidth, HEADER_WIDTH)
  }, [pixelsPerSecond])

  const scrollPlayheadToCenter = useCallback(() => {
    scrollTimelineToTime(useProjectStore.getState().currentTime)
  }, [scrollTimelineToTime])

  const zoomToSelectedClip = useCallback(() => {
    if (!selectedClipId) {
      showToast('クリップを選択してください', 'info')
      return
    }
    const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    const container = containerRef.current
    if (!clip || !container) return

    const nextPixelsPerSecond = computeZoomToClipPixelsPerSecond(clip.duration, container.clientWidth, HEADER_WIDTH)
    const centerTime = clip.startTime + clip.duration / 2
    setPixelsPerSecond(nextPixelsPerSecond)
    scrollTimelineToTime(centerTime, nextPixelsPerSecond)
  }, [selectedClipId, project.tracks, scrollTimelineToTime, setPixelsPerSecond, showToast])

  useEffect(() => {
    if (dragState) return
    const container = containerRef.current
    if (!container) return

    if (isPlaying) {
      scrollTimelineToTime(currentTime)
      return
    }

    if (!isTimelineTimeVisible(currentTime, pixelsPerSecond, container.clientWidth, container.scrollLeft, HEADER_WIDTH)) {
      scrollTimelineToTime(currentTime)
    }
  }, [currentTime, isPlaying, pixelsPerSecond, dragState, scrollTimelineToTime])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        zoomToSelectedClip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [zoomToSelectedClip])

  const getTrackAtY = useCallback((clientY: number): string | null => {
    const container = tracksContainerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const y = clientY - rect.top + container.scrollTop - RULER_HEIGHT
    const index = findTrackIndexAtY(y, trackHeights)
    if (index < 0 || index >= tracks.length) return null
    return tracks[index].id
  }, [tracks, trackHeights])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return

    if (dragState.mode === 'playhead') {
      const container = containerRef.current
      if (!container) return
      const trackArea = tracksContainerRef.current
      if (!trackArea) return
      const rect = trackArea.getBoundingClientRect()
      const x = e.clientX - rect.left - HEADER_WIDTH + container.scrollLeft
      const time = snapTime(Math.max(0, x / pixelsPerSecond), getSnapPoints())
      seek(Math.min(time, duration))
      return
    }

    const dx = e.clientX - dragState.startX
    const dt = dx / pixelsPerSecond

    if (dragState.mode === 'move') {
      const snapPoints = getSnapPoints(dragState.clipId)
      const raw = dragState.originalStartTime + dt
      const newStart = snapTime(raw, snapPoints)
      setSnapGuide(newStart !== raw ? newStart : null)
      const targetTrackId = getTrackAtY(e.clientY) ?? dragState.originalTrackId
      const targetTrack = tracks.find((t) => t.id === targetTrackId)
      if (targetTrack?.locked) return

      if (targetTrackId !== dragState.originalTrackId) {
        moveClip(dragState.clipId, targetTrackId, Math.max(0, newStart), false)
      } else {
        updateClip(dragState.clipId, { startTime: Math.max(0, newStart) })
      }
      const timeDelta = newStart - dragState.originalStartTime
      for (const companion of dragState.companionMoves ?? []) {
        updateClip(companion.clipId, { startTime: Math.max(0, companion.originalStartTime + timeDelta) })
      }
    } else if (dragState.mode === 'slip') {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (!clip || !canSlipClip(clip)) return
      const slipped = computeSlipClip(
        { ...clip, sourceStart: dragState.originalSourceStart },
        dt,
        mediaAssets,
      )
      if (slipped) updateClip(dragState.clipId, { sourceStart: slipped.sourceStart })
    } else if (dragState.mode === 'slide' && dragState.slideSnapshot) {
      const snapPoints = getSnapPoints(dragState.clipId)
      const rawDelta = dt
      const snappedStart = snapTime(dragState.originalStartTime + rawDelta, snapPoints)
      const delta = snappedStart - dragState.originalStartTime
      setSnapGuide(snappedStart !== dragState.originalStartTime + rawDelta ? snappedStart : null)
      const result = slideClipsFromSnapshot(dragState.slideSnapshot, delta, mediaAssets)
      if (!result) return
      updateClip(result.prev.id, {
        duration: result.prev.duration,
        sourceDuration: result.prev.sourceDuration,
        sourceStart: result.prev.sourceStart,
      })
      updateClip(result.selected.id, { startTime: result.selected.startTime })
      updateClip(result.next.id, {
        startTime: result.next.startTime,
        duration: result.next.duration,
        sourceDuration: result.next.sourceDuration,
        sourceStart: result.next.sourceStart,
      })
    } else if (dragState.mode === 'rollingEdit' && dragState.rollingEditSnapshot && dragState.originalEditTime != null) {
      const snapPoints = getSnapPoints(dragState.clipId)
      const rawDelta = dt
      const snappedEdit = snapTime(dragState.originalEditTime + rawDelta, snapPoints)
      const delta = snappedEdit - dragState.originalEditTime
      setSnapGuide(snappedEdit !== dragState.originalEditTime + rawDelta ? snappedEdit : null)
      const result = computeRollingEdit(dragState.rollingEditSnapshot, delta, mediaAssets)
      if (!result) return
      updateClip(result.prev.id, {
        duration: result.prev.duration,
        sourceDuration: result.prev.sourceDuration,
        sourceStart: result.prev.sourceStart,
      })
      updateClip(result.next.id, {
        startTime: result.next.startTime,
        duration: result.next.duration,
        sourceDuration: result.next.sourceDuration,
        sourceStart: result.next.sourceStart,
      })
    } else if (dragState.mode === 'trimStart') {
      const snapPoints = getSnapPoints(dragState.clipId)
      const raw = dragState.originalStartTime + dt
      const snapped = snapTime(raw, snapPoints)
      setSnapGuide(snapped !== raw ? snapped : null)
      const delta = snapped - dragState.originalStartTime
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (!clip) return
      const clamped = clampTrimStart(clip, snapped, dragState.originalDuration - delta, dragState.originalSourceStart + delta, mediaAssets)
      if (clamped) updateClip(dragState.clipId, clamped)
    } else if (dragState.mode === 'trimEnd') {
      const snapPoints = getSnapPoints(dragState.clipId)
      const raw = dragState.originalStartTime + dragState.originalDuration + dt
      const snapped = snapTime(raw, snapPoints)
      setSnapGuide(snapped !== raw ? snapped : null)
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (!clip) return
      updateClip(dragState.clipId, { duration: clampTrimEnd(clip, snapped - dragState.originalStartTime, mediaAssets), sourceDuration: clampTrimEnd(clip, snapped - dragState.originalStartTime, mediaAssets) })
    } else if (dragState.mode === 'marker' && dragState.markerId) {
      const snapPoints = getSnapPoints(undefined, dragState.markerId)
      const raw = dragState.originalStartTime + dt
      const snapped = resolveMarkerDragTime(raw, duration, snapPoints)
      setSnapGuide(snapped !== clampMarkerTime(raw, duration) ? snapped : null)
      updateMarker(dragState.markerId, { time: snapped }, false)
    } else if (dragState.mode === 'speedKeyframe' && dragState.keyframeId != null) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (clip?.type !== 'video') return
      const videoClip = clip as VideoClip
      const keyframes = videoClip.speedKeyframes
      if (!keyframes?.length) return

      const speedDelta = -(e.clientY - dragState.startY) / SPEED_TIMELINE_LANE_HEIGHT * (SPEED_MAX - SPEED_MIN)
      const newTime = Math.max(0, Math.min(clip.duration, (dragState.originalKeyframeTime ?? 0) + dt))
      const newSpeed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, (dragState.originalKeyframeSpeed ?? 1) + speedDelta))
      const next = updateSpeedKeyframeList(keyframes, dragState.keyframeId, { time: newTime, speed: newSpeed })
      updateClip(dragState.clipId, { speedKeyframes: next }, false)
    } else if (dragState.mode === 'speedBezierHandle' && dragState.keyframeId != null) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (clip?.type !== 'video') return
      const videoClip = clip as VideoClip
      const keyframes = videoClip.speedKeyframes
      if (!keyframes?.length) return

      const timeDelta = dt
      const valueDelta = -(e.clientY - dragState.startY) / SPEED_TIMELINE_LANE_HEIGHT * (SPEED_MAX - SPEED_MIN)
      const newTimeOffset = (dragState.originalBezierTimeOffset ?? 0) + timeDelta
      const newValueOffset = (dragState.originalBezierValueOffset ?? 0) + valueDelta
      const handleType = dragState.transformBezierHandleType ?? 'in'
      const next = updateSpeedBezierHandle(
        keyframes,
        dragState.keyframeId,
        handleType,
        newTimeOffset,
        newValueOffset,
      )
      updateClip(dragState.clipId, { speedKeyframes: next }, false)
    } else if (dragState.mode === 'volumeKeyframe' && dragState.keyframeId != null) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (clip?.type !== 'audio' && clip?.type !== 'video') return
      const audioClip = clip as AudioClip | VideoClip
      const keyframes = audioClip.audio.volumeKeyframes
      if (!keyframes?.length) return

      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY
      const lockAxis = e.shiftKey
      const dt = lockAxis && Math.abs(dy) > Math.abs(dx) ? 0 : dx / pixelsPerSecond
      const volumeDelta = lockAxis && Math.abs(dx) >= Math.abs(dy) ? 0 : -(dy) / VOLUME_TIMELINE_LANE_HEIGHT * 2

      const rawLocalTime = Math.max(0, Math.min(clip.duration, (dragState.originalKeyframeTime ?? 0) + dt))
      const siblingTimes = keyframes
        .filter((kf) => kf.id !== dragState.keyframeId)
        .map((kf) => kf.time)
      const { time: newTime, snapped: timeSnapped } = snapLocalKeyframeTime(
        rawLocalTime,
        clip.startTime,
        clip.duration,
        getSnapPoints(dragState.clipId),
        siblingTimes,
        pixelsPerSecond,
      )
      const rawVolume = Math.max(0, Math.min(2, (dragState.originalKeyframeVolume ?? 1) + volumeDelta))
      const { volume: newVolume } = snapVolume(rawVolume, VOLUME_TIMELINE_LANE_HEIGHT)
      setSnapGuide(timeSnapped ? clip.startTime + newTime : null)
      const next = updateVolumeKeyframeList(keyframes, dragState.keyframeId, { time: newTime, volume: newVolume })
      updateClip(dragState.clipId, { audio: { ...audioClip.audio, volumeKeyframes: next } }, false)
    } else if (dragState.mode === 'transformKeyframe' && dragState.keyframeId != null) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (clip?.type !== 'video' && clip?.type !== 'image' && clip?.type !== 'text') return
      const transformClip = clip as VideoClip | ImageClip | TextClip
      const keyframes = transformClip.transformKeyframes
      if (!keyframes?.length) return

      const property = dragState.transformKeyframeProperty ?? 'opacity'
      const laneHeight = dragState.transformTimelineLaneHeight ?? TRANSFORM_TIMELINE_LANE_HEIGHT
      const propertyDelta = -(e.clientY - dragState.startY) / laneHeight
      const newTime = Math.max(0, Math.min(clip.duration, (dragState.originalKeyframeTime ?? 0) + dt))
      const newValue = applyTransformPropertyLaneDelta(
        dragState.originalKeyframePropertyValue ?? dragState.originalKeyframeOpacity ?? 1,
        propertyDelta,
        property,
      )
      const next = updateTransformKeyframeList(keyframes, dragState.keyframeId, { time: newTime, [property]: newValue })
      updateClip(dragState.clipId, { transformKeyframes: next }, false)
    } else if (dragState.mode === 'transformBezierHandle' && dragState.keyframeId != null) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (clip?.type !== 'video' && clip?.type !== 'image' && clip?.type !== 'text') return
      const transformClip = clip as VideoClip | ImageClip | TextClip
      const keyframes = transformClip.transformKeyframes
      if (!keyframes?.length) return

      const property = dragState.transformKeyframeProperty ?? 'opacity'
      const timeDelta = dt
      const valueDelta = -(e.clientY - dragState.startY) / TRANSFORM_TIMELINE_LANE_HEIGHT
      const { min, max } = (() => {
        switch (property) {
          case 'opacity':
          case 'x':
          case 'y':
            return { min: 0, max: 1 }
          case 'scale':
            return { min: 0.1, max: 3 }
          case 'rotation':
            return { min: -180, max: 180 }
        }
      })()
      const valueRange = max - min
      const newTimeOffset = (dragState.originalBezierTimeOffset ?? 0) + timeDelta
      const newValueOffset = (dragState.originalBezierValueOffset ?? 0) + valueDelta * valueRange
      const handleType = dragState.transformBezierHandleType ?? 'in'
      const next = updateTransformBezierHandle(
        keyframes,
        dragState.keyframeId,
        handleType,
        property,
        newTimeOffset,
        newValueOffset,
      )
      updateClip(dragState.clipId, { transformKeyframes: next }, false)
    }
  }, [dragState, pixelsPerSecond, getSnapPoints, updateClip, updateMarker, moveClip, getTrackAtY, tracks, mediaAssets, project.tracks, seek, duration])

  const handleMouseUp = useCallback(() => {
    if (dragState) {
      const { rippleDelete, project, applyRippleTrimOnTrack } = useProjectStore.getState()
      if (rippleDelete && (dragState.mode === 'trimStart' || dragState.mode === 'trimEnd')) {
        const track = project.tracks.find((t) => t.clips.some((c) => c.id === dragState.clipId))
        const clip = track?.clips.find((c) => c.id === dragState.clipId)
        if (track && clip) {
          const originalEnd = dragState.originalStartTime + dragState.originalDuration
          if (dragState.mode === 'trimEnd') {
            const newEnd = clip.startTime + clip.duration
            applyRippleTrimOnTrack(track.id, dragState.clipId, originalEnd, newEnd - originalEnd)
          } else {
            applyRippleTrimOnTrack(track.id, dragState.clipId, originalEnd, dragState.originalStartTime - clip.startTime)
          }
        }
      }
    }
    setDragState(null)
    setSnapGuide(null)
  }, [dragState, setDragState])

  useEffect(() => {
    if (!dragState) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, handleMouseMove, handleMouseUp])

  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    seek(Math.max(0, Math.min((e.clientX - rect.left) / pixelsPerSecond, duration)))
    clearClipSelection()
    setSelectedMarkerId(null)
  }

  const startDrag = (clip: Clip, mode: 'move' | 'trimStart' | 'trimEnd', e: React.MouseEvent) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (!track || track.locked) return
    e.stopPropagation()
    e.preventDefault()
    useProjectStore.getState().pushHistory()

    let dragClipId = clip.id
    let dragMode: TimelineDragState['mode'] = mode
    const editTool = useProjectStore.getState().timelineEditTool

    if (mode === 'move') {
      if (e.altKey && editTool === 'selection') {
        const newId = useProjectStore.getState().duplicateClipInPlace(clip.id)
        if (newId) dragClipId = newId
      } else if (editTool === 'slip' && canSlipClip(clip)) {
        dragMode = 'slip'
      } else if (editTool === 'slide' && canSlideClip(track.clips, clip.id)) {
        dragMode = 'slide'
      } else if (e.ctrlKey && canSlipClip(clip)) {
        dragMode = 'slip'
      } else if (e.shiftKey && canSlideClip(track.clips, clip.id)) {
        dragMode = 'slide'
      }
    }

    const { prev, next } = findAdjacentClips(track.clips, clip.id)
    const slideSnapshot = dragMode === 'slide' && prev && next
      ? { prev: structuredClone(prev), selected: structuredClone(clip), next: structuredClone(next) }
      : undefined

    const store = useProjectStore.getState()
    if (!store.selectedClipIds.includes(dragClipId)) {
      store.setSelectedClipId(dragClipId)
    }

    const companionMoves = dragMode === 'move' && store.selectedClipIds.length > 1
      ? store.selectedClipIds
        .filter((id) => id !== dragClipId)
        .map((id) => {
          const found = project.tracks.flatMap((t) => t.clips).find((c) => c.id === id)
          return found
            ? { clipId: id, originalStartTime: found.startTime, originalTrackId: found.trackId }
            : null
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
      : undefined

    setSelectedClipId(dragClipId)
    setDragState({
      clipId: dragClipId,
      mode: dragMode,
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
      originalSourceStart: clip.sourceStart,
      originalTrackId: clip.trackId,
      slideSnapshot,
      companionMoves,
    })
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const gesture = shiftGestureRef.current
      if (!gesture || useProjectStore.getState().dragState) return
      const dx = e.clientX - gesture.startX
      const dy = e.clientY - gesture.startY
      if (Math.hypot(dx, dy) < SHIFT_DRAG_THRESHOLD) return
      const pending = gesture.clip
      shiftGestureRef.current = null
      startDrag(pending, 'move', {
        clientX: gesture.startX,
        clientY: gesture.startY,
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        stopPropagation: () => {},
        preventDefault: () => {},
      } as React.MouseEvent)
    }
    const onUp = () => {
      const gesture = shiftGestureRef.current
      if (!gesture || useProjectStore.getState().dragState) return
      shiftGestureRef.current = null
      selectClipAtClick(gesture.clip.id, true)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [selectClipAtClick])

  const beginClipMouseDown = (clip: Clip, mode: 'move' | 'trimStart' | 'trimEnd', e: React.MouseEvent) => {
    if (mode === 'move' && e.shiftKey && timelineEditTool === 'selection') {
      e.stopPropagation()
      e.preventDefault()
      shiftGestureRef.current = { clip, startX: e.clientX, startY: e.clientY }
      return
    }
    startDrag(clip, mode, e)
  }

  const startRollingEditDrag = (prev: Clip, next: Clip, e: React.MouseEvent) => {
    const track = tracks.find((t) => t.id === prev.trackId)
    if (!track || track.locked || timelineEditTool !== 'selection') return
    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    const editTime = prev.startTime + prev.duration
    setDragState({
      clipId: prev.id,
      mode: 'rollingEdit',
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: prev.startTime,
      originalDuration: prev.duration,
      originalSourceStart: prev.sourceStart,
      originalTrackId: prev.trackId,
      rollingEditSnapshot: { prev: structuredClone(prev), next: structuredClone(next) },
      originalEditTime: editTime,
    })
  }

  const startPlayheadDrag = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDragState({ clipId: '', mode: 'playhead', startX: e.clientX, startY: e.clientY, originalStartTime: 0, originalDuration: 0, originalSourceStart: 0, originalTrackId: '', originalTime: useProjectStore.getState().currentTime })
  }

  const startMarkerDrag = (markerId: string, time: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedMarkerId(markerId)
    setDragState({
      clipId: '',
      markerId,
      mode: 'marker',
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: time,
      originalDuration: 0,
      originalSourceStart: 0,
      originalTrackId: '',
    })
  }

  const startSpeedKeyframeDrag = (clip: VideoClip, keyframeId: string, keyframeTime: number, keyframeSpeed: number, e: React.MouseEvent) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedClipId(clip.id)
    setSelectedNavKeyframe({ clipId: clip.id, type: 'speed', keyframeId })
    setDragState({
      clipId: clip.id,
      mode: 'speedKeyframe',
      keyframeId,
      originalKeyframeTime: keyframeTime,
      originalKeyframeSpeed: keyframeSpeed,
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
      originalSourceStart: clip.sourceStart,
      originalTrackId: clip.trackId,
    })
  }

  const addSpeedKeyframeOnTimeline = (clip: VideoClip, time: number, speed: number) => {
    pushHistory()
    const next = createSpeedKeyframeAt(clip, clip.duration, time, speed)
    updateClip(clip.id, { speedKeyframes: next })
  }

  const startSpeedBezierHandleDrag = (
    clip: VideoClip,
    keyframeId: string,
    handleType: 'in' | 'out',
    e: React.MouseEvent,
  ) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    const keyframes = clip.speedKeyframes
    if (!keyframes?.length) return
    const sorted = [...keyframes].sort((a, b) => a.time - b.time)
    const index = sorted.findIndex((kf) => kf.id === keyframeId)
    if (index < 0) return
    const keyframe = sorted[index]
    const partner = handleType === 'out' ? sorted[index + 1] : sorted[index - 1]
    if (!partner) return

    const handle = handleType === 'out'
      ? getSpeedBezierHandleOut(keyframe, partner)
      : getSpeedBezierHandleIn(keyframe, partner)

    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedClipId(clip.id)
    setDragState({
      clipId: clip.id,
      mode: 'speedBezierHandle',
      keyframeId,
      transformBezierHandleType: handleType,
      originalBezierTimeOffset: handle.timeOffset,
      originalBezierValueOffset: handle.valueOffset,
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
      originalSourceStart: clip.sourceStart,
      originalTrackId: clip.trackId,
    })
  }

  const startVolumeKeyframeDrag = (clip: AudioClip | VideoClip, keyframeId: string, keyframeTime: number, keyframeVolume: number, e: React.MouseEvent) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedClipId(clip.id)
    setSelectedNavKeyframe({ clipId: clip.id, type: 'volume', keyframeId })
    setDragState({
      clipId: clip.id,
      mode: 'volumeKeyframe',
      keyframeId,
      originalKeyframeTime: keyframeTime,
      originalKeyframeVolume: keyframeVolume,
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
      originalSourceStart: clip.sourceStart,
      originalTrackId: clip.trackId,
    })
  }

  const addVolumeKeyframeOnTimeline = (clip: AudioClip | VideoClip, time: number, volume: number) => {
    pushHistory()
    const { time: snappedTime } = snapLocalKeyframeTime(
      time,
      clip.startTime,
      clip.duration,
      useProjectStore.getState().getSnapPoints(clip.id),
      (clip.audio.volumeKeyframes ?? []).map((kf) => kf.time),
      pixelsPerSecond,
    )
    const { volume: snappedVolume } = snapVolume(
      volumeAtTimelineClick(clip.audio, clip.duration, snappedTime, volume),
      VOLUME_TIMELINE_LANE_HEIGHT,
    )
    const next = createVolumeKeyframeAt(clip.audio, clip.duration, snappedTime, snappedVolume)
    updateClip(clip.id, { audio: { ...clip.audio, volumeKeyframes: next } })
  }

  const startTransformKeyframeDrag = (
    clip: VideoClip | ImageClip | TextClip,
    keyframeId: string,
    keyframeTime: number,
    property: TransformTimelineProperty,
    propertyValue: number,
    laneHeight: number,
    e: React.MouseEvent,
  ) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedClipId(clip.id)
    setSelectedNavKeyframe({ clipId: clip.id, type: 'transform', keyframeId })
    setDragState({
      clipId: clip.id,
      mode: 'transformKeyframe',
      keyframeId,
      originalKeyframeTime: keyframeTime,
      transformKeyframeProperty: property,
      originalKeyframePropertyValue: propertyValue,
      originalKeyframeOpacity: property === 'opacity' ? propertyValue : undefined,
      transformTimelineLaneHeight: laneHeight,
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
      originalSourceStart: clip.sourceStart,
      originalTrackId: clip.trackId,
    })
  }

  const addTransformKeyframeOnTimeline = (
    clip: VideoClip | ImageClip | TextClip,
    time: number,
    property: TransformTimelineProperty,
    value: number,
  ) => {
    pushHistory()
    const next = createTransformKeyframeAt(clip.transform, clip.transformKeyframes, clip.duration, time, property, value)
    updateClip(clip.id, { transformKeyframes: next })
  }

  const startTransformBezierHandleDrag = (
    clip: VideoClip | ImageClip | TextClip,
    keyframeId: string,
    handleType: 'in' | 'out',
    property: TransformTimelineProperty,
    e: React.MouseEvent,
  ) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    const keyframes = clip.transformKeyframes
    if (!keyframes?.length) return
    const sorted = [...keyframes].sort((a, b) => a.time - b.time)
    const index = sorted.findIndex((kf) => kf.id === keyframeId)
    if (index < 0) return
    const keyframe = sorted[index]
    const partner = handleType === 'out' ? sorted[index + 1] : sorted[index - 1]
    if (!partner) return

    const handle = handleType === 'out'
      ? getBezierHandleOut(keyframe, partner, property)
      : getBezierHandleIn(keyframe, partner, property)

    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedClipId(clip.id)
    setDragState({
      clipId: clip.id,
      mode: 'transformBezierHandle',
      keyframeId,
      transformKeyframeProperty: property,
      transformBezierHandleType: handleType,
      originalBezierTimeOffset: handle.timeOffset,
      originalBezierValueOffset: handle.valueOffset,
      startX: e.clientX,
      startY: e.clientY,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
      originalSourceStart: clip.sourceStart,
      originalTrackId: clip.trackId,
    })
  }

  const commitTrackRename = (trackId: string) => {
    const trimmed = editingTrackName.trim()
    if (trimmed) renameTrack(trackId, trimmed)
    setEditingTrackId(null)
    setEditingTrackName('')
  }

  const handleRemoveTrack = (track: Track) => {
    const result = canRemoveTrack(tracks, track.id)
    if (!result.ok) {
      if (result.reason === 'has-clips') showToast('クリップがあるトラックは削除できません', 'error')
      else if (result.reason === 'min-count') showToast('この種別のトラックは最低1本必要です', 'error')
      return
    }
    if (!removeTrack(track.id)) showToast('トラックを削除できません', 'error')
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="タイムライン" icon={<Icons.Grid size={14} />}>
        <div className="relative">
          <IconButton
            onClick={() => setShowAddTrackMenu((v) => !v)}
            tooltip="トラック追加"
            size="sm"
            data-testid="timeline-add-track-menu"
          >
            <span className="text-sm font-bold leading-none">+</span>
          </IconButton>
          {showAddTrackMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-surface-2 py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[11px] text-text-secondary hover:bg-surface-3"
                data-testid="timeline-add-track-video"
                onClick={() => { addTrack('video'); setShowAddTrackMenu(false) }}
              >
                映像トラック
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[11px] text-text-secondary hover:bg-surface-3"
                data-testid="timeline-add-track-text"
                onClick={() => { addTrack('text'); setShowAddTrackMenu(false) }}
              >
                テキストトラック
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[11px] text-text-secondary hover:bg-surface-3"
                data-testid="timeline-add-track-audio"
                onClick={() => { addTrack('audio'); setShowAddTrackMenu(false) }}
              >
                オーディオトラック
              </button>
            </div>
          )}
        </div>
        <IconButton onClick={fitToContent} tooltip="フィット" size="sm"><Icons.Fit size={13} /></IconButton>
        <IconButton onClick={zoomToSelectedClip} tooltip="選択クリップへズーム (Z)" size="sm"><Icons.Focus size={13} /></IconButton>
        <IconButton onClick={scrollPlayheadToCenter} tooltip="再生位置を中央へ" size="sm"><Icons.Locate size={13} /></IconButton>
        <IconButton onClick={() => setPixelsPerSecond(pixelsPerSecond - 20)} tooltip="ズームアウト" size="sm"><Icons.ZoomOut size={13} /></IconButton>
        <span data-testid="timeline-zoom-label" className="px-1 font-mono text-[10px] text-text-muted">{pixelsPerSecond}px/s</span>
        <IconButton onClick={() => setPixelsPerSecond(pixelsPerSecond + 20)} tooltip="ズームイン" size="sm"><Icons.ZoomIn size={13} /></IconButton>
      </PanelHeader>

      <TimelineEditTools />

      <div ref={containerRef} className="flex-1 overflow-auto" onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setPixelsPerSecond(pixelsPerSecond + (e.deltaY > 0 ? -10 : 10)) } }}>
        <div ref={tracksContainerRef} className="relative" style={{ width: timelineWidth + HEADER_WIDTH, minHeight: totalTrackHeight + RULER_HEIGHT }}>
          {inPoint !== null && outPoint !== null && (
            <div className="pointer-events-none absolute z-0 bg-accent/8" style={{ left: HEADER_WIDTH + inPoint * pixelsPerSecond, top: RULER_HEIGHT, width: (outPoint - inPoint) * pixelsPerSecond, height: totalTrackHeight }} />
          )}

          {/* Ruler */}
          <div className="sticky top-0 z-20 flex border-b border-border bg-surface-2" style={{ height: RULER_HEIGHT }}>
            <div className="shrink-0 border-r border-border bg-surface-2" style={{ width: HEADER_WIDTH }} />
            <div className="relative flex-1 cursor-pointer" onClick={handleTimelineClick}>
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 h-full border-l border-border/60" style={{ left: i * pixelsPerSecond }}>
                  <span className="ml-1.5 font-mono text-[9px] text-text-muted">{formatTime(i, fps)}</span>
                </div>
              ))}
              {markers.map((m) => {
                const isSelected = selectedMarkerId === m.id
                const isBeat = m.type === 'beat'
                return (
                  <div
                    key={m.id}
                    data-marker-id={m.id}
                    data-marker-type={isBeat ? 'beat' : 'chapter'}
                    className={`absolute top-0 z-10 h-full cursor-ew-resize ${isSelected ? 'z-30' : ''}`}
                    style={{ left: m.time * pixelsPerSecond - 5, width: 10 }}
                    title={m.label}
                    onMouseDown={(e) => startMarkerDrag(m.id, m.time, e)}
                    onClick={(e) => { e.stopPropagation(); setSelectedMarkerId(m.id) }}
                    onDoubleClick={(e) => { e.stopPropagation(); removeMarker(m.id) }}
                  >
                    <div className={`absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 ${isSelected
                      ? isBeat ? 'bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      : isBeat ? 'bg-fuchsia-500/70' : 'bg-emerald-500/70'
                    }`} />
                    <Icons.Marker size={10} className={`absolute -top-0.5 left-1/2 -translate-x-1/2 ${isSelected
                      ? isBeat ? 'text-fuchsia-400' : 'text-emerald-400'
                      : isBeat ? 'text-fuchsia-500' : 'text-emerald-500'
                    }`} />
                  </div>
                )
              })}
              {inPoint !== null && <div className="absolute top-0 h-full w-0.5 bg-accent" style={{ left: inPoint * pixelsPerSecond }} />}
              {outPoint !== null && <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: outPoint * pixelsPerSecond }} />}
            </div>
          </div>

          {tracks.map((track, trackIndex) => {
            const laneHeight = trackHeights[trackIndex] ?? 52
            const removable = canRemoveTrack(tracks, track.id).ok
            return (
            <div key={track.id} className="relative flex" style={{ height: laneHeight }} data-testid={`track-row-${track.id}`}>
              <div
                className="sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-b border-border bg-surface-2 px-1.5"
                style={{ width: HEADER_WIDTH }}
                data-testid={`track-header-${track.id}`}
              >
                <IconButton active={track.muted} onClick={() => toggleTrackMute(track.id)} tooltip="ミュート" size="sm" variant={track.muted ? 'danger' : 'ghost'}>
                  {track.muted ? <Icons.VolumeOff size={12} /> : <Icons.Volume size={12} />}
                </IconButton>
                <IconButton active={track.locked} onClick={() => toggleTrackLock(track.id)} tooltip="ロック" size="sm">
                  {track.locked ? <Icons.Lock size={12} /> : <Icons.Unlock size={12} />}
                </IconButton>
                {editingTrackId === track.id ? (
                  <input
                    className="min-w-0 flex-1 rounded bg-surface-3 px-1 py-0.5 text-[10px] text-text-primary ring-1 ring-accent/50"
                    data-testid={`track-rename-input-${track.id}`}
                    value={editingTrackName}
                    autoFocus
                    onChange={(e) => setEditingTrackName(e.target.value)}
                    onBlur={() => commitTrackRename(track.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitTrackRename(track.id)
                      if (e.key === 'Escape') { setEditingTrackId(null); setEditingTrackName('') }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="min-w-0 flex-1 truncate text-[10px] font-medium text-text-secondary"
                    title={track.name}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingTrackId(track.id)
                      setEditingTrackName(track.name)
                    }}
                  >
                    {track.name}
                  </span>
                )}
                {removable && (
                  <IconButton
                    onClick={() => handleRemoveTrack(track)}
                    tooltip="トラック削除"
                    size="sm"
                    variant="ghost"
                    data-testid={`track-delete-${track.id}`}
                  >
                    <Icons.Trash size={11} />
                  </IconButton>
                )}
              </div>
              <div
                className={`track-lane relative flex-1 border-b border-border ${track.muted ? 'bg-surface-0/60 opacity-60' : 'bg-surface-1'}`}
                data-testid={`track-lane-${track.id}`}
                onClick={handleTimelineClick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (track.locked) return
                  const mediaId = e.dataTransfer.getData('mediaId')
                  if (!mediaId) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const startTime = Math.max(0, (e.clientX - rect.left) / pixelsPerSecond)
                  if (!useProjectStore.getState().addClipFromMedia(mediaId, track.id, startTime)) showToast('このトラックには配置できません', 'error')
                }}
              >
                {track.clips.map((clip) => {
                  const media = clip.type !== 'text' && 'mediaId' in clip ? mediaMap.get(clip.mediaId) : undefined
                  const left = clip.startTime * pixelsPerSecond
                  const width = Math.max(clip.duration * pixelsPerSecond, 24)
                  const label = clip.type === 'text'
                    ? formatTimelineTextLabel(clip.text.content)
                    : clip.type === 'adjustment'
                      ? '調整レイヤー'
                      : (media?.name ?? clip.type)
                  const isSelected = selectedClipIds.includes(clip.id)
                  const hasSpeedKeyframes = clip.type === 'video' && ((clip.speedKeyframes?.length ?? 0) > 0 || isSelected)
                  const hasVolumeKeyframes = (clip.type === 'audio' || clip.type === 'video') && ((clip.audio.volumeKeyframes?.length ?? 0) > 0 || isSelected)
                  const hasTransformKeyframes = (clip.type === 'video' || clip.type === 'image' || clip.type === 'text') && ((clip.transformKeyframes?.length ?? 0) > 0 || isSelected)
                  const volumeLaneBottom = hasSpeedKeyframes ? SPEED_TIMELINE_LANE_HEIGHT : 0
                  const transformLaneBottom = (hasVolumeKeyframes ? VOLUME_TIMELINE_LANE_HEIGHT : 0) + volumeLaneBottom
                  const navForClip = selectedNavKeyframe?.clipId === clip.id ? selectedNavKeyframe : null
                  return (
                    <div
                      key={clip.id}
                      className={`absolute top-1.5 bottom-1.5 rounded-md ${CLIP_MOVE_CURSORS[timelineEditTool]} ${CLIP_STYLES[clip.type]} ${isSelected ? 'clip-selected z-10' : 'ring-1 ring-white/10'} ${track.locked ? 'opacity-50' : ''} ${hasVolumeKeyframes || hasSpeedKeyframes || hasTransformKeyframes ? 'overflow-visible' : 'overflow-hidden'}`}
                      style={{ left, width }}
                      onMouseDown={(e) => beginClipMouseDown(clip, 'move', e)}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (e.shiftKey) return
                        selectClipAtClick(clip.id, false)
                      }}
                    >
                      {media?.thumbnail && clip.type !== 'audio' && <img src={media.thumbnail} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />}
                      <Waveform data={clip.type === 'audio' ? media?.waveform : undefined} />
                      {(clip.type === 'audio' || clip.type === 'video') && (
                        <VolumeKeyframesTimeline
                          clip={clip}
                          audio={clip.audio}
                          widthPx={width}
                          isSelected={isSelected}
                          bottomOffset={volumeLaneBottom}
                          highlightKeyframeId={navForClip?.type === 'volume' ? navForClip.keyframeId : null}
                          onSelectKeyframe={(id) => setSelectedNavKeyframe({ clipId: clip.id, type: 'volume', keyframeId: id })}
                          onStartKeyframeDrag={(kf, e) => startVolumeKeyframeDrag(clip, kf.id, kf.time, kf.volume, e)}
                          onAddKeyframe={(time, volume) => addVolumeKeyframeOnTimeline(clip, time, volume)}
                        />
                      )}
                      {clip.type === 'video' && (
                        <SpeedKeyframesTimeline
                          clip={clip}
                          widthPx={width}
                          isSelected={isSelected}
                          highlightKeyframeId={navForClip?.type === 'speed' ? navForClip.keyframeId : null}
                          onSelectKeyframe={(id) => setSelectedNavKeyframe({ clipId: clip.id, type: 'speed', keyframeId: id })}
                          onStartKeyframeDrag={(kf, e) => startSpeedKeyframeDrag(clip, kf.id, kf.time, kf.speed, e)}
                          onStartBezierHandleDrag={(kf, handleType, e) => startSpeedBezierHandleDrag(clip, kf.id, handleType, e)}
                          onAddKeyframe={(time, speed) => addSpeedKeyframeOnTimeline(clip, time, speed)}
                        />
                      )}
                      {(clip.type === 'video' || clip.type === 'image' || clip.type === 'text') && (
                        <TransformKeyframesTimeline
                          clip={clip}
                          transform={clip.transform}
                          transformKeyframes={clip.transformKeyframes}
                          widthPx={width}
                          isSelected={isSelected}
                          bottomOffset={transformLaneBottom}
                          highlightKeyframeId={navForClip?.type === 'transform' ? navForClip.keyframeId : null}
                          onSelectKeyframe={(id) => setSelectedNavKeyframe({ clipId: clip.id, type: 'transform', keyframeId: id })}
                          onStartKeyframeDrag={(kf, property, value, laneHeight, e) => startTransformKeyframeDrag(
                            clip,
                            kf.id,
                            kf.time,
                            property,
                            value,
                            laneHeight,
                            e,
                          )}
                          onStartBezierHandleDrag={(kf, handleType, property, e) => startTransformBezierHandleDrag(
                            clip,
                            kf.id,
                            handleType,
                            property,
                            e,
                          )}
                          onAddKeyframe={(time, property, value) => addTransformKeyframeOnTimeline(clip, time, property, value)}
                        />
                      )}
                      <div className="pointer-events-none relative z-10 truncate px-2 py-1.5 text-[10px] font-semibold text-white drop-shadow-sm">{label}</div>
                      {/* z-20: ラベル行(z-10)より前面に置き、クリップ上端でもトリムを掴めるようにする */}
                      {!track.locked && (
                        <>
                          <div className="absolute top-0 bottom-0 left-0 z-20 w-2 cursor-ew-resize bg-white/15 hover:bg-white/30" onMouseDown={(e) => beginClipMouseDown(clip, 'trimStart', e)} />
                          <div className="absolute top-0 right-0 bottom-0 z-20 w-2 cursor-ew-resize bg-white/15 hover:bg-white/30" onMouseDown={(e) => beginClipMouseDown(clip, 'trimEnd', e)} />
                        </>
                      )}
                    </div>
                  )
                })}
                {timelineEditTool === 'selection' && !track.locked && listAdjacentClipPairs(track.clips).map(({ prev, next }) => {
                  const editLeft = (prev.startTime + prev.duration) * pixelsPerSecond
                  return (
                    <div
                      key={`rolling-${prev.id}-${next.id}`}
                      data-testid={`rolling-edit-handle-${prev.id}-${next.id}`}
                      className="absolute top-1.5 bottom-1.5 z-[25] w-1.5 -translate-x-1/2 cursor-col-resize rounded-sm bg-accent/80 hover:bg-accent"
                      style={{ left: editLeft }}
                      onMouseDown={(e) => startRollingEditDrag(prev, next, e)}
                    />
                  )
                })}
              </div>
              <div
                className="absolute right-0 bottom-0 left-0 z-20 h-1 cursor-row-resize hover:bg-accent/35"
                data-testid={`track-resize-handle-${track.id}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  startResize(e, 'y', laneHeight, 1, (height) => setTrackHeight(track.id, height))
                }}
              />
            </div>
            )
          })}

          {snapGuide !== null && (
            <div
              className="pointer-events-none absolute z-20 w-0 border-l border-dashed border-accent/80"
              style={{ left: HEADER_WIDTH + snapGuide * pixelsPerSecond, top: RULER_HEIGHT, height: totalTrackHeight }}
            />
          )}

          <Playhead pixelsPerSecond={pixelsPerSecond} totalTrackHeight={totalTrackHeight} onMouseDown={startPlayheadDrag} />
        </div>
      </div>
    </div>
  )
}
