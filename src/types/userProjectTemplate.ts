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
