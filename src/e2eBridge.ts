import { createChapterExportE2eProject, createChapterExportStressProject, getChapterExportStressProjectStats } from './engine/chapterExportStressProject'
import { seedPhotoGuideSlideshowStress, type PhotoGuideSlideshowStressStats } from './utils/photoGuideStressSetup'
import { seedMarkerEditStress, type MarkerEditStressStats } from './utils/markerStressSetup'
import {
  clearTextStylePresetStress,
  seedTextStylePresetStress,
  type TextStylePresetStressStats,
} from './utils/textStylePresetStressSetup'
import { loadTextStylePresets } from './persistence/textStylePresets'
import { useProjectStore } from './store/projectStore'

declare global {
  interface Window {
    __FABLE_E2E__?: {
      loadChapterExportStressProject: () => ReturnType<typeof getChapterExportStressProjectStats>
      loadChapterExportE2eProject: () => ReturnType<typeof getChapterExportStressProjectStats>
      loadPhotoGuideSlideshowStress: () => PhotoGuideSlideshowStressStats
      loadMarkerEditStress: () => MarkerEditStressStats
      loadTextStylePresetStress: () => TextStylePresetStressStats
      clearTextStylePresets: () => void
      getTextStylePresetCount: () => number
      getPlaybackTime: () => number
    }
  }
}

/** Playwright E2E 専用。本番ビルドには含めない */
export function installE2eBridge(): void {
  if (!import.meta.env.DEV) return

  window.__FABLE_E2E__ = {
    loadChapterExportStressProject: () => {
      const project = createChapterExportStressProject()
      useProjectStore.getState().loadProject(project)
      return getChapterExportStressProjectStats(project)
    },
    loadChapterExportE2eProject: () => {
      const project = createChapterExportE2eProject()
      useProjectStore.getState().loadProject(project)
      return getChapterExportStressProjectStats(project)
    },
    loadPhotoGuideSlideshowStress: () => seedPhotoGuideSlideshowStress(),
    loadMarkerEditStress: () => seedMarkerEditStress(),
    loadTextStylePresetStress: () => seedTextStylePresetStress(),
    clearTextStylePresets: () => clearTextStylePresetStress(),
    getTextStylePresetCount: () => loadTextStylePresets().length,
    getPlaybackTime: () => useProjectStore.getState().currentTime,
  }
}
