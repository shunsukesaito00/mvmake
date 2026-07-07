import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { exportProject, isWebCodecsSupported, QUALITY_PRESETS, type ExportQuality } from '../engine/exporter'
import { useToastStore } from '../store/toastStore'
import { Modal, Btn, ProgressBar } from './ui'
import { Icons } from './icons'

export function ExportButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [quality, setQuality] = useState<ExportQuality>('standard')
  const abortRef = useRef<AbortController | null>(null)

  const project = useProjectStore((s) => s.project)
  const isExporting = useProjectStore((s) => s.isExporting)
  const exportProgress = useProjectStore((s) => s.exportProgress)
  const setIsExporting = useProjectStore((s) => s.setIsExporting)
  const setExportProgress = useProjectStore((s) => s.setExportProgress)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)
  const showToast = useToastStore((s) => s.showToast)

  // 書き出し中のタブクローズ/リロードに確認ダイアログを出す
  useEffect(() => {
    if (!isExporting) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isExporting])

  const handleExport = async (resolution: '1080p' | '720p') => {
    if (!isWebCodecsSupported()) {
      showToast('書き出しには Chrome / Edge / Safari が必要です', 'error')
      return
    }

    const duration = getProjectDuration()
    const { start, end } = useProjectStore.getState().getPlaybackRange()
    const exportDuration = (useProjectStore.getState().inPoint !== null || useProjectStore.getState().outPoint !== null)
      ? end - start
      : duration

    if (exportDuration <= 0.01) {
      showToast('クリップを追加してから書き出してください', 'error')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    const controller = new AbortController()
    abortRef.current = controller

    const exportProject_ = { ...project }
    if (resolution === '720p') {
      exportProject_.width = 1280
      exportProject_.height = 720
    }

    try {
      const blob = await exportProject(exportProject_, exportDuration, setExportProgress, {
        signal: controller.signal,
        startTime: start,
        quality,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name || 'movie'}.mp4`
      a.click()
      URL.revokeObjectURL(url)
      setShowDialog(false)
      showToast('書き出しが完了しました', 'success')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        showToast('書き出しをキャンセルしました', 'info')
      } else {
        console.error(err)
        showToast(err instanceof Error ? err.message : '書き出しに失敗しました', 'error')
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      abortRef.current = null
    }
  }

  return (
    <>
      <Btn variant="accent" onClick={() => setShowDialog(true)} disabled={isExporting} className="flex items-center gap-1.5 px-3 py-1.5 text-xs">
        <Icons.Export size={14} />
        {isExporting ? `${Math.round(exportProgress * 100)}%` : '書き出し'}
      </Btn>

      <Modal open={showDialog} onClose={() => !isExporting && setShowDialog(false)} title="MP4書き出し">
        {isExporting ? (
          <div className="space-y-4">
            <ProgressBar progress={exportProgress} />
            <p className="text-center text-sm text-text-secondary">
              {Math.round(exportProgress * 100)}% 完了
            </p>
            <Btn variant="danger" className="w-full" onClick={() => abortRef.current?.abort()}>
              キャンセル
            </Btn>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">品質</p>
              <div className="space-y-1.5">
                {(Object.entries(QUALITY_PRESETS) as [ExportQuality, typeof QUALITY_PRESETS[ExportQuality]][]).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setQuality(key)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left ring-1 transition-all ${
                      quality === key
                        ? 'bg-accent-muted ring-accent/40'
                        : 'bg-surface-3 ring-border hover:ring-accent/30'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-text-primary">{preset.label}</span>
                      <span className="ml-2 text-[10px] text-text-muted">{preset.description}</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">{preset.videoBitrate / 1_000_000}Mbps</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">解像度</p>
              <div className="space-y-1.5">
                <button onClick={() => handleExport('1080p')} className="flex w-full items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-left ring-1 ring-border transition-all hover:ring-accent/40">
                  <span className="text-sm font-medium text-text-primary">1080p で書き出し</span>
                  <span className="font-mono text-xs text-text-muted">1920×1080</span>
                </button>
                <button onClick={() => handleExport('720p')} className="flex w-full items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-left ring-1 ring-border transition-all hover:ring-accent/40">
                  <span className="text-sm font-medium text-text-primary">720p で書き出し</span>
                  <span className="font-mono text-xs text-text-muted">1280×720</span>
                </button>
              </div>
            </div>

            <Btn variant="ghost" className="w-full" onClick={() => setShowDialog(false)}>
              キャンセル
            </Btn>
          </div>
        )}
      </Modal>
    </>
  )
}
