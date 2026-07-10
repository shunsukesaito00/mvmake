import { useRef, useState } from 'react'
import type { ImageClip, TextClip, Transform, TransformKeyframe, VideoClip } from '../types/project'
import {
  TRANSFORM_TIMELINE_LANE_HEIGHT,
  TRANSFORM_TIMELINE_PROPERTIES,
  TRANSFORM_TIMELINE_PROPERTY_LABELS,
  TRANSFORM_TIMELINE_TAB_HEIGHT,
  buildTransformPropertyCurvePath,
  formatTransformKeyframeTitle,
  keyframeToLanePoint,
  keyframePropertyValue,
  laneYToProperty,
  type TransformTimelineProperty,
} from '../utils/transformKeyframesTimeline'

type TransformClipLike = VideoClip | ImageClip | TextClip

interface Props {
  clip: TransformClipLike
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  widthPx: number
  isSelected: boolean
  bottomOffset?: number
  onStartKeyframeDrag: (
    keyframe: TransformKeyframe,
    property: TransformTimelineProperty,
    propertyValue: number,
    e: React.MouseEvent,
  ) => void
  onAddKeyframe: (time: number, property: TransformTimelineProperty, value: number) => void
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
  const [selectedProperty, setSelectedProperty] = useState<TransformTimelineProperty>('opacity')
  const selectedPropertyRef = useRef(selectedProperty)
  selectedPropertyRef.current = selectedProperty
  const keyframes = transformKeyframes ?? []
  const laneHeight = TRANSFORM_TIMELINE_LANE_HEIGHT
  const showLane = keyframes.length > 0 || isSelected
  const totalHeight = laneHeight + TRANSFORM_TIMELINE_TAB_HEIGHT

  if (!showLane || widthPx < 24) return null

  const curvePath = buildTransformPropertyCurvePath(
    transform,
    keyframes,
    clip.duration,
    widthPx,
    laneHeight,
    selectedProperty,
  )

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const localX = Math.max(0, Math.min(widthPx, e.clientX - rect.left))
    const localY = Math.max(0, Math.min(laneHeight, e.clientY - rect.top))
    const time = (localX / widthPx) * clip.duration
    const value = laneYToProperty(localY, selectedPropertyRef.current, laneHeight)
    onAddKeyframe(time, selectedPropertyRef.current, value)
  }

  return (
    <div
      className={`absolute right-0 left-0 pointer-events-none ${keyframes.length > 0 ? 'z-[20]' : 'z-[15]'}`}
      style={
        bottomOffset > 0
          ? { top: 0, height: totalHeight }
          : { bottom: 0, height: totalHeight }
      }
      aria-hidden={!keyframes.length}
    >
      <div className="pointer-events-auto flex h-[14px] gap-0.5 px-0.5">
        {TRANSFORM_TIMELINE_PROPERTIES.map((property) => (
          <button
            key={property}
            type="button"
            data-testid={`transform-kf-property-${property}`}
            aria-pressed={selectedProperty === property}
            className={`rounded px-1 text-[8px] font-semibold ring-1 transition-all ${
              selectedProperty === property
                ? 'bg-sky-500/25 text-sky-300 ring-sky-400/50'
                : 'bg-surface-4/80 text-text-muted ring-border hover:text-text-secondary'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedProperty(property)
            }}
          >
            {TRANSFORM_TIMELINE_PROPERTY_LABELS[property]}
          </button>
        ))}
      </div>
      <svg
        data-testid="transform-property-lane"
        className={(keyframes.length > 0 || isSelected) ? 'pointer-events-auto h-6 w-full overflow-visible' : 'pointer-events-none h-6 w-full overflow-visible'}
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
            y1={keyframeToLanePoint(keyframes[0], transform, clip.duration, widthPx, laneHeight, selectedProperty).y}
            x2={widthPx}
            y2={keyframeToLanePoint(keyframes[0], transform, clip.duration, widthPx, laneHeight, selectedProperty).y}
            stroke="rgba(56,189,248,0.45)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {keyframes.map((kf, index) => {
        const { x, y } = keyframeToLanePoint(kf, transform, clip.duration, widthPx, laneHeight, selectedProperty)
        return (
          <button
            key={kf.id}
            type="button"
            aria-label={`トランスフォームキーフレーム ${index + 1}`}
            title={formatTransformKeyframeTitle(kf, transform, selectedProperty)}
            className="pointer-events-auto absolute z-[21] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-grab border border-white/80 bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)] active:cursor-grabbing"
            style={{ left: x, top: y + TRANSFORM_TIMELINE_TAB_HEIGHT }}
            onMouseDown={(e) => onStartKeyframeDrag(
              kf,
              selectedPropertyRef.current,
              keyframePropertyValue(kf, transform, selectedPropertyRef.current),
              e,
            )}
            onClick={(e) => e.stopPropagation()}
          />
        )
      })}
    </div>
  )
}
