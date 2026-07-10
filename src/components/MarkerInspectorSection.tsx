import type { TimelineMarker } from '../types/project'
import { useProjectStore } from '../store/projectStore'
import { usePlayback } from '../hooks/usePlayback'
import { Btn } from './ui'

interface MarkerInspectorSectionProps {
  marker: TimelineMarker
}

export function MarkerInspectorSection({ marker }: MarkerInspectorSectionProps) {
  const fps = useProjectStore((s) => s.project.fps)
  const updateMarker = useProjectStore((s) => s.updateMarker)
  const removeMarker = useProjectStore((s) => s.removeMarker)
  const setSelectedMarkerId = useProjectStore((s) => s.setSelectedMarkerId)
  const getProjectDuration = useProjectStore((s) => s.getProjectDuration)
  const { seek } = usePlayback()

  const duration = getProjectDuration()
  const frameStep = 1 / fps

  const clampTime = (time: number) => Math.max(0, Math.min(time, duration))

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 px-3 py-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">ラベル</span>
          <input
            type="text"
            aria-label="マーカーラベル"
            value={marker.label}
            onChange={(e) => updateMarker(marker.id, { label: e.target.value }, true)}
            className="w-full rounded-lg bg-surface-3 px-2.5 py-1.5 text-xs text-text-primary ring-1 ring-border focus:ring-accent/50 focus:outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">時刻 (秒)</span>
          <input
            type="number"
            aria-label="マーカー時刻"
            min={0}
            max={duration}
            step={frameStep}
            value={Number(marker.time.toFixed(3))}
            onChange={(e) => {
              const next = clampTime(Number(e.target.value))
              if (Number.isFinite(next)) updateMarker(marker.id, { time: next }, true)
            }}
            className="w-full rounded-lg bg-surface-3 px-2.5 py-1.5 font-mono text-xs text-text-primary ring-1 ring-border focus:ring-accent/50 focus:outline-none"
          />
        </label>

        <Btn
          variant="ghost"
          className="w-full text-xs"
          onClick={() => seek(marker.time)}
        >
          再生位置へ移動
        </Btn>
      </div>

      <div className="mt-auto border-t border-border px-3 py-3">
        <Btn
          variant="danger"
          className="w-full text-xs"
          onClick={() => {
            removeMarker(marker.id)
            setSelectedMarkerId(null)
          }}
        >
          マーカーを削除
        </Btn>
      </div>
    </div>
  )
}
