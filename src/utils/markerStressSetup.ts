import { PROJECT_TEMPLATES } from '../types/project'
import { filterChapterMarkers } from './beatMarkers'
import { STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT } from './markerEdit'
import { useProjectStore } from '../store/projectStore'

export interface MarkerEditStressStats {
  chapterMarkerCount: number
  markerIds: string[]
  projectDuration: number
}

/** 構造化ウェディング + 章マーカー編集ストレス用シード */
export function seedMarkerEditStress(): MarkerEditStressStats {
  const template = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')
  if (!template) throw new Error('structured-wedding template missing')

  const store = useProjectStore.getState()
  store.resetProject()
  store.applyTemplate(template)

  const markers = useProjectStore.getState().project.markers ?? []
  const chapterMarkers = filterChapterMarkers(markers)
  if (chapterMarkers.length !== STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT) {
    throw new Error(`expected ${STRUCTURED_WEDDING_CHAPTER_MARKER_COUNT} chapter markers, got ${chapterMarkers.length}`)
  }

  return {
    chapterMarkerCount: chapterMarkers.length,
    markerIds: chapterMarkers.map((m) => m.id),
    projectDuration: useProjectStore.getState().getProjectDuration(),
  }
}
