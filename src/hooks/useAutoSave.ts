import { useEffect, useRef } from 'react'
import { useProjectStore } from '../store/projectStore'
import { saveProject, loadLatestProject, cleanupOrphanMedia, clearStorage } from '../persistence/db'
import { normalizeProject } from '../types/project'
import { useToastStore } from '../store/toastStore'

const SAVE_DEBOUNCE_MS = 2000

export function useAutoSave(): void {
  const project = useProjectStore((s) => s.project)
  const restoreReady = useProjectStore((s) => s.restoreReady)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    if (!restoreReady) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveProject(project)
        .then(() => cleanupOrphanMedia(project))
        .catch((err) => {
          console.error(err)
          showToast('自動保存に失敗しました', 'error')
        })
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [project, restoreReady, showToast])
}

export function useProjectRestore(): void {
  const loadProject = useProjectStore((s) => s.loadProject)
  const setRestoreReady = useProjectStore((s) => s.setRestoreReady)
  const showToast = useToastStore((s) => s.showToast)
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current) return
    restored.current = true

    loadLatestProject()
      .then((project) => {
        if (project) {
          loadProject(normalizeProject(project))
          showToast('前回のプロジェクトを復元しました', 'success')
        }
      })
      .catch(async (err) => {
        console.error(err)
        // 保存データが破損している可能性がある。クリアしないと以後の自動保存も失敗し続けるため、ユーザーに委ねる
        const shouldClear = confirm(
          '保存データの読み込みに失敗しました。データが破損している可能性があります。\n\n保存データを削除して初期状態で起動しますか？\n（キャンセルすると保存データを残したまま新規プロジェクトで起動します）',
        )
        if (shouldClear) {
          try {
            await clearStorage()
            showToast('保存データを削除しました', 'info')
          } catch {
            showToast('保存データの削除に失敗しました', 'error')
          }
        } else {
          showToast('プロジェクトの復元に失敗しました', 'error')
        }
      })
      .finally(() => {
        setRestoreReady(true)
      })
  }, [loadProject, setRestoreReady, showToast])
}
