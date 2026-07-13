import { Modal, Btn } from './ui'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'Space', action: '再生 / 一時停止' },
  { key: 'J / K / L', action: '1秒戻る / 停止 / 再生（Shift+J: 1フレーム戻る・L連打/長押しで 2x/4x 順再生）' },
  { key: '← / →', action: 'フレーム送り' },
  { key: 'Shift + ← / →', action: '1秒送り' },
  { key: 'S', action: '再生位置で分割' },
  { key: 'I / O', action: 'In点 / Out点を設定' },
  { key: 'M', action: '章マーカー追加' },
  { key: 'Shift + M', action: 'ビートマーカー追加' },
  { key: 'Cmd+C / Cmd+V', action: 'コピー / ペースト' },
  { key: 'Cmd+D', action: '選択クリップを複製（複数選択時は一括）' },
  { key: 'Shift + クリック', action: 'クリップを追加選択 / 解除' },
  { key: 'Cmd+A', action: 'アクティブトラック内の全クリップを選択' },
  { key: 'Alt + ドラッグ', action: 'クリップを複製して移動（選択ツール時）' },
  { key: 'V / Y / U', action: '編集ツール切替（選択 / スリップ / スライド）' },
  { key: 'タイムラインツールバー', action: '選択・スリップ・スライドをボタンで切替（リップル ON/OFF 表示）' },
  { key: '編集点ハンドル', action: '選択ツール時、隣接クリップ境界をドラッグしてローリング編集（前後同時トリム）' },
  { key: 'プロジェクト設定', action: 'リップル削除/トリム・リップルインサート（配置・ペースト時の後続シフト）' },
  { key: ', / .', action: 'スリップ編集（素材内オフセット・Shift:1秒）' },
  { key: '[ / ]', action: 'スライド編集（隣接クリップ連動・Shift:1秒）' },
  { key: '; / \'', action: 'キーフレーム前後ジャンプ（変形・音量・速度を統合）' },
  { key: 'Ctrl + ドラッグ', action: 'スリップ編集（選択ツール時の補助）' },
  { key: 'Shift + ドラッグ', action: 'スライド編集（選択ツール時の補助）' },
  { key: 'Cmd+Z / Cmd+Shift+Z', action: '元に戻す / やり直し' },
  { key: 'Cmd+S', action: '保存' },
  { key: 'Delete', action: '選択クリップ削除（複数選択時は一括・リップル）' },
  { key: 'Escape', action: '選択解除' },
  { key: 'F', action: 'フルスクリーン' },
  { key: 'G', action: 'セーフエリア表示切替' },
  { key: 'ミキサー', action: 'ツールバーの音符アイコンでミキサー表示切替（フェーダー・VU・ソロ）' },
  { key: 'タイムライン +', action: 'トラック追加メニュー（映像 / テキスト / オーディオ）' },
  { key: 'トラック名ダブルクリック', action: 'トラック名の変更' },
  { key: 'トラック下辺ドラッグ', action: 'レーン高さのリサイズ（設定はブラウザに保存）' },
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
