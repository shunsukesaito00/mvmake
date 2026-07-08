import { useEffect, useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { createDemoProject } from '../engine/demoProject'
import { saveProject } from '../persistence/db'
import { Btn } from './ui'
import { Icons } from './icons'

const STORAGE_KEY = 'fable-onboarded'

const STEPS = [
  {
    icon: Icons.Upload,
    title: 'メディアを追加',
    description: '左パネルに動画・写真・BGMをドラッグ&ドロップ。写真を複数選択すればスライドショーも一括作成できます。',
  },
  {
    icon: Icons.Grid,
    title: 'タイムラインで編集',
    description: 'メディアを下のタイムラインへドラッグして配置。トリム・分割・トランジション・テキストで演出を加えます。',
  },
  {
    icon: Icons.Export,
    title: 'MP4で書き出し',
    description: '右上の「書き出し」から品質と解像度を選ぶだけ。すべてブラウザ内で処理され、外部にアップロードされません。',
  },
]

export function OnboardingModal() {
  const restoreReady = useProjectStore((s) => s.restoreReady)
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [creatingDemo, setCreatingDemo] = useState(false)

  useEffect(() => {
    if (!restoreReady) return
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // localStorage が使えない環境ではガイドを出さない
    }
  }, [restoreReady])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // 保存できなくても閉じる操作は続行
    }
    setVisible(false)
  }

  const openDemo = async () => {
    if (creatingDemo) return
    setCreatingDemo(true)
    const showToast = useToastStore.getState().showToast
    try {
      const demo = await createDemoProject()
      await saveProject(demo).catch(() => {
        // 保存に失敗しても編集体験は開始できる
      })
      useProjectStore.getState().loadProject(demo)
      dismiss()
      showToast('サンプルプロジェクトを開きました。再生ボタンでプレビューできます', 'success')
    } catch (err) {
      console.error(err)
      showToast('サンプルの作成に失敗しました', 'error')
    } finally {
      setCreatingDemo(false)
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-[420px] rounded-2xl border border-border bg-surface-2 p-8 shadow-2xl shadow-black/40 animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-amber-700">
            <span className="text-xs font-black text-surface-0">F</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">FABLE へようこそ</h2>
            <p className="text-[11px] text-text-muted">結婚式ムービーを3ステップで</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted text-accent ring-1 ring-accent/30">
            <Icon size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              <span className="mr-2 text-accent">{step + 1}.</span>
              {current.title}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{current.description}</p>
          </div>
        </div>

        <div className="my-5 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : 'w-1.5 bg-surface-4 hover:bg-border-light'}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Btn variant="ghost" className="flex-1 text-xs" onClick={dismiss}>
            スキップ
          </Btn>
          <Btn
            variant="accent"
            className="flex-1 text-xs"
            onClick={() => (isLast ? dismiss() : setStep(step + 1))}
          >
            {isLast ? '始める' : '次へ'}
          </Btn>
        </div>

        <button
          onClick={openDemo}
          disabled={creatingDemo}
          className="mt-3 w-full rounded-lg border border-dashed border-border-light px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent/50 hover:bg-accent-muted hover:text-accent disabled:opacity-50"
        >
          {creatingDemo ? 'サンプルを準備中...' : 'サンプルプロジェクトを開いて試す'}
        </button>
      </div>
    </div>
  )
}
