import { useMemo } from 'react'
import { downloadBlob } from '../persistence/projectFile'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import {
  buildSrtFromTextClips,
  buildVttFromTextClips,
  collectTextClipsFromTracks,
  formatSrtExportSummary,
  subtitleFileBaseName,
  textClipsToSrtCues,
} from '../utils/srtExporter'
import { Btn } from './ui'
import { Icons } from './icons'

export function SrtExportSection() {
  const tracks = useProjectStore((s) => s.project.tracks)
  const projectName = useProjectStore((s) => s.project.name)
  const showToast = useToastStore((s) => s.showToast)

  const exportableCount = useMemo(() => textClipsToSrtCues(collectTextClipsFromTracks(tracks)).length, [tracks])

  const handleExport = (format: 'srt' | 'vtt') => {
    const clips = collectTextClipsFromTracks(tracks)
    const cues = textClipsToSrtCues(clips)
    if (cues.length === 0) {
      showToast('エクスポートできるテキストクリップがありません', 'error')
      return
    }

    const content = format === 'srt' ? buildSrtFromTextClips(clips) : buildVttFromTextClips(clips)
    const filename = `${subtitleFileBaseName(projectName)}.${format}`
    downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename)
    showToast(formatSrtExportSummary(cues.length, format), 'success')
  }

  return (
    <div className="mb-4 rounded-xl bg-surface-3 p-3 ring-1 ring-border">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icons.Export size={14} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-text-primary">字幕エクスポート</p>
          <p className="text-[10px] text-text-muted">
            テキストクリップから .srt / .vtt をダウンロード
            {exportableCount > 0 ? `（${exportableCount}件）` : ''}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Btn
          variant="ghost"
          className="text-xs"
          disabled={exportableCount === 0}
          onClick={() => handleExport('srt')}
        >
          SRT を保存
        </Btn>
        <Btn
          variant="ghost"
          className="text-xs"
          disabled={exportableCount === 0}
          onClick={() => handleExport('vtt')}
        >
          VTT を保存
        </Btn>
      </div>
    </div>
  )
}
