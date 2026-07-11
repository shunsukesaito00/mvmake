import { useEffect, useState } from 'react'
import type { TextStyle } from '../types/project'
import type { SavedTextStylePreset } from '../types/textStylePreset'
import {
  deleteTextStylePreset,
  loadTextStylePresets,
  saveTextStylePreset,
} from '../persistence/textStylePresets'
import {
  applyTextStylePreset,
  buildSavedTextStylePreset,
  formatTextStylePresetSummary,
} from '../utils/textStylePresetUtils'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'

interface TextStylePresetsSectionProps {
  text: TextStyle
  onApply: (text: TextStyle) => void
}

export function TextStylePresetsSection({ text, onApply }: TextStylePresetsSectionProps) {
  const [presets, setPresets] = useState<SavedTextStylePreset[]>([])
  const [presetName, setPresetName] = useState('')
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    setPresets(loadTextStylePresets())
  }, [])

  const handleSave = () => {
    try {
      const preset = buildSavedTextStylePreset(presetName, text)
      const { presets: next, replaced } = saveTextStylePreset(preset)
      setPresets(next)
      setPresetName('')
      showToast(
        replaced
          ? `「${preset.name}」スタイルを上書き保存しました`
          : `「${preset.name}」スタイルを保存しました`,
        'success',
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存に失敗しました', 'error')
    }
  }

  const handleApply = (preset: SavedTextStylePreset) => {
    onApply(applyTextStylePreset(text, preset.style))
    showToast(`「${preset.name}」スタイルを適用しました`, 'info')
  }

  const handleDelete = (id: string, name: string) => {
    setPresets(deleteTextStylePreset(id))
    showToast(`「${name}」スタイルを削除しました`, 'info')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="スタイル名"
          aria-label="スタイル名"
          className="min-w-0 flex-1 rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
        />
        <Btn variant="default" className="shrink-0 text-xs" onClick={handleSave}>
          スタイル保存
        </Btn>
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        フォント・色・行間・字幕帯など現在の書式を保存し、他のテキストクリップへ適用できます。
      </p>
      {presets.length > 0 ? (
        <ul className="max-h-36 space-y-1.5 overflow-y-auto">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex items-center gap-2 rounded-lg bg-surface-3 px-2 py-2 ring-1 ring-border"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{preset.name}</p>
                <p className="truncate text-[10px] text-text-muted">
                  {formatTextStylePresetSummary(preset)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`${preset.name}を適用`}
                onClick={() => handleApply(preset)}
                className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent-muted"
              >
                適用
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
      ) : (
        <p className="text-[10px] text-text-muted">保存済みスタイルはありません</p>
      )}
    </div>
  )
}
