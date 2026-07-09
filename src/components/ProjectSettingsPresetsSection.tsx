import { useEffect, useState } from 'react'
import type { ProjectSettingsPreset, ProjectSettingsSnapshot } from '../types/projectSettingsPreset'
import {
  deleteProjectSettingsPreset,
  loadProjectSettingsPresets,
  saveProjectSettingsPreset,
} from '../persistence/projectSettingsPresets'
import {
  buildProjectSettingsPreset,
  formatProjectSettingsPresetSummary,
} from '../utils/projectSettingsPresetUtils'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'

interface ProjectSettingsPresetsSectionProps {
  settings: ProjectSettingsSnapshot
  onApply: (preset: ProjectSettingsPreset) => void
}

export function ProjectSettingsPresetsSection({ settings, onApply }: ProjectSettingsPresetsSectionProps) {
  const [presets, setPresets] = useState<ProjectSettingsPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    setPresets(loadProjectSettingsPresets())
  }, [])

  const handleSave = () => {
    try {
      const preset = buildProjectSettingsPreset(presetName, settings)
      setPresets(saveProjectSettingsPreset(preset))
      setPresetName('')
      showToast(`「${preset.name}」設定を保存しました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存に失敗しました', 'error')
    }
  }

  const handleApply = (preset: ProjectSettingsPreset) => {
    onApply(preset)
    showToast(`「${preset.name}」設定を適用しました`, 'info')
  }

  const handleDelete = (id: string, name: string) => {
    setPresets(deleteProjectSettingsPreset(id))
    showToast(`「${name}」設定を削除しました`, 'info')
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">設定プリセット</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="設定プリセット名"
          aria-label="設定プリセット名"
          className="min-w-0 flex-1 rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
        />
        <Btn variant="default" className="shrink-0 text-xs" onClick={handleSave}>
          設定プリセット保存
        </Btn>
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        解像度・FPS・リップル削除・ループ再生をまとめて保存し、ワンクリックで切り替えできます。
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
                  {formatProjectSettingsPresetSummary(preset)}
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
        <p className="text-[10px] text-text-muted">保存済み設定プリセットはありません</p>
      )}
    </div>
  )
}
