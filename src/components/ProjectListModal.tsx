import { useEffect, useState, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import {
  listProjects,
  loadProjectById,
  deleteProject,
  duplicateProjectInDB,
  saveProject,
  type ProjectSummary,
} from '../persistence/db'
import { normalizeProject } from '../types/project'
import { createId } from '../utils/id'
import { Modal, Btn, IconButton, EmptyState } from './ui'
import { Icons } from './icons'

interface ProjectListModalProps {
  open: boolean
  onClose: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function ProjectListModal({ open, onClose }: ProjectListModalProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [busy, setBusy] = useState(false)

  const currentProjectId = useProjectStore((s) => s.project.id)
  const loadProject = useProjectStore((s) => s.loadProject)
  const resetProject = useProjectStore((s) => s.resetProject)
  const showToast = useToastStore((s) => s.showToast)

  const refresh = useCallback(() => {
    listProjects().then(setProjects).catch(() => showToast('プロジェクト一覧の取得に失敗しました', 'error'))
  }, [showToast])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const saveCurrent = async () => {
    await saveProject(useProjectStore.getState().project)
  }

  const handleNew = async () => {
    setBusy(true)
    try {
      await saveCurrent()
      resetProject()
      showToast('新規プロジェクトを作成しました', 'success')
      onClose()
    } catch {
      showToast('現在のプロジェクトの保存に失敗しました', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleOpen = async (id: string) => {
    if (id === currentProjectId) {
      onClose()
      return
    }
    setBusy(true)
    try {
      await saveCurrent()
      const project = await loadProjectById(id)
      if (!project) {
        showToast('プロジェクトが見つかりません', 'error')
        refresh()
        return
      }
      loadProject(normalizeProject(project))
      showToast(`「${project.name}」を開きました`, 'success')
      onClose()
    } catch {
      showToast('プロジェクトの読み込みに失敗しました', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDuplicate = async (summary: ProjectSummary) => {
    setBusy(true)
    try {
      // 現在開いているプロジェクトは未保存の変更を反映してから複製する
      if (summary.id === currentProjectId) await saveCurrent()
      const ok = await duplicateProjectInDB(summary.id, createId(), `${summary.name} のコピー`)
      if (ok) {
        showToast('プロジェクトを複製しました', 'success')
        refresh()
      } else {
        showToast('複製に失敗しました', 'error')
      }
    } catch {
      showToast('複製に失敗しました', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (summary: ProjectSummary) => {
    if (!confirm(`「${summary.name}」を削除しますか？この操作は取り消せません。`)) return
    setBusy(true)
    try {
      await deleteProject(summary.id)
      if (summary.id === currentProjectId) {
        resetProject()
        showToast('プロジェクトを削除し、新規プロジェクトを作成しました', 'info')
      } else {
        showToast('プロジェクトを削除しました', 'info')
      }
      refresh()
    } catch {
      showToast('削除に失敗しました', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="プロジェクト" width="w-[480px]">
      <div className="mb-4 flex justify-end">
        <Btn variant="accent" className="text-xs" onClick={handleNew} disabled={busy}>
          + 新規プロジェクト
        </Btn>
      </div>

      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
        {projects.length === 0 ? (
          <EmptyState icon={<Icons.Film size={20} />} title="保存済みプロジェクトなし" description="編集を始めると自動保存されます" />
        ) : (
          projects.map((p) => {
            const isCurrent = p.id === currentProjectId
            return (
              <div
                key={p.id}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition-all ${
                  isCurrent ? 'bg-accent-muted ring-accent/40' : 'bg-surface-3 ring-border hover:ring-accent/30'
                }`}
              >
                <button className="min-w-0 flex-1 text-left" onClick={() => handleOpen(p.id)} disabled={busy}>
                  <p className="truncate text-sm font-medium text-text-primary">
                    {p.name}
                    {isCurrent && <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent">編集中</span>}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                    {p.width}×{p.height} · {p.fps}fps · クリップ{p.clipCount}件 · {formatDate(p.updatedAt)}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton size="sm" tooltip="複製" onClick={() => handleDuplicate(p)} disabled={busy}>
                    <Icons.Copy size={13} />
                  </IconButton>
                  <IconButton size="sm" variant="danger" tooltip="削除" onClick={() => handleDelete(p)} disabled={busy}>
                    <Icons.Trash size={13} />
                  </IconButton>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Btn variant="ghost" className="mt-4 w-full" onClick={onClose}>
        閉じる
      </Btn>
    </Modal>
  )
}
