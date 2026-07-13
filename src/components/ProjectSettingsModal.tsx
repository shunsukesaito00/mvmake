import { useEffect, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { RESOLUTION_PRESETS } from '../types/project'
import type { ProjectSettingsPreset } from '../types/projectSettingsPreset'
import { Modal, Btn, Slider } from './ui'
import { ProjectSettingsPresetsSection } from './ProjectSettingsPresetsSection'

interface ProjectSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function ProjectSettingsModal({ open, onClose }: ProjectSettingsModalProps) {
  const project = useProjectStore((s) => s.project)
  const setProjectSettings = useProjectStore((s) => s.setProjectSettings)
  const applyProjectSettingsPreset = useProjectStore((s) => s.applyProjectSettingsPreset)
  const rippleDelete = useProjectStore((s) => s.rippleDelete)
  const setRippleDelete = useProjectStore((s) => s.setRippleDelete)
  const rippleInsert = useProjectStore((s) => s.rippleInsert)
  const magneticTimeline = useProjectStore((s) => s.magneticTimeline)
  const setMagneticTimeline = useProjectStore((s) => s.setMagneticTimeline)
  const setRippleInsert = useProjectStore((s) => s.setRippleInsert)
  const loopPlayback = useProjectStore((s) => s.loopPlayback)
  const setLoopPlayback = useProjectStore((s) => s.setLoopPlayback)

  const [fps, setFps] = useState(project.fps)

  useEffect(() => {
    if (open) setFps(project.fps)
  }, [open, project.fps])

  const handleSave = () => {
    setProjectSettings({ fps })
    onClose()
  }

  const handleApplyPreset = (preset: ProjectSettingsPreset) => {
    applyProjectSettingsPreset(preset)
    setFps(preset.fps)
  }

  return (
    <Modal open={open} onClose={onClose} title="プロジェクト設定">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-accent uppercase">解像度</p>
          <div className="space-y-1.5">
            {RESOLUTION_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProjectSettings({ width: p.width, height: p.height })}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left ring-1 transition-all ${
                  project.width === p.width && project.height === p.height
                    ? 'bg-accent-muted text-text-primary ring-accent/40'
                    : 'bg-surface-3 text-text-secondary ring-border hover:ring-accent/30'
                }`}
              >
                <span className="text-sm">{p.label}</span>
                <span className="font-mono text-[10px] text-text-muted">{p.width}×{p.height}</span>
              </button>
            ))}
          </div>
        </div>

        <Slider label="FPS" value={fps} min={24} max={60} step={1} onChange={setFps} format={(v) => `${v} fps`} />

        <div className="space-y-3">
          <label className="flex items-center gap-2.5 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={magneticTimeline}
              onChange={(e) => setMagneticTimeline(e.target.checked)}
              className="accent-accent"
              data-testid="magnetic-timeline-toggle"
            />
            マグネティックタイムライン（ギャップレス挿入を既定 ON）
          </label>
          <label className="flex items-center gap-2.5 text-sm text-text-secondary">
            <input type="checkbox" checked={rippleDelete} onChange={(e) => setRippleDelete(e.target.checked)} className="accent-accent" />
            リップル編集（削除・トリム）
          </label>
          <label className={`flex items-center gap-2.5 text-sm ${magneticTimeline ? 'text-text-muted' : 'text-text-secondary'}`}>
            <input
              type="checkbox"
              checked={rippleInsert || magneticTimeline}
              disabled={magneticTimeline}
              onChange={(e) => setRippleInsert(e.target.checked)}
              className="accent-accent"
              data-testid="ripple-insert-toggle"
            />
            リップルインサート（マグネティック OFF 時）
          </label>
          <label className="flex items-center gap-2.5 text-sm text-text-secondary">
            <input type="checkbox" checked={loopPlayback} onChange={(e) => setLoopPlayback(e.target.checked)} className="accent-accent" />
            In/Out点間をループ再生
          </label>
        </div>

        <ProjectSettingsPresetsSection
          settings={{
            width: project.width,
            height: project.height,
            fps,
            rippleDelete,
            loopPlayback,
          }}
          onApply={handleApplyPreset}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <Btn variant="accent" className="flex-1" onClick={handleSave}>適用</Btn>
        <Btn variant="ghost" className="flex-1" onClick={onClose}>キャンセル</Btn>
      </div>
    </Modal>
  )
}
