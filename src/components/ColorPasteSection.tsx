import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'

interface Props {
  clipId: string
}

export function ColorPasteSection({ clipId }: Props) {
  const copyClipColor = useProjectStore((s) => s.copyClipColor)
  const hasClipboard = useProjectStore((s) => s.colorClipboard !== null)
  const showToast = useToastStore((s) => s.showToast)

  const handleCopy = () => {
    if (copyClipColor(clipId)) {
      showToast('色調をコピーしました', 'success')
      return
    }
    showToast('色調をコピーできません', 'error')
  }

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      <Btn
        variant="default"
        className="text-[10px] px-2 py-1"
        data-testid="copy-clip-color"
        onClick={handleCopy}
      >
        色調をコピー
      </Btn>
      {hasClipboard && (
        <p className="w-full text-[10px] text-text-muted" data-testid="color-clipboard-ready">
          色調をコピー済み。複数クリップを選択して「色調をペースト」できます。
        </p>
      )}
    </div>
  )
}

export function ColorPasteMultiSection() {
  const colorClipboard = useProjectStore((s) => s.colorClipboard)
  const selectedClipId = useProjectStore((s) => s.selectedClipId)
  const selectedClipIds = useProjectStore((s) => s.selectedClipIds)
  const pasteColorToSelectedClips = useProjectStore((s) => s.pasteColorToSelectedClips)
  const applyPrimaryClipColorToSelection = useProjectStore((s) => s.applyPrimaryClipColorToSelection)
  const showToast = useToastStore((s) => s.showToast)

  const canApplyPrimary = selectedClipIds.length > 1 && selectedClipId !== null

  const handlePaste = () => {
    const count = pasteColorToSelectedClips()
    if (count > 0) {
      showToast(`${count}件のクリップへ色調をペーストしました`, 'success')
      return
    }
    showToast('色調をペーストできるクリップがありません', 'error')
  }

  const handleApplyPrimary = () => {
    const count = applyPrimaryClipColorToSelection()
    if (count > 0) {
      showToast(`先頭クリップの色調を${count}件へ適用しました`, 'success')
      return
    }
    showToast('色調を適用できるクリップがありません', 'error')
  }

  return (
    <div className="flex flex-col gap-2">
      <Btn
        variant="default"
        className="text-xs"
        data-testid="paste-clip-color"
        disabled={!colorClipboard}
        onClick={handlePaste}
      >
        色調をペースト
      </Btn>
      {canApplyPrimary && (
        <Btn
          variant="ghost"
          className="text-xs"
          data-testid="apply-primary-clip-color"
          onClick={handleApplyPrimary}
        >
          先頭クリップの色調を他へ適用
        </Btn>
      )}
    </div>
  )
}
