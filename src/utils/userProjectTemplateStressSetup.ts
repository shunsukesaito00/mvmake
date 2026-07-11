import { PROJECT_TEMPLATES } from '../types/project'
import {
  loadUserProjectTemplates,
  replaceUserProjectTemplates,
} from '../persistence/userProjectTemplates'
import { buildUserProjectTemplate } from './userProjectTemplate'
import { useProjectStore } from '../store/projectStore'

export const USER_PROJECT_TEMPLATE_STRESS_LABEL = 'ストレス検証テンプレ'

export interface UserProjectTemplateStressStats {
  templateId: string
  templateLabel: string
  clipCount: number
  markerCount: number
  width: number
  height: number
  fps: number
  savedCount: number
}

export function clearUserProjectTemplateStress(): void {
  replaceUserProjectTemplates([])
}

/** 構造化ウェディング構成を保存済みユーザーテンプレートとして投入 */
export function seedUserProjectTemplateStress(): UserProjectTemplateStressStats {
  const builtin = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')
  if (!builtin) throw new Error('structured-wedding template missing')

  const store = useProjectStore.getState()
  store.resetProject()
  store.applyTemplate(builtin)

  const userTemplate = buildUserProjectTemplate(
    useProjectStore.getState().project,
    USER_PROJECT_TEMPLATE_STRESS_LABEL,
    'E2E/ストレス検証用',
  )
  replaceUserProjectTemplates([userTemplate])

  return {
    templateId: userTemplate.id,
    templateLabel: userTemplate.label,
    clipCount: userTemplate.clipEntries.length,
    markerCount: userTemplate.markers.length,
    width: userTemplate.width,
    height: userTemplate.height,
    fps: userTemplate.fps,
    savedCount: loadUserProjectTemplates().length,
  }
}
