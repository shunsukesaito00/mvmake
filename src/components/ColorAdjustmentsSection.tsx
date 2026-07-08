import type { ColorAdjustments } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import { COLOR_LOOK_PRESETS, matchColorLookPreset } from '../utils/colorLooks'
import { Slider } from './ui'
import { useToastStore } from '../store/toastStore'

interface Props {
  color: ColorAdjustments
  onChange: (color: ColorAdjustments, recordHistory?: boolean) => void
}

export function ColorAdjustmentsSection({ color, onChange }: Props) {
  const showToast = useToastStore((s) => s.showToast)
  const activePresetId = matchColorLookPreset(color)

  const applyPreset = (presetId: string) => {
    const preset = COLOR_LOOK_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    onChange({ ...preset.color }, true)
    if (preset.id !== 'none') showToast(`「${preset.label}」ルックを適用しました`, 'success')
  }

  const updateField = (field: keyof ColorAdjustments, value: number) => {
    onChange({ ...(color ?? DEFAULT_COLOR), [field]: value })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-accent uppercase">ルックプリセット</p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_LOOK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePresetId === preset.id}
              aria-label={`${preset.label}ルック`}
              title={preset.description}
              onClick={() => applyPreset(preset.id)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium ring-1 transition-all ${
                activePresetId === preset.id
                  ? 'bg-accent-muted text-accent ring-accent/40'
                  : 'bg-surface-3 text-text-secondary ring-border hover:ring-accent/30'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <Slider label="明るさ" value={color?.brightness ?? DEFAULT_COLOR.brightness} min={-1} max={1} step={0.05} onChange={(v) => updateField('brightness', v)} />
      <Slider label="コントラスト" value={color?.contrast ?? DEFAULT_COLOR.contrast} min={-1} max={1} step={0.05} onChange={(v) => updateField('contrast', v)} />
      <Slider label="彩度" value={color?.saturation ?? DEFAULT_COLOR.saturation} min={-1} max={1} step={0.05} onChange={(v) => updateField('saturation', v)} />
    </div>
  )
}
