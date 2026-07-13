import { useState } from 'react'
import { TEMPLATE_WORKFLOW_STEPS, CHAPTER_MARKER_GUIDE } from '../content/weddingWorkflowGuide'
import { SNS_SHARE_STEPS } from '../content/snsShareGuide'
import { Modal, Btn } from './ui'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

type HelpTab = 'shortcuts' | 'workflow'

const SHORTCUTS = [
  { key: 'Space', action: '再生 / 一時停止' },
  { key: 'J / K / L', action: '逆シャトル（J連打/長押しで -2x/-4x・プレビュー限定）/ 停止 / 順シャトル（L連打/長押しで 2x/4x）' },
  { key: '← / →', action: 'フレーム送り' },
  { key: 'Shift + ← / →', action: '1秒送り' },
  { key: 'S', action: '再生位置で分割' },
  { key: 'I / O', action: 'In点 / Out点を設定' },
  { key: 'M', action: '章マーカー追加（各章の始まり・書き出し区間に使用）' },
  { key: 'Shift + M', action: 'ビートマーカー追加' },
  { key: 'Cmd+C / Cmd+V', action: 'コピー / ペースト' },
  { key: 'Cmd+D', action: '選択クリップを複製（複数選択時は一括）' },
  { key: 'Shift + クリック', action: 'クリップを追加選択 / 解除' },
  { key: 'Cmd+A', action: 'アクティブトラック内の全クリップを選択' },
  { key: 'Alt + ドラッグ', action: 'クリップを複製して移動（選択ツール時）' },
  { key: 'V / Y / U', action: '編集ツール切替（選択 / スリップ / スライド）' },
  { key: 'タイムラインツールバー', action: '選択・スリップ・スライドをボタンで切替（磁気・リップル ON/OFF 表示）' },
  { key: '編集点ハンドル', action: '選択ツール時、隣接クリップ境界をドラッグしてローリング編集（前後同時トリム）' },
  { key: '動画音声リンク', action: 'インスペクターで内蔵音声の切り離し/リンク・ナレーション配置の準備' },
  { key: '色調のコピー/ペースト', action: 'インスペクターでルック・LUT・カーブをコピーし、複数選択へ一括ペースト' },
  { key: '速度オーディオ連動', action: '再生速度セクションで内蔵音声の速度連動 ON/OFF（プレビュー・書き出し整合）' },
  { key: 'プロジェクト設定', action: 'マグネティックタイムライン（ギャップレス挿入既定）・リップル削除/トリム・リップルインサート' },
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
  { key: '?', action: 'このヘルプを表示' },
]

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [tab, setTab] = useState<HelpTab>('shortcuts')

  return (
    <Modal open={open} onClose={onClose} title="ヘルプ" width="w-[460px]">
      <div className="mb-3 flex gap-1 rounded-lg bg-surface-3 p-1">
        <button
          type="button"
          data-testid="help-shortcuts-tab"
          onClick={() => setTab('shortcuts')}
          className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
            tab === 'shortcuts' ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          ショートカット
        </button>
        <button
          type="button"
          data-testid="help-workflow-tab"
          onClick={() => setTab('workflow')}
          className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
            tab === 'workflow' ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          婚礼制作フロー
        </button>
      </div>

      {tab === 'shortcuts' ? (
        <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
          {SHORTCUTS.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-3">
              <kbd className="rounded-md bg-surface-4 px-2 py-0.5 font-mono text-[11px] text-accent ring-1 ring-border">{key}</kbd>
              <span className="ml-3 flex-1 text-right text-sm text-text-secondary">{action}</span>
            </div>
          ))}
        </div>
      ) : (
        <div data-testid="help-workflow-content" className="max-h-[50vh] space-y-4 overflow-y-auto">
          <div>
            <p className="text-[11px] font-semibold text-text-primary">テンプレ適用後の編集導線</p>
            <ol className="mt-2 space-y-2">
              {TEMPLATE_WORKFLOW_STEPS.map((step, index) => (
                <li key={step.title} className="rounded-lg bg-surface-3 px-3 py-2">
                  <p className="text-xs font-semibold text-accent">{index + 1}. {step.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-border bg-surface-3/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-text-primary">章マーカーとは</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary">{CHAPTER_MARKER_GUIDE}</p>
          </div>
          <div data-testid="help-sns-share-content" className="rounded-lg border border-accent/20 bg-accent-muted/20 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-text-primary">SNS即配信（婚礼本編とは別）</p>
            <p className="mt-1.5 text-[10px] text-text-muted">ツールバー「SNS配信」または書き出しダイアログから 9:16・軽量で書き出し、共有案内に従って投稿します。</p>
            <ol className="mt-2 space-y-1.5">
              {SNS_SHARE_STEPS.map((step, index) => (
                <li key={step.title} className="text-[10px] leading-relaxed text-text-secondary">
                  <span className="font-semibold text-accent">{index + 1}. {step.title}</span>
                  {' — '}
                  {step.body}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <Btn variant="ghost" className="mt-4 w-full" onClick={onClose}>
        閉じる
      </Btn>
    </Modal>
  )
}
