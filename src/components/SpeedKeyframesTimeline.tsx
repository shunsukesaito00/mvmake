import type { SpeedKeyframe, VideoClip } from '../types/project'
import {
  SPEED_TIMELINE_LANE_HEIGHT,
  bezierHandleToLanePoint,
  buildSpeedCurvePath,
  keyframeToLanePoint,
  laneYToSpeed,
  segmentUsesBezier,
} from '../utils/speedKeyframesTimeline'

interface Props {
  clip: VideoClip
  widthPx: number
  isSelected: boolean
  highlightKeyframeId?: string | null
  onSelectKeyframe?: (keyframeId: string) => void
  onStartKeyframeDrag: (keyframe: SpeedKeyframe, e: React.MouseEvent) => void
  onStartBezierHandleDrag: (keyframe: SpeedKeyframe, handleType: 'in' | 'out', e: React.MouseEvent) => void
  onAddKeyframe: (time: number, speed: number) => void
}

export function SpeedKeyframesTimeline({
  clip,
  widthPx,
  isSelected,
  highlightKeyframeId,
  onSelectKeyframe,
  onStartKeyframeDrag,
  onStartBezierHandleDrag,
  onAddKeyframe,
}: Props) {
  const keyframes = clip.speedKeyframes ?? []
  const laneHeight = SPEED_TIMELINE_LANE_HEIGHT
  const showLane = keyframes.length > 0 || isSelected

  if (!showLane || widthPx < 24) return null

  const curvePath = buildSpeedCurvePath(clip, clip.duration, widthPx, laneHeight)

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = Math.max(0, Math.min(widthPx, e.clientX - rect.left))
    const localY = Math.max(0, Math.min(laneHeight, e.clientY - rect.top))
    const time = (localX / widthPx) * clip.duration
    const speed = laneYToSpeed(localY, laneHeight)
    onAddKeyframe(time, speed)
  }

  return (
    <div
      className={`absolute right-0 left-0 pointer-events-none ${keyframes.length > 0 ? 'z-[22]' : 'z-[16]'}`}
      style={{ height: laneHeight, bottom: 0 }}
      aria-hidden={!keyframes.length}
    >
      <svg
        className={(keyframes.length > 0 || isSelected) ? 'pointer-events-auto h-full w-full overflow-visible' : 'pointer-events-none h-full w-full overflow-visible'}
        viewBox={`0 0 ${widthPx} ${laneHeight}`}
        preserveAspectRatio="none"
        onDoubleClick={handleDoubleClick}
      >
        {keyframes.length >= 2 && keyframes.slice(0, -1).map((start, index) => {
          const end = keyframes[index + 1]
          if (!segmentUsesBezier(start, end)) return null
          const p0 = keyframeToLanePoint(start, clip.duration, widthPx, laneHeight)
          const p3 = keyframeToLanePoint(end, clip.duration, widthPx, laneHeight)
          const p1 = bezierHandleToLanePoint(start, end, 'out', clip.duration, widthPx, laneHeight)
          const p2 = bezierHandleToLanePoint(end, start, 'in', clip.duration, widthPx, laneHeight)
          return (
            <g key={`${start.id}-${end.id}`}>
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="rgba(120,200,255,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="rgba(120,200,255,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
        {keyframes.length >= 2 && curvePath && (
          <path
            d={curvePath}
            fill="none"
            stroke="rgba(120,200,255,0.9)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {keyframes.length === 1 && (
          <line
            x1={0}
            y1={keyframeToLanePoint(keyframes[0], clip.duration, widthPx, laneHeight).y}
            x2={widthPx}
            y2={keyframeToLanePoint(keyframes[0], clip.duration, widthPx, laneHeight).y}
            stroke="rgba(120,200,255,0.45)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {keyframes.map((kf, index) => {
        const { x, y } = keyframeToLanePoint(kf, clip.duration, widthPx, laneHeight)
        const prev = index > 0 ? keyframes[index - 1] : null
        const next = index < keyframes.length - 1 ? keyframes[index + 1] : null
        const handleInPoint = prev
          ? bezierHandleToLanePoint(kf, prev, 'in', clip.duration, widthPx, laneHeight)
          : null
        const handleOutPoint = next
          ? bezierHandleToLanePoint(kf, next, 'out', clip.duration, widthPx, laneHeight)
          : null

        return (
          <div key={kf.id}>
            {prev && handleInPoint && (
              <button
                type="button"
                data-testid={`speed-bezier-handle-in-${index + 1}`}
                aria-label={`速度ベジェハンドル（入） ${index + 1}`}
                className="pointer-events-auto absolute z-[23] h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-sky-200/80 bg-sky-300/90 active:cursor-grabbing"
                style={{ left: handleInPoint.x, top: handleInPoint.y }}
                onMouseDown={(e) => onStartBezierHandleDrag(kf, 'in', e)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {next && handleOutPoint && (
              <button
                type="button"
                data-testid={`speed-bezier-handle-out-${index + 1}`}
                aria-label={`速度ベジェハンドル（出） ${index + 1}`}
                className="pointer-events-auto absolute z-[23] h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-sky-200/80 bg-sky-300/90 active:cursor-grabbing"
                style={{ left: handleOutPoint.x, top: handleOutPoint.y }}
                onMouseDown={(e) => onStartBezierHandleDrag(kf, 'out', e)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              type="button"
              aria-label={`速度キーフレーム ${index + 1}`}
              title={`${kf.time.toFixed(1)}s · ${kf.speed}x`}
              className={`pointer-events-auto absolute z-[24] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border shadow-[0_0_6px_rgba(56,189,248,0.8)] active:cursor-grabbing ${
                kf.id === highlightKeyframeId
                  ? 'border-white bg-white ring-2 ring-sky-300'
                  : 'border-white/80 bg-sky-400'
              }`}
              style={{ left: x, top: y }}
              onMouseDown={(e) => onStartKeyframeDrag(kf, e)}
              onClick={(e) => {
                e.stopPropagation()
                onSelectKeyframe?.(kf.id)
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
