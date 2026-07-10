import { useEffect, useRef, useState } from 'react'
import type { ProjectSettingsPreset, ProjectSettingsSnapshot } from '../types/projectSettingsPreset'
import {
  deleteProjectSettingsPreset,
  importProjectSettingsPresets,
  loadProjectSettingsPresets,
  saveProjectSettingsPreset,
} from '../persistence/projectSettingsPresets'
import { downloadBlob } from '../persistence/projectFile'
import {
  buildProjectSettingsPreset,
  formatProjectSettingsPresetSummary,
} from '../utils/projectSettingsPresetUtils'
import {
  buildExportedProjectSettingsPresetFile,
  buildProjectSettingsPresetExportFilename,
  parseProjectSettingsPresetFileText,
  serializeExportedProjectSettingsPresetFile,
} from '../utils/projectSettingsPresetFile'
import { useToastStore } from '../store/toastStore'
import { Icons } from './icons'
import { Btn } from './ui'

interface ProjectSettingsPresetsSectionProps {
  settings: ProjectSettingsSnapshot
  onApply: (preset: ProjectSettingsPreset) => void
}

export function ProjectSettingsPresetsSection({ settings, onApply }: ProjectSettingsPresetsSectionProps) {
  const [presets, setPresets] = useState<ProjectSettingsPreset[]>([])
  const [presetName, setPresetName] = useState('')
  const presetImportRef = useRef<HTMLInputElement>(null)
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

  const handleExportPresetsFile = (targetPresets: ProjectSettingsPreset[] = presets) => {
    if (targetPresets.length === 0) return
    const payload = buildExportedProjectSettingsPresetFile(targetPresets)
    const filename = buildProjectSettingsPresetExportFilename(
      targetPresets.length === 1 ? targetPresets[0].name : 'project-settings-presets',
    )
    downloadBlob(
      new Blob([serializeExportedProjectSettingsPresetFile(payload)], { type: 'application/json' }),
      filename,
    )
    showToast(`${targetPresets.length} 件の設定プリセットをエクスポートしました`, 'success')
  }

  const handleImportPresetsFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const items = await parseProjectSettingsPresetFileText(text)
      const imported = importProjectSettingsPresets(items)
      setPresets(imported)
      const label = items.length === 1 ? `「${items[0].name}」` : `${items.length} 件`
      showToast(`${label}設定プリセットをインポートしました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'インポートに失敗しました', 'error')
    }
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
          accept=".json,.fable-project-preset.json,application/json"
          className="hidden"
          aria-label="プロジェクト設定プリセットファイルをインポート"
          onChange={(e) => {
            void handleImportPresetsFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        解像度・FPS・リップル削除・ループ再生をまとめて保存し、`.fable-project-preset.json` で別端末と共有できます。
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
                aria-label={`${preset.name}をエクスポート`}
                onClick={() => handleExportPresetsFile([preset])}
                className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-text-muted hover:text-accent"
                title="JSON エクスポート"
              >
                <Icons.Export size={12} />
              </button>
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
