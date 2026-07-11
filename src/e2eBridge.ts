import { createChapterExportE2eProject, createChapterExportStressProject, getChapterExportStressProjectStats } from './engine/chapterExportStressProject'
import { seedPhotoGuideSlideshowStress, type PhotoGuideSlideshowStressStats } from './utils/photoGuideStressSetup'
import { seedMarkerEditStress, type MarkerEditStressStats } from './utils/markerStressSetup'
import {
  clearTextStylePresetStress,
  seedTextStylePresetStress,
  type TextStylePresetStressStats,
} from './utils/textStylePresetStressSetup'
import { seedMediaListStress, type MediaListStressStats } from './utils/mediaListStressSetup'
import {
  seedBatchTransitionStress,
  type BatchTransitionStressStats,
} from './utils/batchTransitionStressSetup'
import {
  seedBatchTransitionRemovalStress,
  type BatchTransitionRemovalStressStats,
} from './utils/batchTransitionRemovalStressSetup'
import {
  seedMediaReplaceStress,
  type MediaReplaceStressStats,
} from './utils/mediaReplaceStressSetup'
import {
  clearUserProjectTemplateStress,
  seedUserProjectTemplateStress,
  type UserProjectTemplateStressStats,
} from './utils/userProjectTemplateStressSetup'
import {
  seedUserProjectTemplateExportStress,
  type UserProjectTemplateExportStressStats,
} from './utils/userProjectTemplateExportStressSetup'
import {
  clearProjectSettingsPresetStress,
  seedProjectSettingsPresetStress,
  type ProjectSettingsPresetStressStats,
} from './utils/projectSettingsPresetStressSetup'
import {
  seedProjectSettingsPresetExportStress,
  type ProjectSettingsPresetExportStressStats,
} from './utils/projectSettingsPresetExportStressSetup'
import {
  seedAudioNormalizeStress,
  type AudioNormalizeStressStats,
} from './utils/audioNormalizeStressSetup'
import { loadTextStylePresets } from './persistence/textStylePresets'
import {
  importUserProjectTemplateFromText,
  loadUserProjectTemplates,
} from './persistence/userProjectTemplates'
import {
  importProjectSettingsPresets,
  loadProjectSettingsPresets,
} from './persistence/projectSettingsPresets'
import { parseExportedProjectSettingsPresetFile } from './utils/projectSettingsPresetFile'
import { useProjectStore } from './store/projectStore'
import { getMediaReplaceCandidates } from './utils/clipUtils'
import type { Clip } from './types/project'

declare global {
  interface Window {
    __FABLE_E2E__?: {
      loadChapterExportStressProject: () => ReturnType<typeof getChapterExportStressProjectStats>
      loadChapterExportE2eProject: () => ReturnType<typeof getChapterExportStressProjectStats>
      loadPhotoGuideSlideshowStress: () => PhotoGuideSlideshowStressStats
      loadMarkerEditStress: () => MarkerEditStressStats
      loadTextStylePresetStress: () => TextStylePresetStressStats
      loadMediaListStress: () => MediaListStressStats
      loadBatchTransitionStress: () => BatchTransitionStressStats
      loadBatchTransitionRemovalStress: () => BatchTransitionRemovalStressStats
      loadMediaReplaceStress: () => MediaReplaceStressStats
      loadUserProjectTemplateStress: () => UserProjectTemplateStressStats
      loadUserProjectTemplateExportStress: () => UserProjectTemplateExportStressStats
      loadProjectSettingsPresetStress: () => ProjectSettingsPresetStressStats
      loadProjectSettingsPresetExportStress: () => ProjectSettingsPresetExportStressStats
      loadAudioNormalizeStress: () => AudioNormalizeStressStats
      importUserProjectTemplateJson: (json: string) => string
      importProjectSettingsPresetJson: (json: string) => string[]
      clearUserProjectTemplates: () => void
      clearProjectSettingsPresets: () => void
      getUserProjectTemplateCount: () => number
      getProjectSettingsPresetCount: () => number
      getProjectClipCount: () => number
      getProjectWidth: () => number
      getProjectHeight: () => number
      getProjectFps: () => number
      getRippleDelete: () => boolean
      getLoopPlayback: () => boolean
      selectClip: (clipId: string) => void
      countClipsWithTransition: () => number
      getClipMediaId: (clipId: string) => string | null
      getClipAudioVolume: (clipId: string) => number | null
      getClipVolumeKeyframeMax: (clipId: string) => number | null
      getClipKenBurnsEnabled: (clipId: string) => boolean | null
      getMediaReplaceCandidateCount: (clipId: string) => number
      getMediaAssetName: (mediaId: string) => string | null
      clearTextStylePresets: () => void
      getTextStylePresetCount: () => number
      getPlaybackTime: () => number
    }
  }
}

/** Playwright E2E 専用。本番ビルドには含めない */
export function installE2eBridge(): void {
  if (!import.meta.env.DEV && !import.meta.env.VITE_E2E_BRIDGE) return

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
    loadMediaListStress: () => seedMediaListStress(),
    loadBatchTransitionStress: () => seedBatchTransitionStress(),
    loadBatchTransitionRemovalStress: () => seedBatchTransitionRemovalStress(),
    loadMediaReplaceStress: () => seedMediaReplaceStress(),
    loadUserProjectTemplateStress: () => seedUserProjectTemplateStress(),
    loadUserProjectTemplateExportStress: () => seedUserProjectTemplateExportStress(),
    loadProjectSettingsPresetStress: () => seedProjectSettingsPresetStress(),
    loadProjectSettingsPresetExportStress: () => seedProjectSettingsPresetExportStress(),
    loadAudioNormalizeStress: () => seedAudioNormalizeStress(),
    importUserProjectTemplateJson: (json) => importUserProjectTemplateFromText(json).label,
    importProjectSettingsPresetJson: (json) => {
      let raw: unknown
      try {
        raw = JSON.parse(json)
      } catch {
        throw new Error('JSON の読み込みに失敗しました')
      }
      const items = parseExportedProjectSettingsPresetFile(raw)
      return importProjectSettingsPresets(items).map((p) => p.name)
    },
    clearUserProjectTemplates: () => clearUserProjectTemplateStress(),
    clearProjectSettingsPresets: () => clearProjectSettingsPresetStress(),
    getUserProjectTemplateCount: () => loadUserProjectTemplates().length,
    getProjectSettingsPresetCount: () => loadProjectSettingsPresets().length,
    getProjectClipCount: () =>
      useProjectStore.getState().project.tracks.flatMap((t) => t.clips).length,
    getProjectWidth: () => useProjectStore.getState().project.width,
    getProjectHeight: () => useProjectStore.getState().project.height,
    getProjectFps: () => useProjectStore.getState().project.fps,
    getRippleDelete: () => useProjectStore.getState().rippleDelete,
    getLoopPlayback: () => useProjectStore.getState().loopPlayback,
    selectClip: (clipId) => useProjectStore.getState().setSelectedClipId(clipId),
    countClipsWithTransition: () =>
      useProjectStore.getState().project.tracks
        .flatMap((t) => t.clips)
        .filter((c) => (c.type === 'video' || c.type === 'image') && c.transition).length,
    getClipMediaId: (clipId) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      return clip && (clip.type === 'video' || clip.type === 'image' || clip.type === 'audio')
        ? clip.mediaId
        : null
    },
    getClipAudioVolume: (clipId) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      if (!clip || (clip.type !== 'video' && clip.type !== 'audio')) return null
      return clip.audio.volume
    },
    getClipVolumeKeyframeMax: (clipId) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      if (!clip || (clip.type !== 'video' && clip.type !== 'audio')) return null
      const keyframes = clip.audio.volumeKeyframes
      if (!keyframes?.length) return null
      return Math.max(...keyframes.map((kf) => kf.volume))
    },
    getClipKenBurnsEnabled: (clipId) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      if (!clip || clip.type !== 'image') return null
      return clip.kenBurns.enabled
    },
    getMediaReplaceCandidateCount: (clipId) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      if (!clip || (clip.type !== 'video' && clip.type !== 'image' && clip.type !== 'audio')) return 0
      return getMediaReplaceCandidates(clip, useProjectStore.getState().project.mediaAssets).length
    },
    getMediaAssetName: (mediaId) =>
      useProjectStore.getState().project.mediaAssets.find((a) => a.id === mediaId)?.name ?? null,
    clearTextStylePresets: () => clearTextStylePresetStress(),
    getTextStylePresetCount: () => loadTextStylePresets().length,
    getPlaybackTime: () => useProjectStore.getState().currentTime,
  }
}

function findClipInProject(project: { tracks: Array<{ clips: Clip[] }> }, clipId: string): Clip | null {
  for (const track of project.tracks) {
    const clip = track.clips.find((c) => c.id === clipId)
    if (clip) return clip
  }
  return null
}
