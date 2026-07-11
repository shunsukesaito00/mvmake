import { useMemo, useRef, useState } from 'react'
import type { LutAsset } from '../types/project'
import { DEFAULT_LUT_INTENSITY } from '../types/project'
import type { ColorAdjustments } from '../types/project'
import { DEFAULT_COLOR } from '../types/project'
import type { UserColorLookPreset } from '../types/colorLookPreset'
import { COLOR_LOOK_PRESETS, matchColorLookPreset } from '../utils/colorLooks'
import type { ColorLookPreviewFade } from '../utils/colorLookPreview'
import { Slider } from './ui'
import { useToastStore } from '../store/toastStore'
import { useProjectStore } from '../store/projectStore'
import { ColorLookPreview, useColorLookHoverPreview } from './ColorLookPreview'
import { ColorLookPresetsSection } from './ColorLookPresetsSection'
import { LutPreview, useLutHoverPreview } from './LutPreview'
import { RgbCurveGraph } from './RgbCurveGraph'
import { PresetCatalogControls, PresetFavoriteToggle } from './PresetCatalogControls'
import { loadPresetFavorites, togglePresetFavorite } from '../persistence/presetFavorites'
import {
  buildCatalogFilterOptions,
  COLOR_LOOK_CATALOG_CATEGORIES,
  filterCatalogItems,
  type CatalogFilterValue,
} from '../utils/presetCatalog'

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
  const lutIntensityDragRef = useRef<number | null>(null)
  const [userPresets, setUserPresets] = useState<UserColorLookPreset[]>([])
  const [lookCatalogFilter, setLookCatalogFilter] = useState<CatalogFilterValue>('all')
  const [lookFavorites, setLookFavorites] = useState(() => loadPresetFavorites().colorLook)
  const lookFilterOptions = useMemo(() => buildCatalogFilterOptions(COLOR_LOOK_CATALOG_CATEGORIES), [])
  const filteredLookPresets = useMemo(
    () => filterCatalogItems(COLOR_LOOK_PRESETS, lookCatalogFilter, (p) => p.id, (p) => p.category, lookFavorites),
    [lookCatalogFilter, lookFavorites],
  )
  const activePresetId = lutId ? null : matchColorLookPreset(color, userPresets)
  const { setHoverPresetId, previewColor, previewLabel } = useColorLookHoverPreview(color)
  const { setHoverLutId, previewLutId, previewLabel: lutPreviewLabel } = useLutHoverPreview(lutId, lutAssets)

  const applyPreset = (presetId: string) => {
    const preset = COLOR_LOOK_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    onChange({ ...preset.color }, true)
    if (preset.id !== 'none') showToast(`「${preset.label}」ルックを適用しました`, 'success')
  }

  const applyUserPreset = (preset: UserColorLookPreset) => {
    onChange({ ...preset.color }, true)
    showToast(`「${preset.name}」ルックを適用しました`, 'success')
  }

  const updateField = (field: keyof ColorAdjustments, value: number) => {
    onChange({ ...(color ?? DEFAULT_COLOR), [field]: value })
  }

  const updateRgbCurves = (rgbCurves: ColorAdjustments['rgbCurves'], recordHistory?: boolean) => {
    onChange({ ...(color ?? DEFAULT_COLOR), rgbCurves }, recordHistory)
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
          適用順: LUT → トーンカーブ → RGB カーブ → 色温度/ティント → 色相/明るさ/コントラスト/彩度。プリセットと LUT は併用できます。
        </p>
        <PresetCatalogControls
          options={lookFilterOptions}
          value={lookCatalogFilter}
          onChange={setLookCatalogFilter}
          ariaLabel="ルックプリセット絞り込み"
        />
        {filteredLookPresets.length === 0 ? (
          <p className="text-[10px] text-text-muted">該当するルックがありません。よく使うに登録するか、絞り込みを変更してください。</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filteredLookPresets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-1">
                <button
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
                <PresetFavoriteToggle
                  active={lookFavorites.includes(preset.id)}
                  label={preset.label}
                  onToggle={() => setLookFavorites(togglePresetFavorite('colorLook', preset.id).colorLook)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <ColorLookPresetsSection
        color={color}
        activePresetId={activePresetId}
        onApply={applyUserPreset}
        onPresetsChange={setUserPresets}
      />
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
          <p className="text-[10px] leading-relaxed text-text-muted">
            クリップ/サムネイルに LUT を Canvas プレビュー。強度スライダーと色調補正も反映されます。
          </p>
          <LutPreview
            previewImageUrl={previewImageUrl}
            lutId={previewLutId}
            lutIntensity={lutIntensity}
            lutAssets={lutAssets}
            color={previewColor}
            previewFade={previewFade}
            previewLabel={lutPreviewLabel}
            onHoverLut={setHoverLutId}
          />
          <label className="block text-[10px] text-text-muted">
            LUT
            <select
              aria-label="LUT"
              className="mt-1 w-full rounded-md bg-surface-4 px-2 py-1.5 text-xs text-text-primary ring-1 ring-border"
              value={lutId ?? ''}
              onChange={(e) => {
                const next = e.target.value || undefined
                onLutChange(next, lutIntensity, true)
                setHoverLutId(null)
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
            <div className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-[11px] text-text-secondary">LUT 強度</span>
                <span className="text-[11px] tabular-nums text-text-muted">{Math.round(lutIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                aria-label="LUT 強度"
                min={0}
                max={1}
                step={0.05}
                value={lutIntensity}
                onPointerDown={() => { lutIntensityDragRef.current = lutIntensity }}
                onChange={(e) => onLutChange(lutId, parseFloat(e.target.value))}
                onPointerUp={(e) => {
                  const next = parseFloat((e.target as HTMLInputElement).value)
                  const from = lutIntensityDragRef.current
                  lutIntensityDragRef.current = null
                  if (from !== null && from !== next) {
                    onLutChange(lutId, from, false)
                    onLutChange(lutId, next, true)
                  }
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
      <div className="space-y-2 rounded-lg bg-surface-3/40 p-2.5 ring-1 ring-border">
        <p className="text-[10px] font-semibold tracking-wider text-accent uppercase">トーンカーブ</p>
        <Slider label="シャドウ" value={color?.shadows ?? DEFAULT_COLOR.shadows} min={-1} max={1} step={0.05} onChange={(v) => updateField('shadows', v)} />
        <Slider label="ミッドトーン" value={color?.midtones ?? DEFAULT_COLOR.midtones} min={-1} max={1} step={0.05} onChange={(v) => updateField('midtones', v)} />
        <Slider label="ハイライト" value={color?.highlights ?? DEFAULT_COLOR.highlights} min={-1} max={1} step={0.05} onChange={(v) => updateField('highlights', v)} />
      </div>
      <div className="space-y-2 rounded-lg bg-surface-3/40 p-2.5 ring-1 ring-border">
        <p className="text-[10px] font-semibold tracking-wider text-accent uppercase">RGB カーブ</p>
        <RgbCurveGraph
          curves={color?.rgbCurves ?? DEFAULT_COLOR.rgbCurves}
          onChange={updateRgbCurves}
        />
      </div>
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
