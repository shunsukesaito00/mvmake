import { loadUserProjectTemplates } from '../persistence/userProjectTemplates'
import {
  buildExportedUserProjectTemplate,
  buildUserProjectTemplateExportFilename,
  serializeExportedUserProjectTemplate,
} from './userProjectTemplateExport'
import {
  seedUserProjectTemplateStress,
  type UserProjectTemplateStressStats,
} from './userProjectTemplateStressSetup'

export interface UserProjectTemplateExportStressStats extends UserProjectTemplateStressStats {
  exportJson: string
  exportFilename: string
}

/** ストレステンプレートの `.fable-template.json` 相当 JSON を生成 */
export function buildUserProjectTemplateExportStressPayload(): UserProjectTemplateExportStressStats {
  const base = seedUserProjectTemplateStress()
  const template = loadUserProjectTemplates().find((t) => t.id === base.templateId)
  if (!template) throw new Error('stress template not found after seed')

  const exportJson = serializeExportedUserProjectTemplate(buildExportedUserProjectTemplate(template))
  return {
    ...base,
    exportJson,
    exportFilename: buildUserProjectTemplateExportFilename(template.label),
  }
}

export function seedUserProjectTemplateExportStress(): UserProjectTemplateExportStressStats {
  return buildUserProjectTemplateExportStressPayload()
}
