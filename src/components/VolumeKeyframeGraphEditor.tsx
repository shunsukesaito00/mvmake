import { useEffect, useRef, useState } from 'react'
import type { AudioSettings, VolumeKeyframe } from '../types/project'
import { VOLUME_SNAP_LEVELS } from '../utils/keyframeSnap'
import {
  VOLUME_TIMELINE_MAX,
  buildVolumeCurvePath,
  keyframeToLanePoint,
  volumeToLaneY,
} from '../utils/volumeKeyframesTimeline'

const GRAPH_LANE_HEIGHT = 88
const VOLUME_CURVE_COLOR = 'rgba(52,211,153,0.9)'

interface Props {
  audio: AudioSettings
  keyframes: VolumeKeyframe[]
  clipDuration: number
  selectedKeyframeId: string | null
  onSelectKeyframe: (id: string) => void
}

export function VolumeKeyframeGraphEditor({
  audio,
  keyframes,
  clipDuration,
  selectedKeyframeId,
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

  const curvePath = buildVolumeCurvePath(audio, clipDuration, width, GRAPH_LANE_HEIGHT)

  return (
    <div className="space-y-1.5 rounded-lg bg-surface-3 p-2 ring-1 ring-border">
      <p className="text-[10px] font-medium text-text-secondary">グラフエディタ</p>
      <div ref={containerRef} className="w-full" data-testid="volume-kf-graph-editor">
        <svg
          className="w-full overflow-visible"
          viewBox={`0 0 ${width} ${GRAPH_LANE_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="音量キーフレームカーブ"
        >
          {VOLUME_SNAP_LEVELS.filter((level) => level > 0 && level < VOLUME_TIMELINE_MAX).map((level) => {
            const y = volumeToLaneY(level, GRAPH_LANE_HEIGHT)
            return (
              <line
                key={level}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
          <line
            x1={0}
            y1={GRAPH_LANE_HEIGHT}
            x2={width}
            y2={GRAPH_LANE_HEIGHT}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          {keyframes.length >= 2 && curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke={VOLUME_CURVE_COLOR}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {keyframes.length === 1 && (
            <line
              x1={0}
              y1={keyframeToLanePoint(keyframes[0], clipDuration, width, GRAPH_LANE_HEIGHT).y}
              x2={width}
              y2={keyframeToLanePoint(keyframes[0], clipDuration, width, GRAPH_LANE_HEIGHT).y}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {keyframes.map((kf, index) => {
            const { x, y } = keyframeToLanePoint(kf, clipDuration, width, GRAPH_LANE_HEIGHT)
            const selected = kf.id === selectedKeyframeId
            return (
              <circle
                key={kf.id}
                cx={x}
                cy={y}
                r={selected ? 5 : 4}
                fill={selected ? VOLUME_CURVE_COLOR : 'rgba(52,211,153,0.75)'}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="pointer-events-auto cursor-pointer"
                role="button"
                aria-label={`グラフ上のキーフレーム ${index + 1}`}
                onClick={() => onSelectKeyframe(kf.id)}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
