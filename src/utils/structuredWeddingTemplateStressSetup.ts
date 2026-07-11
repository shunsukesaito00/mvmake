import { PROJECT_TEMPLATES } from '../types/project'
import { filterChapterMarkers } from './beatMarkers'
import { STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT } from './markerEdit'
import { isPhotoGuideClip } from './photoGuide'
import { useProjectStore } from '../store/projectStore'

export const STRUCTURED_WEDDING_TEXT_CLIP_COUNT = 3
export const STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT = 8
export const STRUCTURED_WEDDING_TOTAL_CLIP_COUNT = 11

export const STRUCTURED_WEDDING_CHAPTER_LABELS = [
  'オープニング',
  '新郎プロフィール',
  '新婦プロフィール',
  '二人の歩み',
  'エンディング',
] as const

export interface StructuredWeddingTemplateStressStats {
  templateLabel: string
  projectName: string
  textClipCount: number
  photoGuideCount: number
  markerCount: number
  totalClipCount: number
  chapterLabels: string[]
  firstPhotoGuideLabel: string
}

export function getStructuredWeddingTemplateStressStats(): StructuredWeddingTemplateStressStats {
  const project = useProjectStore.getState().project
  const textTrack = project.tracks.find((t) => t.type === 'text')
  const clips = textTrack?.clips ?? []
  const photoGuides = clips.filter((c) => isPhotoGuideClip(c))
  const textClips = clips.filter((c) => c.type === 'text' && !isPhotoGuideClip(c))
  const chapterMarkers = filterChapterMarkers(project.markers ?? [])

  return {
    templateLabel: '結婚式フル構成',
    projectName: '結婚式ムービー',
    textClipCount: textClips.length,
    photoGuideCount: photoGuides.length,
    markerCount: chapterMarkers.length,
    totalClipCount: clips.length,
    chapterLabels: chapterMarkers.map((m) => m.label),
    firstPhotoGuideLabel: '写真: 新郎 幼少期',
  }
}

/** 構造化ウェディングテンプレートを適用したストレスプロジェクトを投入 */
export function seedStructuredWeddingTemplateStress(): StructuredWeddingTemplateStressStats {
  const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')
  if (!template) throw new Error('structured-wedding template missing')

  const store = useProjectStore.getState()
  store.resetProject()
  store.applyTemplate(template)

  const stats = getStructuredWeddingTemplateStressStats()
  if (stats.textClipCount !== STRUCTURED_WEDDING_TEXT_CLIP_COUNT) {
    throw new Error(`expected ${STRUCTURED_WEDDING_TEXT_CLIP_COUNT} text clips, got ${stats.textClipCount}`)
  }
  if (stats.photoGuideCount !== STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT) {
    throw new Error(`expected ${STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT} photo guides, got ${stats.photoGuideCount}`)
  }
  if (stats.markerCount !== STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT) {
    throw new Error(`expected ${STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT} markers, got ${stats.markerCount}`)
  }
  if (stats.totalClipCount !== STRUCTURED_WEDDING_TOTAL_CLIP_COUNT) {
    throw new Error(`expected ${STRUCTURED_WEDDING_TOTAL_CLIP_COUNT} clips, got ${stats.totalClipCount}`)
  }

  return stats
}
