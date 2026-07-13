import { useEffect, useMemo, useRef, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { exportProject, isWebCodecsSupported, QUALITY_PRESETS, type ExportQuality } from '../engine/exporter'
import { assertExportEncoderSupport } from '../utils/exportPreflight'
import { useToastStore } from '../store/toastStore'
import { ExportChapterQueuePanel } from './ExportChapterQueuePanel'
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
  formatBatchExportSummary,
  sanitizeFileBase,
} from '../utils/chapterBatchExport'
import {
  buildPartialChapterZipFilename,
  canDownloadPartialChapterZip,
  createChapterExportQueue,
  finalizeChapterQueueOnAbort,
  formatBatchExportProgressDetail,
  formatChapterQueueCancelDetail,
  formatChapterQueueFailureDetail,
  getChapterQueueDoneCount,
  getFailedChapterIndices,
  getPartialChapterZipButtonLabel,
  getPartialChapterZipHint,
  getResumableChapterCount,
  hasFailedChapters,
  hasPartialChapterProgress,
  isChapterQueueComplete,
  runChapterExportQueue,
  zipCompletedChapterQueue,
  type ChapterExportQueue,
} from '../utils/exportChapterQueue'
import { maybeThrowE2eExportFailure } from '../utils/e2eExportFailure'
import { resolveRangeExportParams } from '../utils/chapterRangeExport'
import { estimateExportMemoryPressure } from '../utils/exportMemory'
import { getSnsExportDefaults } from '../utils/snsShareFlow'
import { formatExportAudioDecodeSkipMessage, mergeExportAudioDecodeSkips, type ExportAudioDecodeSkip } from '../utils/exportAudioDecode'
import {
  getExportRetryButtonLabel,
  getExportRetryHint,
  isRetryableExportJob,
  type ExportJobSnapshot,
} from '../utils/exportRetry'

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
  const [chapterQueue, setChapterQueue] = useState<ChapterExportQueue | null>(null)
  const [retryableJob, setRetryableJob] = useState<ExportJobSnapshot | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const exportStartedAtRef = useRef<number | null>(null)
  const presetImportRef = useRef<HTMLInputElement>(null)
  const snsExportActiveRef = useRef(false)
  const snsDefaults = getSnsExportDefaults()

  const showExportHint = useProjectStore((s) => s.showExportHint)
  const setShowExportHint = useProjectStore((s) => s.setShowExportHint)
  const snsExportPending = useProjectStore((s) => s.snsExportPending)
  const acknowledgeSnsExportPending = useProjectStore((s) => s.acknowledgeSnsExportPending)
  const setShowSnsShareGuide = useProjectStore((s) => s.setShowSnsShareGuide)
  const setProjectSettings = useProjectStore((s) => s.setProjectSettings)

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

  const exportMemoryPressure = useMemo(() => {
    const duration = getProjectDuration()
    const params = resolveRangeExportParams(inPoint, outPoint, duration)
    const exportDuration = params?.duration ?? duration
    const { width, height } = resolveExportSize(project.width, project.height, resolution)
    return estimateExportMemoryPressure({
      width,
      height,
      durationSec: exportDuration,
      quality,
      chapterCount: markerChapters.length,
    })
  }, [project.width, project.height, resolution, quality, inPoint, outPoint, getProjectDuration, markerChapters.length])

  const hasClips = project.tracks.some((t) => t.clips.length > 0)
  const exportDisabled = isExporting || !hasClips
  const exportTooltip = !hasClips ? 'クリップを追加してから書き出してください' : undefined
  const failedChapterCount = chapterQueue ? getFailedChapterIndices(chapterQueue).length : 0
  const resumableChapterCount = chapterQueue ? getResumableChapterCount(chapterQueue) : 0
  const doneChapterCount = chapterQueue ? getChapterQueueDoneCount(chapterQueue) : 0
  const canSavePartialZip = chapterQueue ? canDownloadPartialChapterZip(chapterQueue) : false

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
    if (!snsExportPending) return
    setQuality(snsDefaults.quality)
    setResolution(snsDefaults.resolution)
    acknowledgeSnsExportPending()
    resetExportPanel()
    setShowDialog(true)
  }, [snsExportPending])

  useEffect(() => {
    if (!isExporting || exportStartedAtRef.current === null) return
    const elapsed = Date.now() - exportStartedAtRef.current
    setEtaLabel(estimateExportEta(exportProgress, elapsed).label)
  }, [isExporting, exportProgress])

  const resetExportPanel = () => {
    setPanelView('form')
    setExportErrorDetail(null)
    setExportErrorTitle('書き出しに失敗しました')
    setEtaLabel('残り時間を計算中…')
    setRetryableJob(null)
    setChapterQueue(null)
    exportStartedAtRef.current = null
  }

  const rememberExportJob = (job: ExportJobSnapshot) => {
    setRetryableJob(job)
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

  const applySnsExportPreset = () => {
    setProjectSettings({ width: 1080, height: 1920 })
    setQuality(snsDefaults.quality)
    setResolution(snsDefaults.resolution)
    showToast('SNS配信用の設定を適用しました', 'info')
  }

  const handleSnsOneClickExport = () => {
    useProjectStore.getState().setProjectSettings({ width: 1080, height: 1920 })
    setQuality(snsDefaults.quality)
    setResolution(snsDefaults.resolution)
    snsExportActiveRef.current = true
    void handleExport('project', snsDefaults.quality, 'sns')
  }

  const handleRetryLastExport = () => {
    const job = retryableJob
    if (!isRetryableExportJob(job)) return
    if (job.mode === 'batch' && chapterQueue && hasFailedChapters(chapterQueue)) {
      void runBatchChapterExport(getFailedChapterIndices(chapterQueue))
      return
    }
    if (job.mode === 'batch') {
      void runBatchChapterExport()
      return
    }
    if (job.mode === 'sns') {
      handleSnsOneClickExport()
      return
    }
    void handleExport(job.resolution, job.quality)
  }

  const handleDownloadPartialChapterZip = async () => {
    if (!chapterQueue || !canDownloadPartialChapterZip(chapterQueue)) return
    try {
      const zipBlob = await zipCompletedChapterQueue(chapterQueue)
      const done = getChapterQueueDoneCount(chapterQueue)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = buildPartialChapterZipFilename(project.name || 'movie', done)
      a.click()
      URL.revokeObjectURL(url)
      showToast(`${done} 章の ZIP を保存しました`, 'success')
    } catch (err) {
      console.error(err)
      showToast('完了章の ZIP 保存に失敗しました', 'error')
    }
  }

  const runBatchChapterExport = async (onlyIndices?: number[]) => {
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
    rememberExportJob({ mode: 'batch', resolution, quality })

    const controller = new AbortController()
    abortRef.current = controller

    const { width, height } = resolveExportSize(project.width, project.height, resolution)
    const exportProject_ = { ...project, width, height }

    let queue = onlyIndices && chapterQueue
      ? chapterQueue
      : createChapterExportQueue(entries)
    setChapterQueue(queue)

    let exportError: unknown = null
    const chapterSkippedAudio: ExportAudioDecodeSkip[] = []
    try {
      await assertExportEncoderSupport({ width, height, fps: project.fps, quality })
      queue = await runChapterExportQueue(
        queue,
        async (entry, _index, onChapterProgress) => {
          maybeThrowE2eExportFailure(entry.label)
          const { blob, skippedAudio } = await exportProject(exportProject_, entry.duration, onChapterProgress, {
            signal: controller.signal,
            startTime: entry.start,
            quality,
          })
          chapterSkippedAudio.push(...skippedAudio)
          return blob
        },
        {
          onOverallProgress: setExportProgress,
          onQueueChange: setChapterQueue,
          signal: controller.signal,
          onlyIndices,
        },
      )
      setChapterQueue(queue)

      if (!isChapterQueueComplete(queue)) {
        throw new Error(formatChapterQueueFailureDetail(queue))
      }

      const zipBlob = await zipCompletedChapterQueue(queue)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sanitizeFileBase(project.name || 'movie')}_chapters.zip`
      a.click()
      URL.revokeObjectURL(url)
      setShowDialog(false)
      showToast(`${entries.length} 章を ZIP で書き出しました`, 'success')
      const skipMessage = formatExportAudioDecodeSkipMessage(mergeExportAudioDecodeSkips(chapterSkippedAudio))
      if (skipMessage) showToast(skipMessage, 'info')
    } catch (err) {
      exportError = err
      console.error(err)
    } finally {
      if (exportError && isExportAbortError(exportError)) {
        queue = finalizeChapterQueueOnAbort(queue)
        setChapterQueue(queue)
      }
      finishExport(exportError, 'batch')
    }
  }

  const handleBatchChapterExport = async () => {
    await runBatchChapterExport()
  }

  const handleExport = async (
    exportResolution: ExportResolution,
    qualityOverride?: ExportQuality,
    jobMode: ExportJobSnapshot['mode'] = 'single',
  ) => {
    if (!isWebCodecsSupported()) {
      showToast('書き出しには Chrome / Edge / Safari が必要です', 'error')
      return
    }

    const currentProject = useProjectStore.getState().project
    const duration = getProjectDuration()
    const { inPoint: exportIn, outPoint: exportOut } = useProjectStore.getState()
    const exportParams = resolveRangeExportParams(exportIn, exportOut, duration)
    if (!exportParams) {
      showToast(
        hasClips ? '書き出し範囲が短すぎます。In/Out または章区間を確認してください' : 'クリップを追加してから書き出してください',
        'error',
      )
      return
    }

    const exportQuality = qualityOverride ?? quality
    rememberExportJob({ mode: jobMode, resolution: exportResolution, quality: exportQuality })
    beginExport()

    const controller = new AbortController()
    abortRef.current = controller

    const { width, height } = resolveExportSize(currentProject.width, currentProject.height, exportResolution)
    const exportProject_ = { ...currentProject, width, height }

    let exportError: unknown = null
    try {
      await assertExportEncoderSupport({ width, height, fps: currentProject.fps, quality: exportQuality })
      const { blob, skippedAudio } = await exportProject(exportProject_, exportParams.duration, setExportProgress, {
        signal: controller.signal,
        startTime: exportParams.startTime,
        quality: exportQuality,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentProject.name || 'movie'}.mp4`
      a.click()
      URL.revokeObjectURL(url)
      setShowDialog(false)
      showToast('書き出しが完了しました', 'success')
      const skipMessage = formatExportAudioDecodeSkipMessage(skippedAudio)
      if (skipMessage) showToast(skipMessage, 'info')
      if (snsExportActiveRef.current) {
        snsExportActiveRef.current = false
        setShowSnsShareGuide(true)
      }
    } catch (err) {
      exportError = err
      console.error(err)
    } finally {
      finishExport(exportError)
    }
  }

  const progressLabel = chapterQueue
    ? formatBatchExportProgressDetail(chapterQueue, exportProgress, etaLabel)
    : formatExportProgressLabel(exportProgress, etaLabel)

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
            <p className="text-center text-sm text-text-secondary" data-testid="export-progress-label">
              {progressLabel}
            </p>
            {chapterQueue && <ExportChapterQueuePanel queue={chapterQueue} />}
            <Btn variant="danger" className="w-full" onClick={() => abortRef.current?.abort()}>
              キャンセル
            </Btn>
          </div>
        ) : panelView === 'cancelled' ? (
          <div className="space-y-4" role="status" aria-label="書き出し結果">
            <div className="rounded-xl bg-surface-3 p-4 ring-1 ring-border">
              <p className="text-sm font-medium text-text-primary">書き出しをキャンセルしました</p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                {chapterQueue && hasPartialChapterProgress(chapterQueue)
                  ? formatChapterQueueCancelDetail(chapterQueue)
                  : exportErrorDetail}
              </p>
            </div>
            {chapterQueue && hasPartialChapterProgress(chapterQueue) && (
              <ExportChapterQueuePanel queue={chapterQueue} />
            )}
            {canSavePartialZip && (
              <div className="space-y-2" data-testid="export-partial-zip-section">
                <p className="text-[10px] leading-relaxed text-text-muted">
                  {getPartialChapterZipHint(doneChapterCount)}
                </p>
                <Btn
                  variant="default"
                  className="w-full"
                  data-testid="export-partial-zip-button"
                  onClick={() => void handleDownloadPartialChapterZip()}
                >
                  {getPartialChapterZipButtonLabel(doneChapterCount)}
                </Btn>
              </div>
            )}
            {isRetryableExportJob(retryableJob) && (
              <div className="space-y-2" data-testid="export-retry-section">
                <p className="text-[10px] leading-relaxed text-text-muted">
                  {getExportRetryHint(retryableJob.mode, failedChapterCount, resumableChapterCount)}
                </p>
                <Btn
                  variant="accent"
                  className="w-full"
                  data-testid="export-retry-button"
                  onClick={handleRetryLastExport}
                >
                  {getExportRetryButtonLabel(retryableJob.mode, failedChapterCount, resumableChapterCount)}
                </Btn>
              </div>
            )}
            <Btn variant="default" className="w-full" onClick={resetExportPanel}>
              設定に戻る
            </Btn>
          </div>
        ) : panelView === 'error' ? (
          <div className="space-y-4" role="alert" aria-label="書き出しエラー">
            <div className="rounded-xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
              <p className="text-sm font-medium text-red-300">{exportErrorTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-red-200/90">{exportErrorDetail}</p>
            </div>
            {chapterQueue && (hasFailedChapters(chapterQueue) || hasPartialChapterProgress(chapterQueue)) && (
              <ExportChapterQueuePanel queue={chapterQueue} />
            )}
            {canSavePartialZip && (
              <div className="space-y-2" data-testid="export-partial-zip-section">
                <p className="text-[10px] leading-relaxed text-text-muted">
                  {getPartialChapterZipHint(doneChapterCount)}
                </p>
                <Btn
                  variant="default"
                  className="w-full"
                  data-testid="export-partial-zip-button"
                  onClick={() => void handleDownloadPartialChapterZip()}
                >
                  {getPartialChapterZipButtonLabel(doneChapterCount)}
                </Btn>
              </div>
            )}
            {isRetryableExportJob(retryableJob) && (
              <div className="space-y-2" data-testid="export-retry-section">
                <p className="text-[10px] leading-relaxed text-text-muted">
                  {getExportRetryHint(retryableJob.mode, failedChapterCount, resumableChapterCount)}
                </p>
                <Btn
                  variant="accent"
                  className="w-full"
                  data-testid="export-retry-button"
                  onClick={handleRetryLastExport}
                >
                  {getExportRetryButtonLabel(retryableJob.mode, failedChapterCount, resumableChapterCount)}
                </Btn>
              </div>
            )}
            <Btn variant="default" className="w-full" onClick={resetExportPanel}>
              設定に戻る
            </Btn>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              data-testid="sns-share-flow-section"
              className="rounded-xl border border-accent/30 bg-accent-muted/30 p-3 ring-1 ring-accent/20"
            >
              <p className="text-[11px] font-semibold text-text-primary">SNS即配信（9:16縦型・軽量）</p>
              <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
                Instagram ストーリー / Reels / TikTok 向け。婚礼本編（16:9 上映）とは別ラインです。
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <Btn variant="default" className="w-full text-xs" onClick={applySnsExportPreset}>
                  9:16に切り替えて設定を適用
                </Btn>
                <Btn variant="accent" className="w-full text-xs" onClick={handleSnsOneClickExport}>
                  9:16で即書き出し
                </Btn>
              </div>
            </div>

            <p className="text-[10px] text-text-muted">
              プロジェクト解像度: {project.width}×{project.height}
            </p>
            {exportMemoryPressure.message && (
              <p
                data-testid="export-memory-warning"
                className={`rounded-lg px-3 py-2 text-[10px] leading-relaxed ring-1 ${
                  exportMemoryPressure.level === 'high'
                    ? 'bg-amber-500/10 text-amber-200 ring-amber-500/30'
                    : 'bg-surface-3 text-text-muted ring-border'
                }`}
              >
                {exportMemoryPressure.message}
              </p>
            )}

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
