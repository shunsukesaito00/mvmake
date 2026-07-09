import { useRef } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { formatSrtImportSummary } from '../utils/srtParser'
import { Btn } from './ui'
import { Icons } from './icons'

export function SrtImportSection() {
  const inputRef = useRef<HTMLInputElement>(null)
  const importSrtSubtitles = useProjectStore((s) => s.importSrtSubtitles)
  const showToast = useToastStore((s) => s.showToast)

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return
    try {
      const content = await file.text()
      const count = importSrtSubtitles(content)
      if (count === 0) {
        showToast('有効な字幕が見つかりませんでした', 'error')
        return
      }
      showToast(formatSrtImportSummary(count), 'success')
    } catch {
      showToast('SRT ファイルの読み込みに失敗しました', 'error')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="mb-4 rounded-xl bg-surface-3 p-3 ring-1 ring-border">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icons.Type size={14} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-text-primary">SRT 字幕インポート</p>
          <p className="text-[10px] text-text-muted">.srt ファイルからテキストクリップを一括生成</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".srt,text/plain"
        aria-label="SRT 字幕ファイル"
        className="hidden"
        onChange={(e) => void handleFileChange(e.target.files?.[0])}
      />
      <Btn variant="accent" className="w-full text-xs" onClick={() => inputRef.current?.click()}>
        SRT 字幕をインポート
      </Btn>
    </div>
  )
}
