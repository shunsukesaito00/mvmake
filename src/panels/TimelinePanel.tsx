import { useCallback, useRef, useEffect, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import type { Clip } from '../types/project'
import { formatTime, snapTime } from '../utils/time'
import { clampTrimEnd, clampTrimStart } from '../utils/clipUtils'
import { updateVolumeKeyframeList, VOLUME_TIMELINE_LANE_HEIGHT, createVolumeKeyframeAt, volumeAtTimelineClick } from '../utils/volumeKeyframesTimeline'
import { VolumeKeyframesTimeline } from '../components/VolumeKeyframesTimeline'
import type { AudioClip, VideoClip } from '../types/project'
import { usePlayback } from '../hooks/usePlayback'
import { useToastStore } from '../store/toastStore'
import { PanelHeader, IconButton } from '../components/ui'
import { Icons } from '../components/icons'

const TRACK_HEIGHT = 52
const HEADER_WIDTH = 110
const RULER_HEIGHT = 28

const CLIP_STYLES: Record<Clip['type'], string> = {
  video: 'bg-gradient-to-r from-clip-video/90 to-clip-video/70',
  image: 'bg-gradient-to-r from-clip-image/90 to-clip-image/70',
  audio: 'bg-gradient-to-r from-clip-audio/90 to-clip-audio/70',
  text: 'bg-gradient-to-r from-clip-text/90 to-clip-text/70',
}

/**
 * 再生ヘッドだけを currentTime に購読させる。
 * TimelinePanel 本体が購読すると再生中に毎フレーム全クリップが再レンダリングされるため分離している。
 */
function Playhead({ pixelsPerSecond, trackCount, onMouseDown }: {
  pixelsPerSecond: number
  trackCount: number
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const currentTime = useProjectStore((s) => s.currentTime)
  return (
    <div
      className="absolute z-30 w-px cursor-ew-resize bg-accent shadow-[0_0_8px_rgba(201,169,110,0.5)]"
      style={{ left: HEADER_WIDTH + currentTime * pixelsPerSecond, top: RULER_HEIGHT, height: trackCount * TRACK_HEIGHT }}
      onMouseDown={onMouseDown}
    >
      <div className="absolute -top-0 -left-[5px] h-2.5 w-2.5 rounded-sm bg-accent" />
    </div>
  )
}

function Waveform({ data }: { data?: number[] }) {
  if (!data) return null
  return (
    <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
      {data.map((v, i) => (
        <rect key={i} x={`${(i / data.length) * 100}%`} y={`${50 - (v * 80) / 2}%`} width={`${100 / data.length}%`} height={`${v * 80}%`} fill="white" />
      ))}
    </svg>
  )
}

export function TimelinePanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tracksContainerRef = useRef<HTMLDivElement>(null)
  // スナップが効いている間、その位置に縦のガイドラインを表示する
  const [snapGuide, setSnapGuide] = useState<number | null>(null)

  const project = useProjectStore((s) => s.project)
  const tracks = project.tracks
  const markers = project.markers ?? []
  const mediaAssets = project.mediaAssets
  const fps = project.fps
  const pixelsPerSecond = useProjectStore((s) => s.pixelsPerSecond)
  const selectedClipId = useProjectStore((s) => s.selectedClipId)
  const selectedMarkerId = useProjectStore((s) => s.selectedMarkerId)
  const dragState = useProjectStore((s) => s.dragState)
  const inPoint = useProjectStore((s) => s.inPoint)
  const outPoint = useProjectStore((s) => s.outPoint)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)

  const setPixelsPerSecond = useProjectStore((s) => s.setPixelsPerSecond)
  const setSelectedClipId = useProjectStore((s) => s.setSelectedClipId)
  const setSelectedMarkerId = useProjectStore((s) => s.setSelectedMarkerId)
  const setDragState = useProjectStore((s) => s.setDragState)
  const updateClip = useProjectStore((s) => s.updateClip)
  const updateMarker = useProjectStore((s) => s.updateMarker)
  const pushHistory = useProjectStore((s) => s.pushHistory)
  const moveClip = useProjectStore((s) => s.moveClip)
  const getSnapPoints = useProjectStore((s) => s.getSnapPoints)
  const toggleTrackMute = useProjectStore((s) => s.toggleTrackMute)
  const toggleTrackLock = useProjectStore((s) => s.toggleTrackLock)
  const removeMarker = useProjectStore((s) => s.removeMarker)
  const showToast = useToastStore((s) => s.showToast)

  const { seek } = usePlayback()
  const duration = getProjectDuration()
  const timelineWidth = Math.max(duration * pixelsPerSecond + 200, 800)
  const mediaMap = new Map(mediaAssets.map((a) => [a.id, a]))

  const fitToContent = () => {
    const container = containerRef.current
    if (!container || duration <= 0) return
    const available = container.clientWidth - HEADER_WIDTH - 40
    setPixelsPerSecond(Math.max(20, Math.min(300, available / duration)))
  }

  const getTrackAtY = useCallback((clientY: number): string | null => {
    const container = tracksContainerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const y = clientY - rect.top + container.scrollTop - RULER_HEIGHT
    const index = Math.floor(y / TRACK_HEIGHT)
    if (index < 0 || index >= tracks.length) return null
    return tracks[index].id
  }, [tracks])

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
      const snapped = snapTime(Math.max(0, Math.min(raw, duration)), snapPoints)
      setSnapGuide(snapped !== raw ? snapped : null)
      updateMarker(dragState.markerId, { time: snapped }, false)
    } else if (dragState.mode === 'volumeKeyframe' && dragState.keyframeId != null) {
      const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.id === dragState.clipId)
      if (clip?.type !== 'audio' && clip?.type !== 'video') return
      const audioClip = clip as AudioClip | VideoClip
      const keyframes = audioClip.audio.volumeKeyframes
      if (!keyframes?.length) return

      const volumeDelta = -(e.clientY - dragState.startY) / VOLUME_TIMELINE_LANE_HEIGHT * 2
      const newTime = Math.max(0, Math.min(clip.duration, (dragState.originalKeyframeTime ?? 0) + dt))
      const newVolume = Math.max(0, Math.min(2, (dragState.originalKeyframeVolume ?? 1) + volumeDelta))
      const next = updateVolumeKeyframeList(keyframes, dragState.keyframeId, { time: newTime, volume: newVolume })
      updateClip(dragState.clipId, { audio: { ...audioClip.audio, volumeKeyframes: next } }, false)
    }
  }, [dragState, pixelsPerSecond, getSnapPoints, updateClip, updateMarker, moveClip, getTrackAtY, tracks, mediaAssets, project.tracks, seek, duration])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
    setSnapGuide(null)
  }, [setDragState])

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
    setSelectedClipId(null)
    setSelectedMarkerId(null)
  }

  const startDrag = (clip: Clip, mode: 'move' | 'trimStart' | 'trimEnd', e: React.MouseEvent) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    e.stopPropagation()
    e.preventDefault()
    useProjectStore.getState().pushHistory()

    // Alt+ドラッグ: 元クリップを残し、複製を掴んで動かす
    let dragClipId = clip.id
    if (e.altKey && mode === 'move') {
      const newId = useProjectStore.getState().duplicateClipInPlace(clip.id)
      if (newId) dragClipId = newId
    }

    setSelectedClipId(dragClipId)
    setDragState({ clipId: dragClipId, mode, startX: e.clientX, startY: e.clientY, originalStartTime: clip.startTime, originalDuration: clip.duration, originalSourceStart: clip.sourceStart, originalTrackId: clip.trackId })
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

  const startVolumeKeyframeDrag = (clip: AudioClip | VideoClip, keyframeId: string, keyframeTime: number, keyframeVolume: number, e: React.MouseEvent) => {
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.locked) return
    e.stopPropagation()
    e.preventDefault()
    pushHistory()
    setSelectedClipId(clip.id)
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
    const next = createVolumeKeyframeAt(
      clip.audio,
      clip.duration,
      time,
      volumeAtTimelineClick(clip.audio, clip.duration, time, volume),
    )
    updateClip(clip.id, { audio: { ...clip.audio, volumeKeyframes: next } })
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="タイムライン" icon={<Icons.Grid size={14} />}>
        <IconButton onClick={fitToContent} tooltip="フィット" size="sm"><Icons.Fit size={13} /></IconButton>
        <IconButton onClick={() => setPixelsPerSecond(pixelsPerSecond - 20)} tooltip="ズームアウト" size="sm"><Icons.ZoomOut size={13} /></IconButton>
        <span className="px-1 font-mono text-[10px] text-text-muted">{pixelsPerSecond}px/s</span>
        <IconButton onClick={() => setPixelsPerSecond(pixelsPerSecond + 20)} tooltip="ズームイン" size="sm"><Icons.ZoomIn size={13} /></IconButton>
      </PanelHeader>

      <div ref={containerRef} className="flex-1 overflow-auto" onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setPixelsPerSecond(pixelsPerSecond + (e.deltaY > 0 ? -10 : 10)) } }}>
        <div ref={tracksContainerRef} className="relative" style={{ width: timelineWidth + HEADER_WIDTH, minHeight: tracks.length * TRACK_HEIGHT + RULER_HEIGHT }}>
          {inPoint !== null && outPoint !== null && (
            <div className="pointer-events-none absolute z-0 bg-accent/8" style={{ left: HEADER_WIDTH + inPoint * pixelsPerSecond, top: RULER_HEIGHT, width: (outPoint - inPoint) * pixelsPerSecond, height: tracks.length * TRACK_HEIGHT }} />
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
                return (
                  <div
                    key={m.id}
                    data-marker-id={m.id}
                    className={`absolute top-0 z-10 h-full cursor-ew-resize ${isSelected ? 'z-30' : ''}`}
                    style={{ left: m.time * pixelsPerSecond - 5, width: 10 }}
                    title={m.label}
                    onMouseDown={(e) => startMarkerDrag(m.id, m.time, e)}
                    onClick={(e) => { e.stopPropagation(); setSelectedMarkerId(m.id) }}
                    onDoubleClick={(e) => { e.stopPropagation(); removeMarker(m.id) }}
                  >
                    <div className={`absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 ${isSelected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-emerald-500/70'}`} />
                    <Icons.Marker size={10} className={`absolute -top-0.5 left-1/2 -translate-x-1/2 ${isSelected ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  </div>
                )
              })}
              {inPoint !== null && <div className="absolute top-0 h-full w-0.5 bg-accent" style={{ left: inPoint * pixelsPerSecond }} />}
              {outPoint !== null && <div className="absolute top-0 h-full w-0.5 bg-orange-500" style={{ left: outPoint * pixelsPerSecond }} />}
            </div>
          </div>

          {tracks.map((track) => (
            <div key={track.id} className="flex" style={{ height: TRACK_HEIGHT }}>
              <div className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r border-b border-border bg-surface-2 px-2" style={{ width: HEADER_WIDTH }}>
                <IconButton active={track.muted} onClick={() => toggleTrackMute(track.id)} tooltip="ミュート" size="sm" variant={track.muted ? 'danger' : 'ghost'}>
                  {track.muted ? <Icons.VolumeOff size={12} /> : <Icons.Volume size={12} />}
                </IconButton>
                <IconButton active={track.locked} onClick={() => toggleTrackLock(track.id)} tooltip="ロック" size="sm">
                  {track.locked ? <Icons.Lock size={12} /> : <Icons.Unlock size={12} />}
                </IconButton>
                <span className="truncate text-[10px] font-medium text-text-secondary">{track.name}</span>
              </div>
              <div
                className={`track-lane relative flex-1 border-b border-border ${track.muted ? 'bg-surface-0/60 opacity-60' : 'bg-surface-1'}`}
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
                  const label = clip.type === 'text' ? clip.text.content : (media?.name ?? clip.type)
                  const isSelected = selectedClipId === clip.id
                  const hasVolumeKeyframes = (clip.type === 'audio' || clip.type === 'video') && ((clip.audio.volumeKeyframes?.length ?? 0) > 0 || isSelected)
                  return (
                    <div
                      key={clip.id}
                      className={`absolute top-1.5 bottom-1.5 cursor-grab rounded-md ${CLIP_STYLES[clip.type]} ${isSelected ? 'clip-selected z-10' : 'ring-1 ring-white/10'} ${track.locked ? 'opacity-50' : ''} ${hasVolumeKeyframes ? 'overflow-visible' : 'overflow-hidden'}`}
                      style={{ left, width }}
                      onMouseDown={(e) => startDrag(clip, 'move', e)}
                      onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id) }}
                    >
                      {media?.thumbnail && clip.type !== 'audio' && <img src={media.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
                      <Waveform data={clip.type === 'audio' ? media?.waveform : undefined} />
                      {(clip.type === 'audio' || clip.type === 'video') && (
                        <VolumeKeyframesTimeline
                          clip={clip}
                          audio={clip.audio}
                          widthPx={width}
                          isSelected={isSelected}
                          onStartKeyframeDrag={(kf, e) => startVolumeKeyframeDrag(clip, kf.id, kf.time, kf.volume, e)}
                          onAddKeyframe={(time, volume) => addVolumeKeyframeOnTimeline(clip, time, volume)}
                        />
                      )}
                      <div className="relative z-10 truncate px-2 py-1.5 text-[10px] font-semibold text-white drop-shadow-sm">{label}</div>
                      {/* z-20: ラベル行(z-10)より前面に置き、クリップ上端でもトリムを掴めるようにする */}
                      {!track.locked && (
                        <>
                          <div className="absolute top-0 bottom-0 left-0 z-20 w-2 cursor-ew-resize bg-white/15 hover:bg-white/30" onMouseDown={(e) => startDrag(clip, 'trimStart', e)} />
                          <div className="absolute top-0 right-0 bottom-0 z-20 w-2 cursor-ew-resize bg-white/15 hover:bg-white/30" onMouseDown={(e) => startDrag(clip, 'trimEnd', e)} />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {snapGuide !== null && (
            <div
              className="pointer-events-none absolute z-20 w-0 border-l border-dashed border-accent/80"
              style={{ left: HEADER_WIDTH + snapGuide * pixelsPerSecond, top: RULER_HEIGHT, height: tracks.length * TRACK_HEIGHT }}
            />
          )}

          <Playhead pixelsPerSecond={pixelsPerSecond} trackCount={tracks.length} onMouseDown={startPlayheadDrag} />
        </div>
      </div>
    </div>
  )
}
