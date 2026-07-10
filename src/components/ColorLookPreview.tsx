import { useEffect, useRef, useState } from 'react'
import type { ColorAdjustments } from '../types/project'
import { COLOR_LOOK_PRESETS } from '../utils/colorLooks'
import type { ColorLookPreviewFade } from '../utils/colorLookPreview'
import {
  COLOR_LOOK_PREVIEW_MAX_WIDTH,
  COLOR_LOOK_SWATCH_MAX_WIDTH,
  renderColorGradePreviewCanvas,
} from '../utils/colorLookPreview'

interface CanvasProps {
  previewImageUrl?: string
  color: ColorAdjustments
  previewFade?: ColorLookPreviewFade
  maxWidth: number
  className?: string
  ariaHidden?: boolean
}

function ColorLookPreviewCanvas({
  previewImageUrl,
  color,
  previewFade,
  maxWidth,
  className = 'h-full w-full',
  ariaHidden,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    void (async () => {
      await renderColorGradePreviewCanvas(canvas, {
        imageUrl: previewImageUrl,
        color,
        fade: previewFade,
        maxWidth,
      })
      if (cancelled) return
    })()

    return () => {
      cancelled = true
    }
  }, [previewImageUrl, color, previewFade, maxWidth])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden={ariaHidden}
    />
  )
}

interface Props {
  previewImageUrl?: string
  previewColor: ColorAdjustments
  previewLabel?: string
  previewFade?: ColorLookPreviewFade
  activePresetId: string | null
  onHoverPreset: (presetId: string | null) => void
}

export function ColorLookPreview({
  previewImageUrl,
  previewColor,
  previewLabel,
  previewFade,
  activePresetId,
  onHoverPreset,
}: Props) {
  return (
    <div className="space-y-2">
      <div
        className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-border"
        aria-label="カラールックプレビュー"
      >
        <ColorLookPreviewCanvas
          previewImageUrl={previewImageUrl}
          color={previewColor}
          previewFade={previewFade}
          maxWidth={COLOR_LOOK_PREVIEW_MAX_WIDTH}
        />
        {previewLabel && (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white/90">
            {previewLabel}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_LOOK_PRESETS.map((preset) => (
          <button
            key={`swatch-${preset.id}`}
            type="button"
            aria-label={`${preset.label}ルックのプレビュー`}
            title={preset.description}
            onMouseEnter={() => onHoverPreset(preset.id)}
            onMouseLeave={() => onHoverPreset(null)}
            onFocus={() => onHoverPreset(preset.id)}
            onBlur={() => onHoverPreset(null)}
            className={`h-8 w-11 overflow-hidden rounded-md ring-1 transition-all ${
              activePresetId === preset.id ? 'ring-accent/60' : 'ring-border hover:ring-accent/30'
            }`}
          >
            <ColorLookPreviewCanvas
              previewImageUrl={previewImageUrl}
              color={preset.color}
              previewFade={previewFade}
              maxWidth={COLOR_LOOK_SWATCH_MAX_WIDTH}
              ariaHidden
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/** ホバー中プリセットの色を返す */
export function useColorLookHoverPreview(baseColor: ColorAdjustments) {
  const [hoverPresetId, setHoverPresetId] = useState<string | null>(null)
  const hoverPreset = hoverPresetId ? COLOR_LOOK_PRESETS.find((p) => p.id === hoverPresetId) : null
  const previewColor = hoverPreset?.color ?? baseColor

  return {
    setHoverPresetId,
    previewColor,
    previewLabel: hoverPreset?.label,
  }
}
