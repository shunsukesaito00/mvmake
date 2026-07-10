import { useCallback, useRef, useState } from 'react'
import type { RgbCurveChannel, RgbCurvePoints, RgbCurves } from '../types/project'
import { RGB_CURVE_INPUTS } from '../types/project'
import { updateRgbCurvePoint } from '../utils/colorRgbCurve'

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

function pointsToSvg(points: RgbCurvePoints): string {
  return points
    .map((y, index) => {
      const x = RGB_CURVE_INPUTS[index] * 100
      const sy = (1 - y) * 100
      return `${index === 0 ? 'M' : 'L'} ${x} ${sy}`
    })
    .join(' ')
}

export function RgbCurveGraph({ curves, onChange }: Props) {
  const [channel, setChannel] = useState<RgbCurveChannel>('r')
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ index: number } | null>(null)
  const points = curves[channel]

  const updatePoint = useCallback((index: number, output: number, recordHistory = false) => {
    onChange(updateRgbCurvePoint(curves, channel, index, output), recordHistory)
  }, [channel, curves, onChange])

  const pointerToOutput = useCallback((clientY: number): number => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const ratio = (clientY - rect.top) / rect.height
    return Math.max(0, Math.min(1, 1 - ratio))
  }, [])

  const handlePointerDown = (index: number) => (event: React.PointerEvent) => {
    if (index === 0 || index === 4) return
    dragRef.current = { index }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) return
    updatePoint(dragRef.current.index, pointerToOutput(event.clientY))
  }

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!dragRef.current) return
    updatePoint(dragRef.current.index, pointerToOutput(event.clientY), true)
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

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
            onClick={() => setChannel(key)}
          >
            {CHANNEL_LABELS[key]}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded-md px-2 py-1 text-[10px] text-text-muted ring-1 ring-border hover:text-accent"
          onClick={() => onChange({ ...curves, [channel]: [...RGB_CURVE_INPUTS] }, true)}
        >
          リセット
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-28 w-full rounded-md bg-black/80 ring-1 ring-border"
        aria-label={`RGB カーブ (${CHANNEL_LABELS[channel]})`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <path d={pointsToSvg(RGB_CURVE_INPUTS)} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
        <path d={pointsToSvg(points)} stroke={CHANNEL_COLORS[channel]} strokeWidth="1.6" fill="none" />
        {points.map((y, index) => {
          const x = RGB_CURVE_INPUTS[index] * 100
          const sy = (1 - y) * 100
          const draggable = index > 0 && index < 4
          return (
            <circle
              key={`${channel}-${index}`}
              data-testid={`rgb-curve-point-${channel}-${index}`}
              cx={x}
              cy={sy}
              r={draggable ? 2.8 : 1.8}
              fill={draggable ? CHANNEL_COLORS[channel] : 'rgba(255,255,255,0.65)'}
              className={draggable ? 'cursor-ns-resize' : undefined}
              onPointerDown={draggable ? handlePointerDown(index) : undefined}
            />
          )
        })}
      </svg>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((index) => (
          <label key={index} className="text-[10px] text-text-muted">
            {CHANNEL_LABELS[channel]} {Math.round(RGB_CURVE_INPUTS[index] * 100)}%
            <input
              type="range"
              aria-label={`${CHANNEL_LABELS[channel]} カーブ ${Math.round(RGB_CURVE_INPUTS[index] * 100)}%`}
              min={0}
              max={1}
              step={0.01}
              value={points[index]}
              onChange={(e) => updatePoint(index, Number(e.target.value))}
              onPointerUp={(e) => updatePoint(index, Number((e.target as HTMLInputElement).value), true)}
              className="mt-1 w-full"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
