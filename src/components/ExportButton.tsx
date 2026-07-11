import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { exportProject, isWebCodecsSupported, QUALITY_PRESETS, type ExportQuality } from '../engine/exporter'
import { useToastStore } from '../store/toastStore'
import { Modal, Btn, ProgressBar } from './ui'
import { Icons } from './icons'
import type { ExportPreset, ExportResolution } from '../types/exportPreset'
import { deleteExportPreset, importExportPresets, loadExportPresets, saveExportPreset } from '../persistence/exportPresets'
import { downloadBlob } from '../persistence/projectFile'
import { buildExportPreset, formatExportPresetSummary } from '../utils/exportPresetUtils'
import {
  buildExportedExportPresetFile,
  buildExportPresetExportFilename,
  parseExportPresetFileText,
  serializeExportedExportPresetFile,
} from '../utils/exportPresetFile'
import {
  estimateExportEta,
  formatExportError,
  formatExportProgressLabel,
  isExportAbortError,
} from '../utils/exportUx'
import {
  getExportResolutionLabel,
  getNativeExportButtonLabel,
  resolveExportSize,
} from '../utils/exportResolution'
import { formatMarkerChapterRange, getMarkerChapterRanges } from '../utils/markerExport'
import {
  buildChapterExportEntries,
  exportAllChaptersToZip,
  formatBatchExportSummary,
  sanitizeFileBase,
} from '../utils/chapterBatchExport'

type ExportPanelView = 'form' | 'progress' | 'cancelled' | 'error'

export function ExportButton() {
  const [showDialog, setShowDialog] = useState(false)
  const [panelView, setPanelView] = useState<ExportPanelView>('form')
  const [exportErrorDetail, setExportErrorDetail] = useState<string | null>(null)
  const [exportErrorTitle, setExportErrorTitle] = useState('書き出しに失敗しました')
  const [etaLabel, setEtaLabel] = useState('残り時間を計算中…')
  const [quality, setQuality] = useState<ExportQuality>('standard')
  const [resolution, setResolution] = useState<ExportResolution>('project')
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<ExportPreset[]>([])
  const [batchExportLabel, setBatchExportLabel] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const exportStartedAtRef = useRef<number | null>(null)
  const presetImportRef = useRef<HTMLInputElement>(null)

  const showExportHint = useProjectStore((s) => s.showExportHint)
  const setShowExportHint = useProjectStore((s) => s.setShowExportHint)

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
    if (!showExportHint) return
    const timer = setTimeout(() => setShowExportHint(false), 8000)
    return () => clearTimeout(timer)
  }, [showExportHint, setShowExportHint])

  useEffect(() => {
    if (showDialog) setShowExportHint(false)
  }, [showDialog, setShowExportHint])

  useEffect(() => {
    if (showDialog) setPresets(loadExportPresets())
  }, [showDialog])

  useEffect(() => {
    if (!isExporting || exportStartedAtRef.current === null) return
    const elapsed = Date.now() - exportStartedAtRef.current
    setEtaLabel(estimateExportEta(exportProgress, elapsed).label)
  }, [isExporting, exportProgress])

  const resetExportPanel = () => {
    setPanelView('form')
    setExportErrorDetail(null)
    setExportErrorTitle('書き出しに失敗しました')
    setBatchExportLabel('')
    setEtaLabel('残り時間を計算中…')
    exportStartedAtRef.current = null
  }

  const beginExport = () => {
    setPanelView('progress')
    setExportErrorDetail(null)
    setExportStartedAt()
    setIsExporting(true)
    setExportProgress(0)
  }

  const setExportStartedAt = () => {
    exportStartedAtRef.current = Date.now()
    setEtaLabel('残り時間を計算中…')
  }

  const finishExport = (err: unknown | null, context: 'single' | 'batch' = 'single') => {
    setIsExporting(false)
    setExportProgress(0)
    setBatchExportLabel('')
    abortRef.current = null
    exportStartedAtRef.current = null

    if (err) {
      const presentation = formatExportError(err, context)
      if (isExportAbortError(err)) {
        setPanelView('cancelled')
        setExportErrorDetail(presentation.detail)
        showToast(presentation.title, 'info')
      } else {
        setPanelView('error')
        setExportErrorTitle(presentation.title)
        setExportErrorDetail(presentation.detail)
        showToast(presentation.title, 'error')
      }
      return
    }

    resetExportPanel()
  }

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

  const handleExportPresetsFile = (targetPresets: ExportPreset[] = presets) => {
    if (targetPresets.length === 0) return
    const payload = buildExportedExportPresetFile(targetPresets)
    const filename = buildExportPresetExportFilename(
      targetPresets.length === 1 ? targetPresets[0].name : 'export-presets',
    )
    downloadBlob(
      new Blob([serializeExportedExportPresetFile(payload)], { type: 'application/json' }),
      filename,
    )
    showToast(`${targetPresets.length} 件のプリセットをエクスポートしました`, 'success')
  }

  const handleImportPresetsFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const items = await parseExportPresetFileText(text)
      const imported = importExportPresets(items)
      setPresets(imported)
      const label = items.length === 1 ? `「${items[0].name}」` : `${items.length} 件`
      showToast(`${label}プリセットをインポートしました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'インポートに失敗しました', 'error')
    }
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

    beginExport()

    const controller = new AbortController()
    abortRef.current = controller

    const { width, height } = resolveExportSize(project.width, project.height, exportResolution)
    const exportProject_ = { ...project, width, height }

    let exportError: unknown = null
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
      exportError = err
      console.error(err)
    } finally {
      finishExport(exportError)
    }
  }

  const handleBatchChapterExport = async () => {
    if (!isWebCodecsSupported()) {
      showToast('書き出しには Chrome / Edge / Safari が必要です', 'error')
      return
    }

    const entries = buildChapterExportEntries(project.name || 'movie', markerChapters)
    if (entries.length === 0) {
      showToast('書き出し可能な章がありません', 'error')
      return
    }

    beginExport()

    const controller = new AbortController()
    abortRef.current = controller

    const { width, height } = resolveExportSize(project.width, project.height, resolution)
    const exportProject_ = { ...project, width, height }

    let exportError: unknown = null
    try {
      const zipBlob = await exportAllChaptersToZip(
        async (entry, onChapterProgress) => {
          setBatchExportLabel(`章「${entry.label}」を書き出し中…`)
          return exportProject(exportProject_, entry.duration, onChapterProgress, {
            signal: controller.signal,
            startTime: entry.start,
            quality,
          })
        },
        entries,
        setExportProgress,
        controller.signal,
      )
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sanitizeFileBase(project.name || 'movie')}_chapters.zip`
      a.click()
      URL.revokeObjectURL(url)
      setShowDialog(false)
      showToast(`${entries.length} 章を ZIP で書き出しました`, 'success')
    } catch (err) {
      exportError = err
      console.error(err)
    } finally {
      finishExport(exportError, 'batch')
    }
  }

  return (
    <>
      <span title={exportTooltip} className="relative inline-flex">
        {showExportHint && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 animate-fade-in whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-surface-0 shadow-lg shadow-black/40"
          >
            書き出しから MP4 を保存
            <span className="absolute top-full right-4 border-4 border-transparent border-t-accent" />
          </div>
        )}
        <Btn
          variant="accent"
          onClick={() => {
            setShowExportHint(false)
            if (!isExporting) resetExportPanel()
            setShowDialog(true)
          }}
          disabled={exportDisabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${showExportHint ? 'animate-pulse ring-2 ring-accent ring-offset-2 ring-offset-surface-1' : ''}`}
        >
          <Icons.Export size={14} />
          {isExporting ? `${Math.round(exportProgress * 100)}%` : '書き出し'}
        </Btn>
      </span>

      <Modal
        open={showDialog}
        onClose={() => {
          if (!isExporting) {
            resetExportPanel()
            setShowDialog(false)
          }
        }}
        title="MP4書き出し"
      >
        {panelView === 'progress' && isExporting ? (
          <div className="space-y-4" aria-live="polite">
            <ProgressBar progress={exportProgress} />
            <p className="text-center text-sm text-text-secondary">
              {formatExportProgressLabel(exportProgress, etaLabel)}
            </p>
            {batchExportLabel && (
              <p className="text-center text-xs text-text-muted">{batchExportLabel}</p>
            )}
            <Btn variant="danger" className="w-full" onClick={() => abortRef.current?.abort()}>
              キャンセル
            </Btn>
          </div>
        ) : panelView === 'cancelled' ? (
          <div className="space-y-4" role="status" aria-label="書き出し結果">
            <div className="rounded-xl bg-surface-3 p-4 ring-1 ring-border">
              <p className="text-sm font-medium text-text-primary">書き出しをキャンセルしました</p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">{exportErrorDetail}</p>
            </div>
            <Btn variant="accent" className="w-full" onClick={resetExportPanel}>
              設定に戻る
            </Btn>
          </div>
        ) : panelView === 'error' ? (
          <div className="space-y-4" role="alert" aria-label="書き出しエラー">
            <div className="rounded-xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
              <p className="text-sm font-medium text-red-300">{exportErrorTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-red-200/90">{exportErrorDetail}</p>
            </div>
            <Btn variant="accent" className="w-full" onClick={resetExportPanel}>
              設定に戻る
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
                <p className="mt-2 text-[10px] text-text-muted">
                  {formatBatchExportSummary(markerChapters.length)}
                </p>
                <Btn
                  variant="accent"
                  className="mt-2 w-full text-xs"
                  aria-label="全章を ZIP で書き出し"
                  onClick={handleBatchChapterExport}
                >
                  全章を ZIP で書き出し ({markerChapters.length} 章)
                </Btn>
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
              <div className="mt-2 flex flex-wrap gap-2">
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
                  accept=".json,.fable-export-preset.json,application/json"
                  className="hidden"
                  aria-label="書き出しプリセットファイルをインポート"
                  onChange={(e) => {
                    void handleImportPresetsFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-text-muted">
                `.fable-export-preset.json` で別端末と共有できます
              </p>
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
