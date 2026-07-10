import { Modal, Btn } from './ui'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'Space', action: '再生 / 一時停止' },
  { key: 'J / K / L', action: '1秒戻る / 停止 / 再生（Shift+J: 1フレーム戻る）' },
  { key: '← / →', action: 'フレーム送り' },
  { key: 'Shift + ← / →', action: '1秒送り' },
  { key: 'S', action: '再生位置で分割' },
  { key: 'I / O', action: 'In点 / Out点を設定' },
  { key: 'M', action: '章マーカー追加' },
  { key: 'Shift + M', action: 'ビートマーカー追加' },
  { key: 'Cmd+C / Cmd+V', action: 'コピー / ペースト' },
  { key: 'Cmd+D', action: 'クリップ複製' },
  { key: 'Alt + ドラッグ', action: 'クリップを複製して移動' },
  { key: 'Cmd+Z / Cmd+Shift+Z', action: '元に戻す / やり直し' },
  { key: 'Cmd+S', action: '保存' },
  { key: 'Delete', action: 'クリップ削除（リップル）' },
  { key: 'Escape', action: '選択解除' },
  { key: 'F', action: 'フルスクリーン' },
  { key: 'G', action: 'セーフエリア表示切替' },
  { key: 'Z', action: '選択クリップへズーム' },
  { key: '?', action: 'このショートカット一覧を表示' },
]

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="キーボードショートカット" width="w-[420px]">
      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
        {SHORTCUTS.map(({ key, action }) => (
          <div key={key} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-3">
            <kbd className="rounded-md bg-surface-4 px-2 py-0.5 font-mono text-[11px] text-accent ring-1 ring-border">{key}</kbd>
            <span className="text-sm text-text-secondary">{action}</span>
          </div>
        ))}
      </div>
      <Btn variant="ghost" className="mt-4 w-full" onClick={onClose}>
        閉じる
      </Btn>
    </Modal>
  )
}
