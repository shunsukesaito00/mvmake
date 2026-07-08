import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { exportProject, isWebCodecsSupported, QUALITY_PRESETS, type ExportQuality } from '../engine/exporter'
import { useToastStore } from '../store/toastStore'
import { Modal, Btn, ProgressBar } from './ui'
import { Icons } from './icons'
import type { ExportPreset, ExportResolution } from '../types/exportPreset'
import { deleteExportPreset, loadExportPresets, saveExportPreset } from '../persistence/exportPresets'
import { buildExportPreset, formatExportPresetSummary } from '../utils/exportPresetUtils'
import {
  getExportResolutionLabel,
  getNativeExportButtonLabel,
  resolveExportSize,
} from '../utils/exportResolution'
import { formatMarkerChapterRange, getMarkerChapterRanges } from '../utils/markerExport'

export function ExportButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [quality, setQuality] = useState<ExportQuality>('standard')
  const [resolution, setResolution] = useState<ExportResolution>('project')
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<ExportPreset[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const project = useProjectStore((s) => s.project)
  const isExporting = useProjectStore((s) => s.isExporting)
  const exportProgress = useProjectStore((s) => s.exportProgress)
  const inPoint = useProjectStore((s) => s.inPoint)
  const outPoint = useProjectStore((s) => s.outPoint)
  const setIsExporting = useProjectStore((s) => s.setIsExporting)
  const setExportProgress = useProjectStore((s) => s.setExportProgress)
  const setInPoint = useProjectStore((s) => s.setInPoint)
  const setOutPoint = useProjectStore((s) => s.setOutPoint)
  const setInOutFromMarker = useProjectStore((s) => s.setInOutFromMarker)
  const clearInOut = useProjectStore((s) => s.clearInOut)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)
  const showToast = useToastStore((s) => s.showToast)

  const projectDuration = getProjectDuration()
  const markerChapters = getMarkerChapterRanges(project.markers ?? [], projectDuration)

  const nativeExportLabel = getNativeExportButtonLabel(project.width, project.height)
  const nativeDimensions = getExportResolutionLabel('project', project.width, project.height)

  const hasClips = project.tracks.some((t) => t.clips.length > 0)
  const exportDisabled = isExporting || !hasClips
  const exportTooltip = !hasClips ? 'クリップを追加してから書き出してください' : undefined

  useEffect(() => {
    if (showDialog) setPresets(loadExportPresets())
  }, [showDialog])

  useEffect(() => {
    if (!isExporting) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isExporting])

  const handleSavePreset = () => {
    try {
      const preset = buildExportPreset(presetName, quality, resolution, inPoint, outPoint)
      setPresets(saveExportPreset(preset))
      setPresetName('')
      showToast(`「${preset.name}」プリセットを保存しました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存に失敗しました', 'error')
    }
  }

  const handleApplyPreset = (preset: ExportPreset) => {
    setQuality(preset.quality)
    setResolution(preset.resolution)
    if (preset.useInOut) {
      setInPoint(preset.inPoint)
      setOutPoint(preset.outPoint)
    } else {
      clearInOut()
    }
    showToast(`「${preset.name}」プリセットを適用しました`, 'info')
  }

  const handleDeletePreset = (id: string) => {
    setPresets(deleteExportPreset(id))
  }

  const handleSetChapterInOut = (markerId: string) => {
    const ok = setInOutFromMarker(markerId)
    if (!ok) {
      showToast('章区間を In/Out に設定できませんでした', 'error')
      return
    }
    const range = getMarkerChapterRanges(project.markers ?? [], projectDuration).find((r) => r.markerId === markerId)
    showToast(`「${range?.label ?? '章'}」を In/Out に設定しました`, 'info')
  }

  const handleExport = async (exportResolution: ExportResolution) => {
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

    const { width, height } = resolveExportSize(project.width, project.height, exportResolution)
    const exportProject_ = { ...project, width, height }

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
      <span title={exportTooltip} className="inline-flex">
        <Btn
          variant="accent"
          onClick={() => setShowDialog(true)}
          disabled={exportDisabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          <Icons.Export size={14} />
          {isExporting ? `${Math.round(exportProgress * 100)}%` : '書き出し'}
        </Btn>
      </span>

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
            <p className="text-[10px] text-text-muted">
              プロジェクト解像度: {project.width}×{project.height}
            </p>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">品質</p>
              <div className="space-y-1.5">
                {(Object.entries(QUALITY_PRESETS) as [ExportQuality, typeof QUALITY_PRESETS[ExportQuality]][]).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={quality === key}
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
              <div className="grid grid-cols-2 gap-1.5">
                {(['project', '720p'] as ExportResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    aria-label={`解像度 ${res === 'project' ? 'プロジェクト' : res}`}
                    aria-pressed={resolution === res}
                    onClick={() => setResolution(res)}
                    className={`rounded-xl px-3 py-2.5 text-left ring-1 transition-all ${
                      resolution === res
                        ? 'bg-accent-muted ring-accent/40'
                        : 'bg-surface-3 ring-border hover:ring-accent/30'
                    }`}
                  >
                    <span className="block text-sm font-medium text-text-primary">
                      {res === 'project' ? 'プロジェクト' : '720p'}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted">
                      {getExportResolutionLabel(res, project.width, project.height)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {markerChapters.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">章マーカー区間</p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {markerChapters.map((chapter) => (
                    <button
                      key={chapter.markerId}
                      type="button"
                      aria-label={`章「${chapter.label}」を In/Out に設定`}
                      onClick={() => handleSetChapterInOut(chapter.markerId)}
                      className="flex w-full items-center justify-between rounded-xl bg-surface-3 px-3 py-2.5 text-left ring-1 ring-border transition-all hover:ring-accent/40"
                    >
                      <span className="text-xs font-medium text-text-primary">{formatMarkerChapterRange(chapter)}</span>
                      <span className="shrink-0 text-[10px] text-accent">In/Outに設定</span>
                    </button>
                  ))}
                </div>
                {(inPoint !== null || outPoint !== null) && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-text-muted">
                      書き出し範囲: {inPoint?.toFixed(1) ?? '—'}–{outPoint?.toFixed(1) ?? '—'}s
                    </p>
                    <button
                      type="button"
                      onClick={() => clearInOut()}
                      className="text-[10px] text-text-muted hover:text-text-secondary"
                    >
                      範囲をクリア
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">書き出しプリセット</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="プリセット名"
                  className="min-w-0 flex-1 rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
                />
                <Btn variant="default" className="shrink-0 text-xs" onClick={handleSavePreset}>
                  プリセット保存
                </Btn>
              </div>
              {(inPoint !== null || outPoint !== null) && (
                <p className="mt-1.5 text-[10px] text-text-muted">
                  現在の In/Out ({inPoint?.toFixed(1) ?? '—'}–{outPoint?.toFixed(1) ?? '—'}s) も保存されます
                </p>
              )}
              {presets.length > 0 ? (
                <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
                  {presets.map((preset) => (
                    <li
                      key={preset.id}
                      className="flex items-center gap-2 rounded-lg bg-surface-3 px-2 py-2 ring-1 ring-border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text-primary">{preset.name}</p>
                        <p className="truncate text-[10px] text-text-muted">
                          {formatExportPresetSummary(preset, QUALITY_PRESETS[preset.quality].label)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`${preset.name}を適用`}
                        onClick={() => handleApplyPreset(preset)}
                        className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent-muted"
                      >
                        適用
                      </button>
                      <button
                        type="button"
                        aria-label={`${preset.name}を削除`}
                        onClick={() => handleDeletePreset(preset.id)}
                        className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-text-muted hover:text-danger"
                      >
                        <Icons.X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[10px] text-text-muted">保存した設定を名前付きで呼び出せます</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">書き出し</p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleExport('project')}
                  className="flex w-full items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-left ring-1 ring-border transition-all hover:ring-accent/40"
                >
                  <span className="text-sm font-medium text-text-primary">{nativeExportLabel}</span>
                  <span className="font-mono text-xs text-text-muted">{nativeDimensions}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('720p')}
                  className="flex w-full items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-left ring-1 ring-border transition-all hover:ring-accent/40"
                >
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
