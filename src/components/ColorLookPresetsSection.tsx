import { useEffect, useRef, useState } from 'react'
import type { ColorAdjustments } from '../types/project'
import type { UserColorLookPreset } from '../types/colorLookPreset'
import {
  deleteColorLookPreset,
  importColorLookPresets,
  loadColorLookPresets,
  saveColorLookPreset,
} from '../persistence/colorLookPresets'
import { downloadBlob } from '../persistence/projectFile'
import {
  buildExportedColorLookPresetFile,
  buildColorLookPresetExportFilename,
  parseColorLookPresetFileText,
  serializeExportedColorLookPresetFile,
} from '../utils/colorLookPresetFile'
import {
  buildUserColorLookPreset,
  formatColorLookPresetSummary,
} from '../utils/colorLookPresetUtils'
import { useToastStore } from '../store/toastStore'
import { Icons } from './icons'
import { Btn } from './ui'

interface Props {
  color: ColorAdjustments
  activePresetId: string | null
  onApply: (preset: UserColorLookPreset) => void
  onPresetsChange?: (presets: UserColorLookPreset[]) => void
}

export function ColorLookPresetsSection({ color, activePresetId, onApply, onPresetsChange }: Props) {
  const [presets, setPresets] = useState<UserColorLookPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const presetImportRef = useRef<HTMLInputElement>(null)
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    const loaded = loadColorLookPresets()
    setPresets(loaded)
    onPresetsChange?.(loaded)
  }, [onPresetsChange])

  const syncPresets = (next: UserColorLookPreset[]) => {
    setPresets(next)
    onPresetsChange?.(next)
  }

  const handleSave = () => {
    try {
      const preset = buildUserColorLookPreset(presetName, color)
      const next = saveColorLookPreset(preset)
      syncPresets(next)
      setPresetName('')
      showToast(`「${preset.name}」ルックを保存しました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存に失敗しました', 'error')
    }
  }

  const handleDelete = (id: string, name: string) => {
    syncPresets(deleteColorLookPreset(id))
    showToast(`「${name}」ルックを削除しました`, 'info')
  }

  const handleExportPresetsFile = (targetPresets: UserColorLookPreset[] = presets) => {
    if (targetPresets.length === 0) return
    const payload = buildExportedColorLookPresetFile(targetPresets)
    const filename = buildColorLookPresetExportFilename(
      targetPresets.length === 1 ? targetPresets[0].name : 'color-look-presets',
    )
    downloadBlob(
      new Blob([serializeExportedColorLookPresetFile(payload)], { type: 'application/json' }),
      filename,
    )
    showToast(`${targetPresets.length} 件のルックプリセットをエクスポートしました`, 'success')
  }

  const handleImportPresetsFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const items = await parseColorLookPresetFileText(text)
      const imported = importColorLookPresets(items)
      syncPresets(imported)
      const label = items.length === 1 ? `「${items[0].name}」` : `${items.length} 件`
      showToast(`${label}ルックプリセットをインポートしました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'インポートに失敗しました', 'error')
    }
  }

  return (
    <div className="space-y-2 rounded-lg bg-surface-3/60 p-2.5 ring-1 ring-border">
      <p className="text-[10px] font-semibold tracking-wider text-accent uppercase">マイルック</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="ルックプリセット名"
          aria-label="ルックプリセット名"
          className="min-w-0 flex-1 rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
        />
        <Btn variant="default" className="shrink-0 text-xs" onClick={handleSave}>
          ルック保存
        </Btn>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn
          variant="default"
          className="text-xs"
          disabled={presets.length === 0}
          onClick={() => handleExportPresetsFile()}
        >
          JSON エクスポート
        </Btn>
        <Btn
          variant="default"
          className="text-xs"
          onClick={() => presetImportRef.current?.click()}
        >
          JSON インポート
        </Btn>
        <input
          ref={presetImportRef}
          type="file"
          accept=".json,.fable-color-look-preset.json,application/json"
          className="hidden"
          aria-label="カラールックプリセットファイルをインポート"
          onChange={(e) => {
            void handleImportPresetsFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        現在の色調補正を保存し、`.fable-color-look-preset.json` で別端末と共有できます。
      </p>
      {presets.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={activePresetId === preset.id}
                aria-label={`${preset.name}ルック`}
                title={preset.description || formatColorLookPresetSummary(preset.color)}
                onClick={() => onApply(preset)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium ring-1 transition-all ${
                  activePresetId === preset.id
                    ? 'bg-accent-muted text-accent ring-accent/40'
                    : 'bg-surface-3 text-text-secondary ring-border hover:ring-accent/30'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <ul className="max-h-28 space-y-1.5 overflow-y-auto">
            {presets.map((preset) => (
              <li
                key={`manage-${preset.id}`}
                className="flex items-center gap-2 rounded-lg bg-surface-3 px-2 py-2 ring-1 ring-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">{preset.name}</p>
                  <p className="truncate text-[10px] text-text-muted">
                    {formatColorLookPresetSummary(preset.color)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`${preset.name}をエクスポート`}
                  onClick={() => handleExportPresetsFile([preset])}
                  className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-text-muted hover:text-accent"
                  title="JSON エクスポート"
                >
                  <Icons.Export size={12} />
                </button>
                <button
                  type="button"
                  aria-label={`${preset.name}を削除`}
                  onClick={() => handleDelete(preset.id, preset.name)}
                  className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-text-muted hover:text-danger"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-[10px] text-text-muted">保存済みルックプリセットはありません</p>
      )}
    </div>
  )
}
