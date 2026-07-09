import { useEffect, useState } from 'react'
import type { UserProjectTemplate } from '../types/userProjectTemplate'
import {
  deleteUserProjectTemplate,
  loadUserProjectTemplates,
  saveUserProjectTemplate,
} from '../persistence/userProjectTemplates'
import {
  buildUserProjectTemplate,
  formatUserProjectTemplateSummary,
  summarizeUserProjectTemplate,
} from '../utils/userProjectTemplate'
import { useProjectStore } from '../store/projectStore'
import { useToastStore } from '../store/toastStore'
import { Btn } from './ui'

interface UserProjectTemplatesSectionProps {
  mode: 'apply' | 'create'
  onCreate?: (template: UserProjectTemplate) => void
}

export function UserProjectTemplatesSection({ mode, onCreate }: UserProjectTemplatesSectionProps) {
  const [templates, setTemplates] = useState<UserProjectTemplate[]>([])
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const project = useProjectStore((s) => s.project)
  const applyUserProjectTemplate = useProjectStore((s) => s.applyUserProjectTemplate)
  const showToast = useToastStore((s) => s.showToast)

  useEffect(() => {
    setTemplates(loadUserProjectTemplates())
  }, [])

  const handleSave = () => {
    try {
      const template = buildUserProjectTemplate(project, templateName, templateDescription)
      setTemplates(saveUserProjectTemplate(template))
      setTemplateName('')
      setTemplateDescription('')
      showToast(`「${template.label}」テンプレートを保存しました`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存に失敗しました', 'error')
    }
  }

  const handleApply = (template: UserProjectTemplate) => {
    if (mode === 'create') {
      onCreate?.(template)
      return
    }
    applyUserProjectTemplate(template)
    showToast(`「${template.label}」テンプレートを適用しました`, 'success')
  }

  const handleDelete = (id: string, label: string) => {
    setTemplates(deleteUserProjectTemplate(id))
    showToast(`「${label}」テンプレートを削除しました`, 'info')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="テンプレート名"
          aria-label="テンプレート名"
          className="w-full rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
        />
        <input
          type="text"
          value={templateDescription}
          onChange={(e) => setTemplateDescription(e.target.value)}
          placeholder="説明（任意）"
          aria-label="テンプレート説明"
          className="w-full rounded-lg bg-surface-3 px-3 py-2 text-xs text-text-primary outline-none ring-1 ring-border focus:ring-accent/50"
        />
        <Btn variant="default" className="w-full text-xs" onClick={handleSave}>
          現在の構成をテンプレート保存
        </Btn>
        <p className="text-[10px] leading-relaxed text-text-muted">
          トラック配置・クリップ・マーカー・解像度/FPS を保存します。メディア素材は含まれず、配置情報のみ復元されます。
        </p>
      </div>

      {templates.length > 0 ? (
        <ul className="space-y-1.5">
          {templates.map((template) => {
            const summary = summarizeUserProjectTemplate(template)
            return (
              <li
                key={template.id}
                className="flex items-center gap-2 rounded-xl bg-surface-3 px-2.5 py-2 ring-1 ring-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">{template.label}</p>
                  {template.description ? (
                    <p className="truncate text-[10px] text-text-muted">{template.description}</p>
                  ) : null}
                  <p className="truncate font-mono text-[10px] text-text-muted">
                    {formatUserProjectTemplateSummary(summary)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={mode === 'create' ? `${template.label}で新規作成` : `${template.label}を適用`}
                  onClick={() => handleApply(template)}
                  className="shrink-0 rounded-md px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent-muted"
                >
                  {mode === 'create' ? '新規作成' : '適用'}
                </button>
                <button
                  type="button"
                  aria-label={`${template.label}を削除`}
                  onClick={() => handleDelete(template.id, template.label)}
                  className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-text-muted hover:text-danger"
                >
                  削除
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[10px] text-text-muted">保存済みテンプレートはありません</p>
      )}
    </div>
  )
}
