import { useEffect, useState } from 'react'
import { MediaPanel } from '../panels/MediaPanel'
import { PreviewPanel } from '../panels/PreviewPanel'
import { InspectorPanel } from '../panels/InspectorPanel'
import { TimelinePanel } from '../panels/TimelinePanel'
import { MixerPanel } from '../panels/MixerPanel'
import { Toolbar } from '../components/Toolbar'
import { HelpModal } from '../components/HelpModal'
import { SnsShareGuideModal } from '../components/SnsShareGuideModal'
import { ProjectSettingsModal } from '../components/ProjectSettingsModal'
import { usePanelSizes, startResize } from '../hooks/usePanelSize'

function ResizeHandle({ axis, onPointerDown }: { axis: 'x' | 'y'; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onPointerDown}
      className={`group relative z-30 shrink-0 ${axis === 'x' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}`}
    >
      <div
        className={`absolute bg-transparent transition-colors group-hover:bg-accent/50 group-active:bg-accent ${
          axis === 'x' ? 'inset-y-0 -left-0.5 w-2' : 'inset-x-0 -top-0.5 h-2'
        }`}
      />
    </div>
  )
}

export function AppLayout() {
  const [showHelp, setShowHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMixer, setShowMixer] = useState(true)
  const { sizes, update } = usePanelSizes()

  // 「?」キーでショートカット一覧をトグル表示
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '?') setShowHelp((v) => !v)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <div className="flex h-full flex-col bg-surface-0">
        <Toolbar
          onOpenHelp={() => setShowHelp(true)}
          onOpenSettings={() => setShowSettings(true)}
          showMixer={showMixer}
          onToggleMixer={() => setShowMixer((v) => !v)}
        />

        <div className="flex min-h-0 flex-1">
          {/* Left: Media Bin */}
          <aside className="flex shrink-0 flex-col border-r border-border panel-glass" style={{ width: sizes.leftWidth }}>
            <MediaPanel />
          </aside>

          <ResizeHandle axis="x" onPointerDown={(e) => startResize(e, 'x', sizes.leftWidth, 1, (v) => update('leftWidth', v))} />

          {/* Center + Right + Timeline */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1">
              {/* Preview */}
              <main className="flex min-w-0 flex-1 flex-col border-r border-border">
                <PreviewPanel />
              </main>

              <ResizeHandle axis="x" onPointerDown={(e) => startResize(e, 'x', sizes.rightWidth, -1, (v) => update('rightWidth', v))} />

              {/* Inspector */}
              <aside className="flex shrink-0 flex-col panel-glass" style={{ width: sizes.rightWidth }}>
                <InspectorPanel />
              </aside>
            </div>

            <ResizeHandle axis="y" onPointerDown={(e) => startResize(e, 'y', sizes.timelineHeight, -1, (v) => update('timelineHeight', v))} />

            {showMixer && (
              <div className="shrink-0 border-t border-border panel-glass" style={{ height: 132 }}>
                <MixerPanel />
              </div>
            )}

            {/* Timeline */}
            <footer className="shrink-0 border-t border-border panel-glass" style={{ height: sizes.timelineHeight }}>
              <TimelinePanel />
            </footer>
          </div>
        </div>
      </div>

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
      <SnsShareGuideModal />
      <ProjectSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
