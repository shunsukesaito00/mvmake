import { useEffect, useRef, useState } from 'react'
import type { ColorAdjustments, LutAsset } from '../types/project'
import { parseCubeLutFromBlob } from '../utils/cubeLut'
import type { ColorLookPreviewFade } from '../utils/colorLookPreview'
import { renderLutPreviewCanvas } from '../utils/lutPreview'

interface LutPreviewCanvasProps {
  previewImageUrl?: string
  lutAsset: LutAsset
  lutIntensity: number
  color: ColorAdjustments
  previewFade?: ColorLookPreviewFade
  className?: string
  ariaHidden?: boolean
}

function LutPreviewCanvas({
  previewImageUrl,
  lutAsset,
  lutIntensity,
  color,
  previewFade,
  className = 'h-full w-full',
  ariaHidden,
}: LutPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    void (async () => {
      const parsed = await parseCubeLutFromBlob(lutAsset.id, lutAsset.blob)
      if (!parsed || cancelled) return
      await renderLutPreviewCanvas(canvas, {
        imageUrl: previewImageUrl,
        lut: parsed,
        lutIntensity,
        color,
        fade: previewFade,
        maxWidth: 176,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [previewImageUrl, lutAsset, lutIntensity, color, previewFade])

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
  lutId?: string
  lutIntensity: number
  lutAssets: LutAsset[]
  color: ColorAdjustments
  previewFade?: ColorLookPreviewFade
  previewLabel?: string
  onHoverLut: (lutId: string | null) => void
}

export function LutPreview({
  previewImageUrl,
  lutId,
  lutIntensity,
  lutAssets,
  color,
  previewFade,
  previewLabel,
  onHoverLut,
}: Props) {
  const previewLutId = lutId
  const previewAsset = previewLutId ? lutAssets.find((a) => a.id === previewLutId) : undefined

  if (lutAssets.length === 0) return null

  return (
    <div className="space-y-2">
      {previewAsset && (
        <div
          className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-border"
          aria-label="LUTプレビュー"
        >
          <LutPreviewCanvas
            previewImageUrl={previewImageUrl}
            lutAsset={previewAsset}
            lutIntensity={lutIntensity}
            color={color}
            previewFade={previewFade}
          />
          {previewLabel && (
            <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white/90">
              {previewLabel}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {lutAssets.map((asset) => (
          <button
            key={`lut-swatch-${asset.id}`}
            type="button"
            aria-label={`${asset.name} LUT のプレビュー`}
            title={asset.title ?? asset.name}
            onMouseEnter={() => onHoverLut(asset.id)}
            onMouseLeave={() => onHoverLut(null)}
            onFocus={() => onHoverLut(asset.id)}
            onBlur={() => onHoverLut(null)}
            className={`h-8 w-11 overflow-hidden rounded-md ring-1 transition-all ${
              previewLutId === asset.id ? 'ring-accent/60' : 'ring-border hover:ring-accent/30'
            }`}
          >
            <LutPreviewCanvas
              previewImageUrl={previewImageUrl}
              lutAsset={asset}
              lutIntensity={lutIntensity}
              color={color}
              previewFade={previewFade}
              ariaHidden
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function useLutHoverPreview(selectedLutId?: string, lutAssets: LutAsset[] = []) {
  const [hoverLutId, setHoverLutId] = useState<string | null>(null)
  const previewLutId = hoverLutId ?? selectedLutId
  const previewAsset = previewLutId ? lutAssets.find((a) => a.id === previewLutId) : undefined

  return {
    setHoverLutId,
    previewLutId,
    previewLabel: previewAsset?.name,
  }
}
