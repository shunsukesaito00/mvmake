import { useRef, useState } from 'react'
import type { ImageClip, TextClip, Transform, TransformKeyframe, VideoClip } from '../types/project'
import {
  TRANSFORM_TIMELINE_LEGEND_HEIGHT,
  TRANSFORM_TIMELINE_PROPERTIES,
  TRANSFORM_TIMELINE_PROPERTY_COLORS,
  TRANSFORM_TIMELINE_PROPERTY_LABELS,
  TRANSFORM_TIMELINE_TAB_HEIGHT,
  bezierHandleToLanePoint,
  buildAllTransformPropertyCurvePaths,
  buildTransformPropertyCurvePath,
  formatTransformKeyframeTitle,
  getTransformTimelineLaneHeight,
  getTransformTimelineTotalHeight,
  keyframeToLanePoint,
  keyframePropertyValue,
  laneYToProperty,
  segmentUsesBezier,
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
  highlightKeyframeId?: string | null
  onSelectKeyframe?: (keyframeId: string) => void
  onStartKeyframeDrag: (
    keyframe: TransformKeyframe,
    property: TransformTimelineProperty,
    propertyValue: number,
    laneHeight: number,
    e: React.MouseEvent,
  ) => void
  onStartBezierHandleDrag: (
    keyframe: TransformKeyframe,
    handleType: 'in' | 'out',
    property: TransformTimelineProperty,
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
  highlightKeyframeId,
  onSelectKeyframe,
  onStartKeyframeDrag,
  onStartBezierHandleDrag,
  onAddKeyframe,
}: Props) {
  const [selectedProperty, setSelectedProperty] = useState<TransformTimelineProperty>('opacity')
  const [showAllProperties, setShowAllProperties] = useState(false)
  const selectedPropertyRef = useRef(selectedProperty)
  selectedPropertyRef.current = selectedProperty
  const keyframes = transformKeyframes ?? []
  const laneHeight = getTransformTimelineLaneHeight(showAllProperties)
  const showLane = keyframes.length > 0 || isSelected
  const totalHeight = getTransformTimelineTotalHeight(showAllProperties)
  const legendTop = TRANSFORM_TIMELINE_TAB_HEIGHT
  const laneTop = legendTop + (showAllProperties ? TRANSFORM_TIMELINE_LEGEND_HEIGHT : 0)

  if (!showLane || widthPx < 24) return null

  const singleCurvePath = buildTransformPropertyCurvePath(
    transform,
    keyframes,
    clip.duration,
    widthPx,
    laneHeight,
    selectedProperty,
  )
  const allCurvePaths = showAllProperties
    ? buildAllTransformPropertyCurvePaths(transform, keyframes, clip.duration, widthPx, laneHeight)
    : []

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
        <button
          type="button"
          data-testid="transform-kf-show-all"
          aria-pressed={showAllProperties}
          aria-label="全属性を同時表示"
          title="全属性カーブを重ね表示"
          className={`ml-auto rounded px-1 text-[8px] font-semibold ring-1 transition-all ${
            showAllProperties
              ? 'bg-violet-500/25 text-violet-200 ring-violet-400/50'
              : 'bg-surface-4/80 text-text-muted ring-border hover:text-text-secondary'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            setShowAllProperties((prev) => !prev)
          }}
        >
          全属性
        </button>
      </div>
      {showAllProperties && (
        <div
          data-testid="transform-kf-legend"
          className="pointer-events-none flex h-[10px] items-center gap-1.5 px-1"
          style={{ marginTop: 0 }}
        >
          {TRANSFORM_TIMELINE_PROPERTIES.map((property) => (
            <span
              key={property}
              data-testid={`transform-kf-legend-${property}`}
              className={`flex items-center gap-0.5 text-[7px] ${
                selectedProperty === property ? 'font-semibold text-text-secondary' : 'text-text-muted'
              }`}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: TRANSFORM_TIMELINE_PROPERTY_COLORS[property] }}
              />
              {TRANSFORM_TIMELINE_PROPERTY_LABELS[property]}
            </span>
          ))}
        </div>
      )}
      <svg
        data-testid="transform-property-lane"
        className={(keyframes.length > 0 || isSelected) ? 'pointer-events-auto w-full overflow-visible' : 'pointer-events-none w-full overflow-visible'}
        style={{ height: laneHeight, marginTop: showAllProperties ? 0 : 0 }}
        viewBox={`0 0 ${widthPx} ${laneHeight}`}
        preserveAspectRatio="none"
        onDoubleClick={handleDoubleClick}
      >
        {showAllProperties ? (
          <>
            {allCurvePaths.map(({ property, path }) => (
              <path
                key={property}
                data-testid={`transform-kf-curve-${property}`}
                d={path}
                fill="none"
                stroke={TRANSFORM_TIMELINE_PROPERTY_COLORS[property]}
                strokeWidth={selectedProperty === property ? 2 : 1}
                strokeOpacity={selectedProperty === property ? 1 : 0.55}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </>
        ) : (
          <>
            {keyframes.length >= 2 && keyframes.slice(0, -1).map((start, index) => {
              const end = keyframes[index + 1]
              if (!segmentUsesBezier(start, end, selectedProperty)) return null
              const p0 = keyframeToLanePoint(start, transform, clip.duration, widthPx, laneHeight, selectedProperty)
              const p3 = keyframeToLanePoint(end, transform, clip.duration, widthPx, laneHeight, selectedProperty)
              const p1 = bezierHandleToLanePoint(start, end, 'out', transform, clip.duration, widthPx, laneHeight, selectedProperty)
              const p2 = bezierHandleToLanePoint(end, start, 'in', transform, clip.duration, widthPx, laneHeight, selectedProperty)
              return (
                <g key={`${start.id}-${end.id}`}>
                  <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="rgba(56,189,248,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="rgba(56,189,248,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </g>
              )
            })}
            {keyframes.length >= 2 && singleCurvePath && (
              <path
                data-testid={`transform-kf-curve-${selectedProperty}`}
                d={singleCurvePath}
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
          </>
        )}
      </svg>
      {keyframes.map((kf, index) => {
        const { x, y } = keyframeToLanePoint(kf, transform, clip.duration, widthPx, laneHeight, selectedProperty)
        const prev = index > 0 ? keyframes[index - 1] : null
        const next = index < keyframes.length - 1 ? keyframes[index + 1] : null
        const showBezierHandles = !showAllProperties
        const showHandleIn = showBezierHandles && !!prev
        const showHandleOut = showBezierHandles && !!next
        const handleInPoint = prev
          ? bezierHandleToLanePoint(kf, prev, 'in', transform, clip.duration, widthPx, laneHeight, selectedProperty)
          : null
        const handleOutPoint = next
          ? bezierHandleToLanePoint(kf, next, 'out', transform, clip.duration, widthPx, laneHeight, selectedProperty)
          : null

        return (
          <div key={kf.id}>
            {showHandleIn && handleInPoint && (
              <button
                type="button"
                data-testid={`transform-bezier-handle-in-${index + 1}`}
                aria-label={`ベジェハンドル（入） ${index + 1}`}
                className="pointer-events-auto absolute z-[21] h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-sky-200/80 bg-sky-300/90 active:cursor-grabbing"
                style={{ left: handleInPoint.x, top: handleInPoint.y + laneTop }}
                onMouseDown={(e) => onStartBezierHandleDrag(kf, 'in', selectedPropertyRef.current, e)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {showHandleOut && handleOutPoint && (
              <button
                type="button"
                data-testid={`transform-bezier-handle-out-${index + 1}`}
                aria-label={`ベジェハンドル（出） ${index + 1}`}
                className="pointer-events-auto absolute z-[21] h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-sky-200/80 bg-sky-300/90 active:cursor-grabbing"
                style={{ left: handleOutPoint.x, top: handleOutPoint.y + laneTop }}
                onMouseDown={(e) => onStartBezierHandleDrag(kf, 'out', selectedPropertyRef.current, e)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              type="button"
              aria-label={`トランスフォームキーフレーム ${index + 1}`}
              title={formatTransformKeyframeTitle(kf, transform, selectedProperty)}
              className={`pointer-events-auto absolute z-[22] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-grab border shadow-[0_0_6px_rgba(56,189,248,0.8)] active:cursor-grabbing ${
                kf.id === highlightKeyframeId
                  ? 'border-white bg-white ring-2 ring-sky-300'
                  : 'border-white/80 bg-sky-400'
              }`}
              style={{ left: x, top: y + laneTop }}
              onMouseDown={(e) => onStartKeyframeDrag(
                kf,
                selectedPropertyRef.current,
                keyframePropertyValue(kf, transform, selectedPropertyRef.current),
                laneHeight,
                e,
              )}
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
