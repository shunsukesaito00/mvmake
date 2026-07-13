import { TEMPLATE_WORKFLOW_STEPS } from '../content/weddingWorkflowGuide'
import { useProjectStore } from '../store/projectStore'
import { Btn } from './ui'
import { Icons } from './icons'

export function TemplateWorkflowCallout() {
  const visible = useProjectStore((s) => s.showTemplateWorkflowGuide)
  const dismiss = useProjectStore((s) => s.setShowTemplateWorkflowGuide)

  if (!visible) return null

  return (
    <div
      data-testid="template-workflow-guide"
      className="mx-3 mb-2 rounded-xl border border-accent/30 bg-accent-muted/40 p-3 ring-1 ring-accent/20"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icons.Layout size={14} className="shrink-0 text-accent" />
          <p className="text-[11px] font-semibold text-text-primary">テンプレ適用後の編集の流れ</p>
        </div>
        <button
          type="button"
          aria-label="編集ガイドを閉じる"
          onClick={() => dismiss(false)}
          className="shrink-0 rounded p-0.5 text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
        >
          <Icons.X size={12} />
        </button>
      </div>
      <ol className="space-y-1.5">
        {TEMPLATE_WORKFLOW_STEPS.map((step, index) => (
          <li key={step.title} className="text-[10px] leading-relaxed text-text-secondary">
            <span className="font-semibold text-accent">{index + 1}. {step.title}</span>
            {' — '}
            {step.body}
          </li>
        ))}
      </ol>
      <Btn variant="ghost" className="mt-2 h-7 w-full text-[10px]" onClick={() => dismiss(false)}>
        了解
      </Btn>
    </div>
  )

}
