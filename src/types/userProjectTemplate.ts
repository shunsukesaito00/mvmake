import type { Clip, TimelineMarker, TrackType } from './project'

/** テンプレート保存用（id / trackId を除いたクリップ） */
export type TemplateClipPayload = Omit<Clip, 'id' | 'trackId'>

export interface TemplateClipEntry {
  trackType: TrackType
  /** 同種トラック内のインデックス（映像1=0, 映像2=1） */
  trackIndex: number
  clip: TemplateClipPayload
}

export interface UserProjectTemplate {
  id: string
  label: string
  description: string
  createdAt: number
  width: number
  height: number
  fps: number
  markers: Omit<TimelineMarker, 'id'>[]
  clipEntries: TemplateClipEntry[]
}

export interface UserProjectTemplateSummary {
  id: string
  label: string
  description: string
  createdAt: number
  width: number
  height: number
  fps: number
  clipCount: number
  markerCount: number
}

export const USER_PROJECT_TEMPLATE_SCHEMA_VERSION = 1

/** `.fable-template.json` の on-disk 形式（id はインポート時に再発行） */
export interface ExportedUserProjectTemplate {
  schemaVersion: typeof USER_PROJECT_TEMPLATE_SCHEMA_VERSION
  label: string
  description: string
  width: number
  height: number
  fps: number
  markers: UserProjectTemplate['markers']
  clipEntries: UserProjectTemplate['clipEntries']
}
