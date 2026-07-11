import { useEffect } from 'react'
import { AppLayout } from './layout/AppLayout'
import { ToastContainer } from './components/ToastContainer'
import { OnboardingModal } from './components/OnboardingModal'
import { PlaybackProvider } from './contexts/PlaybackContext'
import { useAutoSave, useProjectRestore } from './hooks/useAutoSave'
import { useProjectStore } from './store/projectStore'
import { saveProject } from './persistence/db'
import { useToastStore } from './store/toastStore'
import { installE2eBridge } from './e2eBridge'

installE2eBridge()

function App() {
  useProjectRestore()
  useAutoSave()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const store = useProjectStore.getState()
      const showToast = useToastStore.getState().showToast

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        const { start, end } = store.getPlaybackRange()
        if (store.currentTime >= end) store.setCurrentTime(start)
        store.setIsPlaying(!store.isPlaying)
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedClipId) store.removeClip(store.selectedClipId)
        else if (store.selectedMarkerId) store.removeMarker(store.selectedMarkerId)
      }

      if (e.key === 'Escape') {
        store.setSelectedClipId(null)
        store.setSelectedMarkerId(null)
      }

      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        saveProject(store.project).then(() => showToast('保存しました', 'success')).catch(() => showToast('保存に失敗しました', 'error'))
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); store.redo() }
      else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); store.undo() }

      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); store.duplicateSelectedClip() }
      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); store.copySelectedClip(); showToast('コピーしました', 'info') }
      if (e.key === 'v' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); store.pasteClip() }

      if (e.key === 's' && !e.metaKey && !e.ctrlKey && store.selectedClipId) store.splitClipAt(store.selectedClipId, store.currentTime)
      if (e.key === 'i' || e.key === 'I') store.setInPoint(store.currentTime)
      if (e.key === 'o' || e.key === 'O') store.setOutPoint(store.currentTime)
      if (e.key === 'm' || e.key === 'M') {
        if (e.shiftKey) store.addBeatMarker(store.currentTime)
        else store.addMarker(store.currentTime)
      }
      if (e.key === 'g' || e.key === 'G') store.setShowSafeAreas(!store.showSafeAreas)
      if (e.key === 'f' || e.key === 'F') {
        const preview = document.querySelector('[data-preview-container]') as HTMLElement | null
        if (preview) {
          if (document.fullscreenElement) document.exitFullscreen()
          else preview.requestFullscreen()
        }
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 1 / store.project.fps
        store.setCurrentTime(Math.max(0, store.currentTime - step))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 1 / store.project.fps
        store.setCurrentTime(Math.min(store.getProjectDuration(), store.currentTime + step))
      }

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        store.setIsPlaying(false)
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        const { start, end } = store.getPlaybackRange()
        if (store.currentTime >= end) store.setCurrentTime(start)
        store.setIsPlaying(true)
      }
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        store.setIsPlaying(false)
        const step = e.shiftKey ? 1 / store.project.fps : 1
        store.setCurrentTime(Math.max(0, store.currentTime - step))
      }

      if (store.selectedClipId) {
        const editStep = e.shiftKey ? 1 : 1 / store.project.fps
        if (e.key === ',' || e.code === 'Comma') {
          e.preventDefault()
          store.slipSelectedClip(-editStep)
        }
        if (e.key === '.' || e.code === 'Period') {
          e.preventDefault()
          store.slipSelectedClip(editStep)
        }
        if (e.key === '[') {
          e.preventDefault()
          if (!store.slideSelectedClip(-editStep)) {
            showToast('スライド編集には前後の隣接クリップが必要です', 'info')
          }
        }
        if (e.key === ']') {
          e.preventDefault()
          if (!store.slideSelectedClip(editStep)) {
            showToast('スライド編集には前後の隣接クリップが必要です', 'info')
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <PlaybackProvider>
      <AppLayout />
      <ToastContainer />
      <OnboardingModal />
    </PlaybackProvider>
  )
}

export default App
