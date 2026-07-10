import type { ImageClip, TextClip, Transform, TransformKeyframe, VideoClip } from '../types/project'
import {
  TRANSFORM_TIMELINE_LANE_HEIGHT,
  buildTransformOpacityCurvePath,
  keyframeOpacityValue,
  keyframeToLanePoint,
  laneYToOpacity,
} from '../utils/transformKeyframesTimeline'

type TransformClipLike = VideoClip | ImageClip | TextClip

interface Props {
  clip: TransformClipLike
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  widthPx: number
  isSelected: boolean
  bottomOffset?: number
  onStartKeyframeDrag: (keyframe: TransformKeyframe, e: React.MouseEvent) => void
  onAddKeyframe: (time: number, opacity: number) => void
}

export function TransformKeyframesTimeline({
  clip,
  transform,
  transformKeyframes,
  widthPx,
  isSelected,
  bottomOffset = 0,
  onStartKeyframeDrag,
  onAddKeyframe,
}: Props) {
  const keyframes = transformKeyframes ?? []
  const laneHeight = TRANSFORM_TIMELINE_LANE_HEIGHT
  const showLane = keyframes.length > 0 || isSelected

  if (!showLane || widthPx < 24) return null

  const curvePath = buildTransformOpacityCurvePath(transform, keyframes, clip.duration, widthPx, laneHeight)

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = Math.max(0, Math.min(widthPx, e.clientX - rect.left))
    const localY = Math.max(0, Math.min(laneHeight, e.clientY - rect.top))
    const time = (localX / widthPx) * clip.duration
    const opacity = laneYToOpacity(localY, laneHeight)
    onAddKeyframe(time, opacity)
  }

  return (
    <div
      className={`absolute right-0 left-0 pointer-events-none ${keyframes.length > 0 ? 'z-[20]' : 'z-[15]'}`}
      style={
        bottomOffset > 0
          ? { top: 0, height: laneHeight }
          : { bottom: 0, height: laneHeight }
      }
      aria-hidden={!keyframes.length}
    >
      <svg
        data-testid="transform-opacity-lane"
        className={(keyframes.length > 0 || isSelected) ? 'pointer-events-auto h-full w-full overflow-visible' : 'pointer-events-none h-full w-full overflow-visible'}
        viewBox={`0 0 ${widthPx} ${laneHeight}`}
        preserveAspectRatio="none"
        onDoubleClick={handleDoubleClick}
      >
        {keyframes.length >= 2 && curvePath && (
          <path
            d={curvePath}
            fill="none"
            stroke="rgba(56,189,248,0.9)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {keyframes.length === 1 && (
          <line
            x1={0}
            y1={keyframeToLanePoint(keyframes[0], transform, clip.duration, widthPx, laneHeight).y}
            x2={widthPx}
            y2={keyframeToLanePoint(keyframes[0], transform, clip.duration, widthPx, laneHeight).y}
            stroke="rgba(56,189,248,0.45)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {keyframes.map((kf, index) => {
        const { x, y } = keyframeToLanePoint(kf, transform, clip.duration, widthPx, laneHeight)
        const opacity = keyframeOpacityValue(kf, transform)
        return (
          <button
            key={kf.id}
            type="button"
            aria-label={`トランスフォームキーフレーム ${index + 1}`}
            title={`${kf.time.toFixed(1)}s · 不透明度 ${Math.round(opacity * 100)}%`}
            className="pointer-events-auto absolute z-[21] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-grab border border-white/80 bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)] active:cursor-grabbing"
            style={{ left: x, top: y }}
            onMouseDown={(e) => onStartKeyframeDrag(kf, e)}
            onClick={(e) => e.stopPropagation()}
          />
        )
      })}
    </div>
  )
}
