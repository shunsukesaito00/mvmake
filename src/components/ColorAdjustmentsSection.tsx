import { useRef } from 'react'
import type { LutAsset } from '../types/project'
import { DEFAULT_LUT_INTENSITY } from '../types/project'
import type { ColorAdjustments } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import { COLOR_LOOK_PRESETS, matchColorLookPreset } from '../utils/colorLooks'
import type { ColorLookPreviewFade } from '../utils/colorLookPreview'
import { Slider } from './ui'
import { useToastStore } from '../store/toastStore'
import { useProjectStore } from '../store/projectStore'
import { ColorLookPreview, useColorLookHoverPreview } from './ColorLookPreview'

interface Props {
  color: ColorAdjustments
  onChange: (color: ColorAdjustments, recordHistory?: boolean) => void
  lutId?: string
  lutIntensity?: number
  lutAssets?: LutAsset[]
  onLutChange?: (lutId: string | undefined, lutIntensity?: number, recordHistory?: boolean) => void
  previewImageUrl?: string
  previewFade?: ColorLookPreviewFade
}

export function ColorAdjustmentsSection({
  color,
  onChange,
  lutId,
  lutIntensity = DEFAULT_LUT_INTENSITY,
  lutAssets = [],
  onLutChange,
  previewImageUrl,
  previewFade,
}: Props) {
  const showToast = useToastStore((s) => s.showToast)
  const importLutFile = useProjectStore((s) => s.importLutFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activePresetId = matchColorLookPreset(color)
  const { setHoverPresetId, previewColor, previewLabel } = useColorLookHoverPreview(color)

  const applyPreset = (presetId: string) => {
    const preset = COLOR_LOOK_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    onChange({ ...preset.color }, true)
    if (preset.id !== 'none') showToast(`「${preset.label}」ルックを適用しました`, 'success')
  }

  const updateField = (field: keyof ColorAdjustments, value: number) => {
    onChange({ ...(color ?? DEFAULT_COLOR), [field]: value })
  }

  const handleImportLut = async (file: File | undefined) => {
    if (!file) return
    const ok = await importLutFile(file)
    if (!ok) {
      showToast('LUT ファイルの読み込みに失敗しました', 'error')
      return
    }
    showToast(`「${file.name.replace(/\.cube$/i, '')}」をインポートしました`, 'success')
  }

  return (
    <div className="space-y-3">
      <ColorLookPreview
        previewImageUrl={previewImageUrl}
        previewColor={previewColor}
        previewLabel={previewLabel}
        previewFade={previewFade}
        activePresetId={activePresetId}
        onHoverPreset={setHoverPresetId}
      />
      <div>
        <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-accent uppercase">ルックプリセット</p>
        <p className="mb-2 text-[10px] leading-relaxed text-text-muted">
          適用順: LUT → 色温度/ティント → 色相/明るさ/コントラスト/彩度。プリセットと LUT は併用できます。
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_LOOK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePresetId === preset.id}
              aria-label={`${preset.label}ルック`}
              title={preset.description}
              onClick={() => applyPreset(preset.id)}
              onMouseEnter={() => setHoverPresetId(preset.id)}
              onMouseLeave={() => setHoverPresetId(null)}
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
      {onLutChange && (
        <div className="space-y-2 rounded-lg bg-surface-3/60 p-2.5 ring-1 ring-border">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-wider text-accent uppercase">3D LUT</p>
            <button
              type="button"
              className="rounded-md bg-surface-4 px-2 py-1 text-[10px] text-text-secondary ring-1 ring-border hover:text-accent"
              onClick={() => fileInputRef.current?.click()}
            >
              .cube をインポート
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cube,text/plain"
              className="hidden"
              onChange={(e) => {
                void handleImportLut(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          <label className="block text-[10px] text-text-muted">
            LUT
            <select
              aria-label="LUT"
              className="mt-1 w-full rounded-md bg-surface-4 px-2 py-1.5 text-xs text-text-primary ring-1 ring-border"
              value={lutId ?? ''}
              onChange={(e) => {
                const next = e.target.value || undefined
                onLutChange(next, lutIntensity, true)
                if (next) {
                  const asset = lutAssets.find((a) => a.id === next)
                  if (asset) showToast(`「${asset.name}」LUT を適用しました`, 'success')
                }
              }}
            >
              <option value="">なし</option>
              {lutAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.size}³)
                </option>
              ))}
            </select>
          </label>
          {lutId && (
            <Slider
              label="LUT 強度"
              value={lutIntensity}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onLutChange(lutId, v)}
            />
          )}
        </div>
      )}
      <div className="space-y-2 rounded-lg bg-surface-3/40 p-2.5 ring-1 ring-border">
        <p className="text-[10px] font-semibold tracking-wider text-accent uppercase">HSL 補正</p>
        <Slider label="色相" value={color?.hue ?? DEFAULT_COLOR.hue} min={-1} max={1} step={0.01} format={(v) => `${Math.round(v * 180)}°`} onChange={(v) => updateField('hue', v)} />
        <Slider label="色温度" value={color?.temperature ?? DEFAULT_COLOR.temperature} min={-1} max={1} step={0.05} format={(v) => (v < 0 ? '寒色' : v > 0 ? '暖色' : '標準')} onChange={(v) => updateField('temperature', v)} />
        <Slider label="ティント" value={color?.tint ?? DEFAULT_COLOR.tint} min={-1} max={1} step={0.05} format={(v) => (v < 0 ? '緑' : v > 0 ? 'マゼンタ' : '標準')} onChange={(v) => updateField('tint', v)} />
      </div>
      <Slider label="明るさ" value={color?.brightness ?? DEFAULT_COLOR.brightness} min={-1} max={1} step={0.05} onChange={(v) => updateField('brightness', v)} />
      <Slider label="コントラスト" value={color?.contrast ?? DEFAULT_COLOR.contrast} min={-1} max={1} step={0.05} onChange={(v) => updateField('contrast', v)} />
      <Slider label="彩度" value={color?.saturation ?? DEFAULT_COLOR.saturation} min={-1} max={1} step={0.05} onChange={(v) => updateField('saturation', v)} />
    </div>
  )
}
