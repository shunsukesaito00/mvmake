import { useEffect, useRef, useCallback, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { renderFrame, seekVideosToTime } from '../engine/compositor'
import { usePlayback } from '../hooks/usePlayback'
import { PanelHeader, IconButton, Timecode } from '../components/ui'
import { Icons } from '../components/icons'
import { PreviewOverlay } from '../components/PreviewOverlay'

export function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

  const project = useProjectStore((s) => s.project)
  const currentTime = useProjectStore((s) => s.currentTime)
  const isPlaying = useProjectStore((s) => s.isPlaying)
  const showSafeAreas = useProjectStore((s) => s.showSafeAreas)
  const showPlayHint = useProjectStore((s) => s.showPlayHint)
  const setShowPlayHint = useProjectStore((s) => s.setShowPlayHint)
  const inPoint = useProjectStore((s) => s.inPoint)
  const outPoint = useProjectStore((s) => s.outPoint)
  const setShowSafeAreas = useProjectStore((s) => s.setShowSafeAreas)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)

  const { togglePlay, seek } = usePlayback()
  const duration = getProjectDuration()
  const fps = project.fps

  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (!isPlaying) await seekVideosToTime(project, currentTime)
    await renderFrame(ctx, project, currentTime, { showSafeAreas })
  }, [project, currentTime, isPlaying, showSafeAreas])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    if (!isPlaying) return
    let raf: number
    const loop = () => { draw(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, draw])

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

  // サンプルプロジェクト起動後、再生ボタンを数秒間ハイライト
  useEffect(() => {
    if (!showPlayHint) return
    const timer = setTimeout(() => setShowPlayHint(false), 5000)
    return () => clearTimeout(timer)
  }, [showPlayHint, setShowPlayHint])

  const handleTogglePlay = () => {
    setShowPlayHint(false)
    togglePlay()
  }

  const stepFrame = (dir: -1 | 1) => seek(Math.max(0, Math.min(duration, currentTime + dir / fps)))

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-surface-0" data-preview-container>
      <PanelHeader title="プレビュー" icon={<Icons.Film size={14} />}>
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
