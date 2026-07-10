import { useEffect, useRef, useState } from 'react'
import type { Transform, TransformKeyframe } from '../types/project'
import {
  TRANSFORM_TIMELINE_PROPERTIES,
  TRANSFORM_TIMELINE_PROPERTY_COLORS,
  TRANSFORM_TIMELINE_PROPERTY_LABELS,
  buildTransformPropertyCurvePath,
  keyframeToLanePoint,
  type TransformTimelineProperty,
} from '../utils/transformKeyframesTimeline'

const GRAPH_LANE_HEIGHT = 88

interface Props {
  transform: Transform
  keyframes: TransformKeyframe[]
  clipDuration: number
  selectedProperty: TransformTimelineProperty
  selectedKeyframeId: string | null
  onSelectProperty: (property: TransformTimelineProperty) => void
  onSelectKeyframe: (id: string) => void
}

export function TransformKeyframeGraphEditor({
  transform,
  keyframes,
  clipDuration,
  selectedProperty,
  selectedKeyframeId,
  onSelectProperty,
  onSelectKeyframe,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(240)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(Math.max(120, el.clientWidth))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const curvePath = buildTransformPropertyCurvePath(
    transform,
    keyframes,
    clipDuration,
    width,
    GRAPH_LANE_HEIGHT,
    selectedProperty,
  )

  return (
    <div className="space-y-1.5 rounded-lg bg-surface-3 p-2 ring-1 ring-border">
      <p className="text-[10px] font-medium text-text-secondary">グラフエディタ</p>
      <div className="flex flex-wrap gap-0.5">
        {TRANSFORM_TIMELINE_PROPERTIES.map((property) => (
          <button
            key={property}
            type="button"
            data-testid={`transform-graph-property-${property}`}
            aria-pressed={selectedProperty === property}
            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ring-1 transition-all ${
              selectedProperty === property
                ? 'bg-sky-500/25 text-sky-300 ring-sky-400/50'
                : 'bg-surface-4/80 text-text-muted ring-border hover:text-text-secondary'
            }`}
            onClick={() => onSelectProperty(property)}
          >
            {TRANSFORM_TIMELINE_PROPERTY_LABELS[property]}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="w-full" data-testid="transform-kf-graph-editor">
        <svg
          className="w-full overflow-visible"
          viewBox={`0 0 ${width} ${GRAPH_LANE_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`トランスフォームキーフレーム ${TRANSFORM_TIMELINE_PROPERTY_LABELS[selectedProperty]} カーブ`}
        >
          <line
            x1={0}
            y1={GRAPH_LANE_HEIGHT}
            x2={width}
            y2={GRAPH_LANE_HEIGHT}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke={TRANSFORM_TIMELINE_PROPERTY_COLORS[selectedProperty]}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {keyframes.map((kf, index) => {
            const { x, y } = keyframeToLanePoint(kf, transform, clipDuration, width, GRAPH_LANE_HEIGHT, selectedProperty)
            const selected = kf.id === selectedKeyframeId
            return (
              <g key={kf.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={selected ? 5 : 4}
                  fill={selected ? TRANSFORM_TIMELINE_PROPERTY_COLORS[selectedProperty] : 'rgba(56,189,248,0.85)'}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="pointer-events-auto cursor-pointer"
                  role="button"
                  aria-label={`グラフ上のキーフレーム ${index + 1}`}
                  onClick={() => onSelectKeyframe(kf.id)}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
