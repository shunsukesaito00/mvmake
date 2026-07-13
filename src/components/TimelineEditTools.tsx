import { useProjectStore } from '../store/projectStore'
import type { TimelineEditTool } from '../store/projectStore'

const TOOLS: Array<{ id: TimelineEditTool; label: string; shortcut: string; hint: string }> = [
  { id: 'selection', label: '選択', shortcut: 'V', hint: 'クリップ移動・トリム・複数選択' },
  { id: 'slip', label: 'スリップ', shortcut: 'Y', hint: '素材内オフセットをドラッグで調整' },
  { id: 'slide', label: 'スライド', shortcut: 'U', hint: '隣接クリップ連動で編集点を移動' },
]

import { isRippleInsertActive } from '../utils/rippleInsert'

export function TimelineEditTools() {
  const timelineEditTool = useProjectStore((s) => s.timelineEditTool)
  const setTimelineEditTool = useProjectStore((s) => s.setTimelineEditTool)
  const rippleDelete = useProjectStore((s) => s.rippleDelete)
  const rippleInsert = useProjectStore((s) => s.rippleInsert)
  const magneticTimeline = useProjectStore((s) => s.magneticTimeline)
  const effectiveRippleInsert = isRippleInsertActive(magneticTimeline, rippleInsert)

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-2 py-1.5">
      <span className="text-[9px] font-semibold tracking-wider text-text-muted uppercase">ツール</span>
      <div className="flex items-center gap-1">
        {TOOLS.map(({ id, label, shortcut, hint }) => {
          const active = timelineEditTool === id
          return (
            <button
              key={id}
              type="button"
              data-testid={`timeline-tool-${id}`}
              aria-pressed={active}
              title={`${label} (${shortcut}) — ${hint}`}
              onClick={() => setTimelineEditTool(id)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                active
                  ? 'bg-accent-muted text-accent ring-1 ring-accent/40'
                  : 'bg-surface-3 text-text-secondary hover:bg-surface-4 hover:text-text-primary'
              }`}
            >
              <span>{label}</span>
              <kbd className="ml-1 font-mono text-[9px] opacity-70">{shortcut}</kbd>
            </button>
          )
        })}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
      <span
        className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
          rippleDelete ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-muted'
        }`}
        title="プロジェクト設定のリップル削除/トリムに連動"
      >
        リップル {rippleDelete ? 'ON' : 'OFF'}
      </span>
      <span
        data-testid="magnetic-timeline-indicator"
        className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
          magneticTimeline ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-muted'
        }`}
        title="マグネティックタイムライン設定に連動"
      >
        磁気 {magneticTimeline ? 'ON' : 'OFF'}
      </span>
      <span
        data-testid="ripple-insert-indicator"
        className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
          effectiveRippleInsert ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-muted'
        }`}
        title="マグネティックまたはリップルインサート設定に連動"
      >
        挿入 {effectiveRippleInsert ? 'ON' : 'OFF'}
      </span>
      </div>
    </div>
  )
}
