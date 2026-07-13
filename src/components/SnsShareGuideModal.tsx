import { SNS_SHARE_STEPS } from '../content/snsShareGuide'
import { useProjectStore } from '../store/projectStore'
import { Modal, Btn } from './ui'

export function SnsShareGuideModal() {
  const open = useProjectStore((s) => s.showSnsShareGuide)
  const setOpen = useProjectStore((s) => s.setShowSnsShareGuide)
  const projectName = useProjectStore((s) => s.project.name)

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleNativeShare = async () => {
    if (!canNativeShare) return
    try {
      await navigator.share({
        title: projectName || 'FABLE 動画',
        text: 'FABLE で作成した動画を SNS に投稿しましょう。',
      })
    } catch {
      // ユーザーが共有をキャンセルした場合は無視
    }
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="SNS 共有の案内" width="w-[440px]">
      <div data-testid="sns-share-guide-modal" className="max-h-[50vh] space-y-3 overflow-y-auto">
        <p className="text-[11px] leading-relaxed text-text-secondary">
          9:16・軽量品質で書き出した MP4 を、次の手順で SNS に投稿できます。
        </p>
        <ol className="space-y-2">
          {SNS_SHARE_STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg bg-surface-3 px-3 py-2">
              <p className="text-xs font-semibold text-accent">{index + 1}. {step.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
      {canNativeShare && (
        <Btn variant="default" className="mt-3 w-full text-xs" onClick={() => void handleNativeShare()}>
          共有メニューを開く
        </Btn>
      )}
      <Btn variant="accent" className="mt-2 w-full" onClick={() => setOpen(false)}>
        閉じる
      </Btn>
    </Modal>
  )
}
