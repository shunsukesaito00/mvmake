import { useEffect, useRef, useCallback, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { renderFrame, seekVideosToTime } from '../engine/compositor'
import { usePlaybackControls } from '../contexts/PlaybackContext'
import { PanelHeader, IconButton, Timecode } from '../components/ui'
import { Icons } from '../components/icons'
import { PreviewOverlay } from '../components/PreviewOverlay'
import { ColorWaveformScope } from '../components/ColorWaveformScope'
import { downsampleImageData } from '../utils/colorScope'

export function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const beforeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const afterCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [scopeImageData, setScopeImageData] = useState<ImageData | null>(null)

  const project = useProjectStore((s) => s.project)
  const currentTime = useProjectStore((s) => s.currentTime)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const showSafeAreas = useProjectStore((s) => s.showSafeAreas)
  const colorPreviewMode = useProjectStore((s) => s.colorPreviewMode)
  const showColorScope = useProjectStore((s) => s.showColorScope)
  const setColorPreviewMode = useProjectStore((s) => s.setColorPreviewMode)
  const setShowColorScope = useProjectStore((s) => s.setShowColorScope)
  const showPlayHint = useProjectStore((s) => s.showPlayHint)
  const setShowPlayHint = useProjectStore((s) => s.setShowPlayHint)
  const coachmarkFromSample = useProjectStore((s) => s.coachmarkFromSample)
  const setCoachmarkFromSample = useProjectStore((s) => s.setCoachmarkFromSample)
  const setShowExportHint = useProjectStore((s) => s.setShowExportHint)
  const inPoint = useProjectStore((s) => s.inPoint)
  const outPoint = useProjectStore((s) => s.outPoint)
  const setShowSafeAreas = useProjectStore((s) => s.setShowSafeAreas)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)

  const { togglePlay, seek, subscribeFrame } = usePlaybackControls()
  const duration = getProjectDuration()
  const fps = project.fps

  const drawAtTime = useCallback(async (time: number, playing: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (!playing) await seekVideosToTime(project, time)

    if (colorPreviewMode === 'beforeAfter') {
      if (!beforeCanvasRef.current) beforeCanvasRef.current = document.createElement('canvas')
      if (!afterCanvasRef.current) afterCanvasRef.current = document.createElement('canvas')
      const beforeCanvas = beforeCanvasRef.current
      const afterCanvas = afterCanvasRef.current
      beforeCanvas.width = project.width
      beforeCanvas.height = project.height
      afterCanvas.width = project.width
      afterCanvas.height = project.height
      const beforeCtx = beforeCanvas.getContext('2d')
      const afterCtx = afterCanvas.getContext('2d')
      if (!beforeCtx || !afterCtx) return

      await renderFrame(beforeCtx, project, time, { showSafeAreas, playing, bypassColorGrade: true })
      await renderFrame(afterCtx, project, time, { showSafeAreas, playing, bypassColorGrade: false })

      const mid = Math.floor(project.width / 2)
      ctx.clearRect(0, 0, project.width, project.height)
      ctx.drawImage(beforeCanvas, 0, 0, mid, project.height, 0, 0, mid, project.height)
      ctx.drawImage(afterCanvas, mid, 0, project.width - mid, project.height, mid, 0, project.width - mid, project.height)
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(mid, 0)
      ctx.lineTo(mid, project.height)
      ctx.stroke()
      ctx.restore()
    } else {
      await renderFrame(ctx, project, time, { showSafeAreas, playing })
    }

    if (showColorScope) {
      const sample = downsampleImageData(ctx.getImageData(0, 0, project.width, project.height))
      setScopeImageData(sample)
    }
  }, [project, showSafeAreas, colorPreviewMode, showColorScope])

  useEffect(() => subscribeFrame(() => {
    const { currentTime: t, isPlaying: p } = useProjectStore.getState()
    void drawAtTime(t, p)
  }), [subscribeFrame, drawAtTime])

  useEffect(() => {
    if (!isPlaying) void drawAtTime(currentTime, false)
  }, [drawAtTime, isPlaying, currentTime])

  // ステージ内に収まるcanvas表示サイズをアスペクト比維持で算出(オーバーレイと共有するため明示計算)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const compute = () => {
      const pad = 24
      const availW = stage.clientWidth - pad
      const availH = stage.clientHeight - pad
      if (availW <= 0 || availH <= 0) return
      const aspect = project.width / project.height
      let w = availW
      let h = w / aspect
      if (h > availH) {
        h = availH
        w = h * aspect
      }
      setDisplaySize({ width: Math.floor(w), height: Math.floor(h) })
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [project.width, project.height])

  const dismissPlayHint = useCallback(() => {
    setShowPlayHint(false)
    if (coachmarkFromSample) {
      setCoachmarkFromSample(false)
      setShowExportHint(true)
    }
  }, [coachmarkFromSample, setCoachmarkFromSample, setShowExportHint, setShowPlayHint])

  // サンプルプロジェクト起動後、再生ボタンを数秒間ハイライト
  useEffect(() => {
    if (!showPlayHint) return
    const timer = setTimeout(dismissPlayHint, 5000)
    return () => clearTimeout(timer)
  }, [showPlayHint, dismissPlayHint])

  const handleTogglePlay = () => {
    if (showPlayHint) dismissPlayHint()
    togglePlay()
  }

  const stepFrame = (dir: -1 | 1) => seek(Math.max(0, Math.min(duration, currentTime + dir / fps)))

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-surface-0" data-preview-container>
      <PanelHeader title="プレビュー" icon={<Icons.Film size={14} />}>
        <IconButton
          active={colorPreviewMode === 'beforeAfter'}
          aria-pressed={colorPreviewMode === 'beforeAfter'}
          onClick={() => setColorPreviewMode(colorPreviewMode === 'beforeAfter' ? 'normal' : 'beforeAfter')}
          tooltip="Before/After 分割プレビュー"
          size="sm"
          data-testid="color-before-after-toggle"
        >
          <span className="text-[9px] font-bold">B/A</span>
        </IconButton>
        <IconButton
          active={showColorScope}
          onClick={() => setShowColorScope(!showColorScope)}
          tooltip="輝度波形スコープ"
          size="sm"
          data-testid="color-scope-toggle"
        >
          <span className="text-[9px] font-bold">SCOPE</span>
        </IconButton>
        <IconButton active={showSafeAreas} onClick={() => setShowSafeAreas(!showSafeAreas)} tooltip="セーフエリア (G)" size="sm">
          <Icons.SafeArea size={13} />
        </IconButton>
        <IconButton onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else containerRef.current?.requestFullscreen() }} tooltip="フルスクリーン (F)" size="sm">
          <Icons.Fullscreen size={13} />
        </IconButton>
      </PanelHeader>

      {/* Canvas area with checkerboard */}
      <div ref={stageRef} className="relative flex flex-1 items-center justify-center overflow-hidden" style={{ background: 'repeating-conic-gradient(#1a1a22 0% 25%, #14141a 0% 50%) 0 0 / 16px 16px' }}>
        <div className="relative" style={{ width: displaySize.width, height: displaySize.height }}>
          <canvas
            ref={canvasRef}
            width={project.width}
            height={project.height}
            className="h-full w-full rounded-sm shadow-2xl shadow-black/60 ring-1 ring-border"
          />
          <PreviewOverlay />
        </div>

        {(inPoint !== null || outPoint !== null) && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-surface-2/90 px-2.5 py-1 text-[10px] font-mono text-accent backdrop-blur-sm ring-1 ring-border">
            <span>IN {inPoint?.toFixed(1) ?? '—'}</span>
            <span className="text-text-muted">|</span>
            <span>OUT {outPoint?.toFixed(1) ?? '—'}</span>
          </div>
        )}
        {colorPreviewMode === 'beforeAfter' && (
          <div className="pointer-events-none absolute top-3 right-3 flex gap-2 text-[9px] font-semibold text-white/90">
            <span className="rounded bg-black/50 px-1.5 py-0.5">Before</span>
            <span className="rounded bg-black/50 px-1.5 py-0.5">After</span>
          </div>
        )}
        {showColorScope && (
          <div className="absolute right-3 bottom-3 left-3 max-w-xs">
            <ColorWaveformScope imageData={scopeImageData} />
          </div>
        )}
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-2 border-t border-border bg-surface-1 px-4 py-2.5">
        <IconButton onClick={() => seek(0)} tooltip="先頭へ" size="sm">
          <Icons.SkipBack size={14} />
        </IconButton>
        <IconButton onClick={() => stepFrame(-1)} tooltip="1フレーム戻る" size="sm">
          <span className="text-[10px] font-bold">-1</span>
        </IconButton>

        <div className="relative mx-1">
          {showPlayHint && (
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 animate-fade-in whitespace-nowrap rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-surface-0 shadow-lg shadow-black/40"
            >
              ▶ 再生してプレビュー
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-accent" />
            </div>
          )}
          <IconButton
            onClick={handleTogglePlay}
            variant="accent"
            size="lg"
            tooltip="再生 (Space)"
            className={showPlayHint ? 'animate-pulse ring-2 ring-accent ring-offset-2 ring-offset-surface-1' : ''}
          >
            {isPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
          </IconButton>
        </div>

        <IconButton onClick={() => stepFrame(1)} tooltip="1フレーム進む" size="sm">
          <span className="text-[10px] font-bold">+1</span>
        </IconButton>
        <IconButton onClick={() => seek(duration)} tooltip="末尾へ" size="sm">
          <Icons.SkipForward size={14} />
        </IconButton>

        <div className="mx-2 h-5 w-px bg-border" />

        <Timecode current={currentTime} total={duration} fps={fps} />

        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="ml-3 flex-1"
        />
      </div>
    </div>
  )
}
