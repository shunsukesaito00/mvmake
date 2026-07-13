import { ProgressBar } from './ui'
import {
  formatChapterQueueItemStatus,
  getChapterQueueSummary,
  type ChapterExportQueue,
} from '../utils/exportChapterQueue'

const statusClass: Record<string, string> = {
  pending: 'text-text-muted',
  running: 'text-accent',
  done: 'text-emerald-400',
  failed: 'text-red-400',
}

export function ExportChapterQueuePanel({ queue }: { queue: ChapterExportQueue }) {
  return (
    <div data-testid="export-chapter-queue" className="rounded-lg bg-surface-3 px-3 py-2 ring-1 ring-border">
      <p className="text-center text-[10px] font-medium text-text-primary">{getChapterQueueSummary(queue)}</p>
      <ul className="mt-2 space-y-1.5" aria-label="章書き出しキュー">
        {queue.items.map((item) => (
          <li key={item.entry.filename} data-status={item.status} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="truncate text-text-secondary">{item.entry.label}</span>
              <span
                data-testid="export-chapter-queue-status"
                className={`shrink-0 font-medium ${statusClass[item.status] ?? 'text-text-muted'}`}
              >
                {formatChapterQueueItemStatus(item.status)}
                {item.status === 'running' && item.progress != null
                  ? ` ${Math.round(item.progress * 100)}%`
                  : ''}
              </span>
            </div>
            {item.status === 'running' && item.progress != null && (
              <ProgressBar progress={item.progress} />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
