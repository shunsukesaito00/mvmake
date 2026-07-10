import { useCallback, useRef, useState } from 'react'
import type { RgbCurveChannel, RgbCurves } from '../types/project'
import { DEFAULT_RGB_CURVE_CHANNEL } from '../types/project'
import {
  addRgbCurvePoint,
  buildRgbCurveSvgPath,
  moveRgbCurvePoint,
  removeRgbCurvePoint,
  updateRgbCurvePoint,
} from '../utils/colorRgbCurve'

const CHANNEL_LABELS: Record<RgbCurveChannel, string> = {
  r: 'R',
  g: 'G',
  b: 'B',
}

const CHANNEL_COLORS: Record<RgbCurveChannel, string> = {
  r: '#f87171',
  g: '#4ade80',
  b: '#60a5fa',
}

interface Props {
  curves: RgbCurves
  onChange: (curves: RgbCurves, recordHistory?: boolean) => void
}

function identityPath(): string {
  return 'M 0 100 L 100 0'
}

export function RgbCurveGraph({ curves, onChange }: Props) {
  const [channel, setChannel] = useState<RgbCurveChannel>('r')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ index: number } | null>(null)
  const points = curves[channel]

  const updatePoint = useCallback((index: number, x: number, y: number, recordHistory = false) => {
    onChange(moveRgbCurvePoint(curves, channel, index, x, y), recordHistory)
  }, [channel, curves, onChange])

  const pointerToValues = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height))
    return { x, y }
  }, [])

  const handlePointerDown = (index: number) => (event: React.PointerEvent) => {
    setSelectedIndex(index)
    dragRef.current = { index }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return
    const { x, y } = pointerToValues(event.clientX, event.clientY)
    const index = dragRef.current.index
    const isEndpoint = index === 0 || index === points.length - 1
    updatePoint(index, isEndpoint ? points[index].x : x, y)
  }

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!dragRef.current) return
    const { x, y } = pointerToValues(event.clientX, event.clientY)
    const index = dragRef.current.index
    const isEndpoint = index === 0 || index === points.length - 1
    updatePoint(index, isEndpoint ? points[index].x : x, y, true)
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleDoubleClick = (event: React.MouseEvent) => {
    const { x, y } = pointerToValues(event.clientX, event.clientY)
    if (x <= 0.01 || x >= 0.99) return
    const beforeLength = points.length
    const next = addRgbCurvePoint(curves, channel, x, y)
    if (next[channel].length === beforeLength) return
    onChange(next, true)
    const addedIndex = next[channel].findIndex((point) => Math.abs(point.x - x) < 0.001)
    if (addedIndex >= 0) setSelectedIndex(addedIndex)
  }

  const interiorPoints = points
    .map((point, index) => ({ point, index }))
    .filter(({ index }) => index > 0 && index < points.length - 1)

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['r', 'g', 'b'] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={channel === key}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold ring-1 transition-all ${
              channel === key ? 'bg-accent-muted text-accent ring-accent/40' : 'bg-surface-4 text-text-secondary ring-border'
            }`}
            onClick={() => {
              setChannel(key)
              setSelectedIndex(null)
            }}
          >
            {CHANNEL_LABELS[key]}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded-md px-2 py-1 text-[10px] text-text-muted ring-1 ring-border hover:text-accent"
          onClick={() => onChange({ ...curves, [channel]: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })) }, true)}
        >
          リセット
        </button>
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        制御点をドラッグして編集。ダブルクリックで追加、選択中の中間点は削除できます。
      </p>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-32 w-full rounded-md bg-black/80 ring-1 ring-border"
        aria-label={`RGB カーブ (${CHANNEL_LABELS[channel]})`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <path d={identityPath()} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
        <path d={buildRgbCurveSvgPath(points)} stroke={CHANNEL_COLORS[channel]} strokeWidth="1.6" fill="none" />
        {points.map((point, index) => {
          const sx = point.x * 100
          const sy = (1 - point.y) * 100
          const isEndpoint = index === 0 || index === points.length - 1
          const isSelected = selectedIndex === index
          return (
            <circle
              key={`${channel}-${index}-${point.x}`}
              data-testid={`rgb-curve-point-${channel}-${index}`}
              cx={sx}
              cy={sy}
              r={isSelected ? 3.2 : isEndpoint ? 1.8 : 2.8}
              fill={isEndpoint ? 'rgba(255,255,255,0.65)' : CHANNEL_COLORS[channel]}
              stroke={isSelected ? '#fff' : 'none'}
              strokeWidth={isSelected ? 0.6 : 0}
              className={isEndpoint ? 'cursor-ns-resize' : 'cursor-grab active:cursor-grabbing'}
              onPointerDown={handlePointerDown(index)}
            />
          )
        })}
      </svg>
      {selectedIndex !== null && selectedIndex > 0 && selectedIndex < points.length - 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md px-2 py-1 text-[10px] text-danger ring-1 ring-border hover:bg-surface-4"
            onClick={() => {
              onChange(removeRgbCurvePoint(curves, channel, selectedIndex), true)
              setSelectedIndex(null)
            }}
          >
            制御点を削除
          </button>
          <span className="text-[10px] text-text-muted">
            {Math.round(points[selectedIndex].x * 100)}% / {Math.round(points[selectedIndex].y * 100)}%
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {interiorPoints.map(({ point, index }) => (
          <label key={index} className="text-[10px] text-text-muted">
            {CHANNEL_LABELS[channel]} {Math.round(point.x * 100)}%
            <input
              type="range"
              aria-label={`${CHANNEL_LABELS[channel]} カーブ ${Math.round(point.x * 100)}%`}
              min={0}
              max={1}
              step={0.01}
              value={point.y}
              onChange={(e) => onChange(updateRgbCurvePoint(curves, channel, index, Number(e.target.value)))}
              onPointerUp={(e) => onChange(updateRgbCurvePoint(curves, channel, index, Number((e.target as HTMLInputElement).value)), true)}
              className="mt-1 w-full"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
