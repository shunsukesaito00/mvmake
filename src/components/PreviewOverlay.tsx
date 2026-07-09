import { useRef } from 'react'
import { getLongestLineLength, getTextBlockHeight, splitTextLines } from '../utils/textLayout'
import { useProjectStore } from '../store/projectStore'
import type { Clip, ImageClip, Project, TextClip, Transform, VideoClip } from '../types/project'
import { getTransformAtLocalTime } from '../utils/transformKeyframes'
import { upsertTransformKeyframeAt } from '../utils/transformKeyframesTimeline'

type VisualClip = VideoClip | ImageClip | TextClip

function isVisual(clip: Clip): clip is VisualClip {
  return clip.type === 'video' || clip.type === 'image' || clip.type === 'text'
}

/** クリップの描画領域を正規化座標(0〜1)で概算する */
function getClipBox(clip: VisualClip, project: Project): { w: number; h: number } {
  const W = project.width
  const H = project.height

  if (clip.type === 'text') {
    const fs = clip.text.fontSize * (W / 1920)
    const lineCount = Math.max(splitTextLines(clip.text.content).length, 1)
    const longestLine = getLongestLineLength(clip.text.content)
    const w = Math.max(fs * longestLine * 0.6, fs * 2) / W
    const h = getTextBlockHeight(lineCount, fs, clip.text.lineHeight) / H
    return { w: Math.min(w, 1.5), h }
  }

  const assets = project.mediaAssets
  const asset = assets.find((a) => a.id === clip.mediaId)
  const vw = asset?.width ?? W
  const vh = asset?.height ?? H
  const aspect = vw / vh
  const canvasAspect = W / H
  const scale = clip.transform.scale
  let drawW: number
  let drawH: number
  if (aspect > canvasAspect) {
    drawH = H * scale
    drawW = drawH * aspect
  } else {
    drawW = W * scale
    drawH = drawW / aspect
  }
  return { w: drawW / W, h: drawH / H }
}

export function PreviewOverlay() {
  const rootRef = useRef<HTMLDivElement>(null)

  const project = useProjectStore((s) => s.project)
  const currentTime = useProjectStore((s) => s.currentTime)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const selectedClip = useProjectStore((s) => s.getSelectedClip())
  const updateClip = useProjectStore((s) => s.updateClip)

  if (!selectedClip || !isVisual(selectedClip) || isPlaying) return null
  const active = currentTime >= selectedClip.startTime && currentTime < selectedClip.startTime + selectedClip.duration
  if (!active) return null

  const clip = selectedClip
  const localTime = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime))
  const hasTransformKeyframes = (clip.transformKeyframes?.length ?? 0) > 0
  const transform = getTransformAtLocalTime(clip.transform, clip.transformKeyframes, localTime, clip.duration)
  const box = getClipBox(clip, project)

  const applyTransformPatch = (patch: Partial<Pick<Transform, 'x' | 'y' | 'scale' | 'rotation'>>, recordHistory = false) => {
    if (!hasTransformKeyframes) {
      updateClip(clip.id, { transform: { ...clip.transform, ...patch } }, recordHistory)
      return
    }
    const current = getTransformAtLocalTime(clip.transform, clip.transformKeyframes, localTime, clip.duration)
    const next = upsertTransformKeyframeAt(clip.transform, clip.transformKeyframes, clip.duration, localTime, {
      x: current.x,
      y: current.y,
      scale: current.scale,
      rotation: current.rotation,
      ...patch,
    })
    updateClip(clip.id, { transformKeyframes: next }, recordHistory)
  }

  const beginDrag = (
    e: React.PointerEvent,
    onMove: (dx: number, dy: number, rect: DOMRect, ev: PointerEvent) => void,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = rootRef.current!.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    useProjectStore.getState().pushHistory()

    const handleMove = (ev: PointerEvent) => onMove(ev.clientX - startX, ev.clientY - startY, rect, ev)
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startMove = (e: React.PointerEvent) => {
    const { x, y } = transform
    beginDrag(e, (dx, dy, rect) => {
      applyTransformPatch({
        x: Math.max(0, Math.min(1, x + dx / rect.width)),
        y: Math.max(0, Math.min(1, y + dy / rect.height)),
      })
    })
  }

  const startScale = (e: React.PointerEvent) => {
    const rect = rootRef.current!.getBoundingClientRect()
    const cx = rect.left + transform.x * rect.width
    const cy = rect.top + transform.y * rect.height
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy)
    const startScaleValue = transform.scale
    beginDrag(e, (_dx, _dy, _rect, ev) => {
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy)
      if (startDist < 4) return
      const next = Math.max(0.1, Math.min(3, startScaleValue * (dist / startDist)))
      applyTransformPatch({ scale: next })
    })
  }

  const startRotate = (e: React.PointerEvent) => {
    const rect = rootRef.current!.getBoundingClientRect()
    const cx = rect.left + transform.x * rect.width
    const cy = rect.top + transform.y * rect.height
    beginDrag(e, (_dx, _dy, _rect, ev) => {
      const angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
      const normalized = ((angle + 180) % 360) - 180
      const snapped = ev.shiftKey ? Math.round(normalized / 15) * 15 : Math.round(normalized)
      applyTransformPatch({ rotation: snapped })
    })
  }

  const handleClass = 'pointer-events-auto absolute h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface-0 hover:scale-125 transition-transform'

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div
        className="pointer-events-auto absolute cursor-move"
        style={{
          left: `${(transform.x - box.w / 2) * 100}%`,
          top: `${(transform.y - box.h / 2) * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
          transform: `rotate(${transform.rotation}deg)`,
        }}
        onPointerDown={startMove}
      >
        <div className="absolute inset-0 border border-accent/90 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />

        {/* スケールハンドル(四隅) */}
        <div className={`${handleClass} -top-1.5 -left-1.5 cursor-nwse-resize`} onPointerDown={startScale} />
        <div className={`${handleClass} -top-1.5 -right-1.5 cursor-nesw-resize`} onPointerDown={startScale} />
        <div className={`${handleClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`} onPointerDown={startScale} />
        <div className={`${handleClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`} onPointerDown={startScale} />

        {/* 回転ハンドル(上部) */}
        <div className="pointer-events-none absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-accent/60" />
        <div
          className="pointer-events-auto absolute -top-8 left-1/2 h-3 w-3 -translate-x-1/2 cursor-grab rounded-full border-2 border-accent bg-surface-0 hover:scale-125 transition-transform"
          onPointerDown={startRotate}
          title="ドラッグで回転 (Shift: 15°スナップ)"
        />
      </div>
    </div>
  )
}
