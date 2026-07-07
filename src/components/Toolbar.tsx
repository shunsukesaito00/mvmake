import { useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { saveProject, clearStorage } from '../persistence/db'
import { exportProjectFile, importProjectFile, downloadBlob } from '../persistence/projectFile'
import { useToastStore } from '../store/toastStore'
import { ExportButton } from './ExportButton'
import { ProjectListModal } from './ProjectListModal'
import { IconButton } from './ui'
import { Icons } from './icons'
import { isWebCodecsSupported } from '../engine/exporter'

interface ToolbarProps {
  onOpenHelp: () => void
  onOpenSettings: () => void
}

export function Toolbar({ onOpenHelp, onOpenSettings }: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)

  const project = useProjectStore((s) => s.project)
  const canUndo = useProjectStore((s) => s.canUndo)
  const canRedo = useProjectStore((s) => s.canRedo)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const resetProject = useProjectStore((s) => s.resetProject)
  const loadProject = useProjectStore((s) => s.loadProject)
  const showToast = useToastStore((s) => s.showToast)
  const webCodecsOk = isWebCodecsSupported()

  const commitName = () => {
    if (nameInput.trim()) setProjectName(nameInput.trim())
    setEditingName(false)
  }

  const handleExportFile = async () => {
    setMenuOpen(false)
    try {
      showToast('プロジェクトファイルを作成中...', 'info')
      const blob = await exportProjectFile(useProjectStore.getState().project)
      downloadBlob(blob, `${project.name || 'project'}.fable`)
      showToast('プロジェクトをエクスポートしました', 'success')
    } catch (err) {
      console.error(err)
      showToast('エクスポートに失敗しました', 'error')
    }
  }

  const handleImportFile = async (file: File) => {
    try {
      showToast('プロジェクトを読み込み中...', 'info')
      // 現在の編集内容を保存してから切り替える
      await saveProject(useProjectStore.getState().project)
      const imported = await importProjectFile(file)
      await saveProject(imported)
      loadProject(imported)
      showToast(`「${imported.name}」をインポートしました`, 'success')
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : 'インポートに失敗しました', 'error')
    }
  }

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-3">
      {/* Left: Brand + Project */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-amber-700">
            <span className="text-[10px] font-black text-surface-0">F</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">FABLE</span>
        </div>

        <div className="h-5 w-px bg-border" />

        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
            className="rounded-md bg-surface-3 px-2 py-0.5 text-xs text-text-primary outline-none ring-1 ring-accent"
          />
        ) : (
          <button
            onClick={() => { setNameInput(project.name); setEditingName(true) }}
            className="rounded-md px-2 py-0.5 text-xs text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          >
            {project.name}
          </button>
        )}

        <span className="hidden rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
          {project.width}×{project.height} · {project.fps}fps
        </span>
      </div>

      {/* Center: Edit tools */}
      <div className="flex items-center gap-0.5">
        <IconButton onClick={undo} disabled={!canUndo()} tooltip="元に戻す (⌘Z)" size="sm">
          <Icons.Undo size={14} />
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo()} tooltip="やり直し (⌘⇧Z)" size="sm">
          <Icons.Redo size={14} />
        </IconButton>

        <div className="mx-2 h-5 w-px bg-border" />

        <IconButton onClick={() => setShowProjects(true)} tooltip="プロジェクト一覧" size="sm">
          <Icons.Layout size={14} />
        </IconButton>

        <div className="relative">
          <IconButton onClick={() => setMenuOpen(!menuOpen)} tooltip="ファイル" size="sm">
            <Icons.ChevronDown size={14} />
          </IconButton>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-surface-2 py-1 shadow-xl shadow-black/30 animate-fade-in">
                {[
                  { label: 'プロジェクト一覧', action: () => { setShowProjects(true); setMenuOpen(false) } },
                  { label: '保存', action: async () => { setMenuOpen(false); try { await saveProject(useProjectStore.getState().project); showToast('保存しました', 'success') } catch { showToast('保存に失敗しました', 'error') } } },
                  { label: '名前を変更', action: () => { setNameInput(project.name); setEditingName(true); setMenuOpen(false) } },
                ].map((item) => (
                  <button key={item.label} onClick={item.action} className="block w-full px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary">
                    {item.label}
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
                <button onClick={handleExportFile} className="block w-full px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary">
                  エクスポート (.fable)
                </button>
                <button onClick={() => { setMenuOpen(false); importInputRef.current?.click() }} className="block w-full px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary">
                  インポート (.fable)
                </button>
                <div className="my-1 border-t border-border" />
                <button onClick={async () => { if (confirm('すべての保存データを削除しますか？')) { await clearStorage(); resetProject(); showToast('ストレージをクリアしました', 'info') } setMenuOpen(false) }} className="block w-full px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-red-400/10">
                  ストレージをクリア
                </button>
              </div>
            </>
          )}
        </div>

        <input
          ref={importInputRef}
          type="file"
          accept=".fable,application/zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImportFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {!webCodecsOk && (
          <span className="hidden text-[10px] text-amber-400 lg:inline">書き出し: Chrome/Edge/Safari</span>
        )}
        <IconButton onClick={onOpenSettings} tooltip="プロジェクト設定" size="sm">
          <Icons.Settings size={14} />
        </IconButton>
        <IconButton onClick={onOpenHelp} tooltip="ショートカット" size="sm">
          <Icons.Help size={14} />
        </IconButton>
        <ExportButton />
      </div>

      <ProjectListModal open={showProjects} onClose={() => setShowProjects(false)} />
    </header>
  )
}
