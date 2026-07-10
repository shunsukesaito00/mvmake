import { useState } from 'react'
import type { ColorAdjustments } from '../types/project'
import { COLOR_LOOK_PRESETS } from '../utils/colorLooks'
import type { ColorLookPreviewFade } from '../utils/colorLookPreview'
import { buildColorLookPreviewStyle } from '../utils/colorLookPreview'

const FALLBACK_PREVIEW_STYLE = {
  backgroundImage:
    'linear-gradient(135deg, #f5e6d3 0%, #d4a574 35%, #8b6f5c 70%, #3d2c29 100%)',
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
  const mainStyle = buildColorLookPreviewStyle(previewColor, previewFade)

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-border"
        aria-label="カラールックプレビュー"
      >
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: mainStyle.filter, opacity: mainStyle.opacity }}
          />
        ) : (
          <div className="h-full w-full" style={{ ...FALLBACK_PREVIEW_STYLE, filter: mainStyle.filter, opacity: mainStyle.opacity }} />
        )}
        {previewLabel && (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white/90">
            {previewLabel}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_LOOK_PRESETS.map((preset) => {
          const swatchStyle = buildColorLookPreviewStyle(preset.color, previewFade)
          return (
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
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ filter: swatchStyle.filter, opacity: swatchStyle.opacity }}
                />
              ) : (
                <div className="h-full w-full" style={{ ...FALLBACK_PREVIEW_STYLE, filter: swatchStyle.filter, opacity: swatchStyle.opacity }} />
              )}
            </button>
          )
        })}
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
