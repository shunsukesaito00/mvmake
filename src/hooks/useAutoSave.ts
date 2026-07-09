import { useEffect, useRef } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useAutoSaveStore } from '../store/autosaveStore'
import { saveProject, loadLatestProject, cleanupOrphanMedia, clearStorage } from '../persistence/db'
import {
  estimateProjectStorageBytes,
  formatStorageError,
  LARGE_PROJECT_BYTES,
} from '../persistence/storageUtils'
import { normalizeProject } from '../types/project'
import { useToastStore } from '../store/toastStore'

const SAVE_DEBOUNCE_MS = 2000
const SAVED_INDICATOR_MS = 2000

export function useAutoSave(): void {
  const project = useProjectStore((s) => s.project)
  const restoreReady = useProjectStore((s) => s.restoreReady)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useToastStore((s) => s.showToast)
  const setPending = useAutoSaveStore((s) => s.setPending)
  const setSaving = useAutoSaveStore((s) => s.setSaving)
  const setSaved = useAutoSaveStore((s) => s.setSaved)
  const setError = useAutoSaveStore((s) => s.setError)
  const resetToIdle = useAutoSaveStore((s) => s.resetToIdle)

  useEffect(() => {
    if (!restoreReady) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setPending()

    timerRef.current = setTimeout(() => {
      const mediaTotal = project.mediaAssets.length
      const bytes = estimateProjectStorageBytes(project)
      if (bytes >= LARGE_PROJECT_BYTES) {
        showToast(`大容量プロジェクトを自動保存しています（${mediaTotal}件のメディア）`, 'info')
      }

      setSaving(mediaTotal > 0 ? { current: 0, total: mediaTotal } : undefined)
      saveProject(project, (progress) => {
        if (progress.phase === 'media') {
          setSaving({ current: progress.mediaIndex, total: progress.mediaTotal })
        }
      })
        .then(() => cleanupOrphanMedia(project))
        .then(() => {
          setSaved()
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(() => resetToIdle(), SAVED_INDICATOR_MS)
        })
        .catch((err) => {
          console.error(err)
          setError()
          showToast(formatStorageError(err), 'error')
        })
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [project, restoreReady, showToast, setPending, setSaving, setSaved, setError, resetToIdle])
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
