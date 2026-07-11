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
import {
  seedTransformKeyframeStress,
  type TransformKeyframeStressStats,
} from './utils/transformKeyframeStressSetup'
import {
  getStructuredWeddingTemplateStressStats,
  seedStructuredWeddingTemplateStress,
  type StructuredWeddingTemplateStressStats,
} from './utils/structuredWeddingTemplateStressSetup'
import {
  applyVertical916Preset,
  getVertical916PresetStressStats,
  seedVertical916PresetStress,
  type Vertical916PresetStressStats,
} from './utils/vertical916PresetStressSetup'
import {
  applyResolutionPresetById,
  getExportResolutionAlignmentStressStats,
  seedExportResolutionAlignmentStress,
  type ExportResolutionAlignmentStressStats,
} from './utils/exportResolutionAlignmentStressSetup'
import {
  applyExportPresetByName,
  clearExportPresetStress,
  getExportPresetStressCount,
  seedExportPresetStress,
  type AppliedExportPresetState,
  type ExportPresetStressStats,
} from './utils/exportPresetStressSetup'
import {
  seedExportPresetExportStress,
  type ExportPresetExportStressStats,
} from './utils/exportPresetExportStressSetup'
import {
  applyClipFade,
  getClipFadeValues,
  getMediaVisualOpacityForClip,
  seedVideoFadeStress,
  type VideoFadeStressStats,
} from './utils/videoFadeStressSetup'
import {
  getClipVolumeKeyframeCount as getStressClipVolumeKeyframeCount,
  getVolumeAtClipLocalTime,
  listAudioClipVolumeKeyframeCounts,
  seedVolumeKeyframeTimelineStress,
  updateVolumeKeyframeById,
  type VolumeKeyframeTimelineStressStats,
} from './utils/volumeKeyframeTimelineStressSetup'
import {
  listAudioTrackVolumeKeyframeCounts,
  listVolumeKeyframeClipCounts,
  seedVolumeKeyframeStress,
  type VolumeKeyframeStressStats,
} from './utils/volumeKeyframeStressSetup'
import {
  getClipDuration as getStressClipDuration,
  getClipSourceStart,
  getClipStartTime,
  getClipTransformKeyframeTimes,
  getClipVolumeKeyframeTimes,
  seedSlipSlideStress,
  slideClipById,
  slipClipById,
  type SlipSlideStressStats,
} from './utils/slipSlideStressSetup'
import {
  applyClipColor,
  applyClipRgbCurvePoint,
  getClipColor,
  getClipPixelGradeSample,
  getRgbCurveSampleAt,
  seedToneCurveStress,
  type ToneCurveStressStats,
} from './utils/toneCurveStressSetup'
import {
  applyBuiltinTemplateById,
  applyUserTemplateById,
  clearTemplateStressStorage,
  getChapterMarkerCountFromStore,
  getProjectClipCountFromStore,
  importTemplateStressJson,
  seedTemplateStress,
  tryImportTemplateStressJson,
  type TemplateStressStats,
} from './utils/templateStressSetup'
import { parseExportedExportPresetFile } from './utils/exportPresetFile'
import { importExportPresets } from './persistence/exportPresets'
import { filterChapterMarkers } from './utils/beatMarkers'
import { isPhotoGuideClip } from './utils/photoGuide'
import { getTransformAtLocalTime } from './utils/transformKeyframes'
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
      loadTransformKeyframeStress: () => TransformKeyframeStressStats
      loadStructuredWeddingTemplateStress: () => StructuredWeddingTemplateStressStats
      getStructuredWeddingTemplateStressStats: () => StructuredWeddingTemplateStressStats
      loadVertical916PresetStress: () => Vertical916PresetStressStats
      getVertical916PresetStressStats: () => Vertical916PresetStressStats
      applyVertical916Preset: () => Vertical916PresetStressStats
      loadExportResolutionAlignmentStress: () => ExportResolutionAlignmentStressStats
      getExportResolutionAlignmentStressStats: () => ExportResolutionAlignmentStressStats
      applyResolutionPresetById: (presetId: string) => ExportResolutionAlignmentStressStats
      loadExportPresetStress: () => ExportPresetStressStats
      loadExportPresetExportStress: () => ExportPresetExportStressStats
      applyExportPresetByName: (name: string) => AppliedExportPresetState
      importExportPresetJson: (json: string) => string[]
      clearExportPresets: () => void
      getExportPresetCount: () => number
      getInPoint: () => number | null
      getOutPoint: () => number | null
      undo: () => void
      loadVideoFadeStress: () => VideoFadeStressStats
      getMediaVisualOpacityForClip: (clipId: string, time: number) => number
      getClipFadeValues: (clipId: string) => { fadeIn: number; fadeOut: number }
      applyClipFade: (clipId: string, fadeIn: number, fadeOut: number) => { fadeIn: number; fadeOut: number }
      loadVolumeKeyframeTimelineStress: () => VolumeKeyframeTimelineStressStats
      loadVolumeKeyframeStress: () => VolumeKeyframeStressStats
      listVolumeKeyframeClipCounts: () => Array<{ clipId: string; count: number }>
      listAudioTrackVolumeKeyframeCounts: () => Array<{ clipId: string; count: number }>
      loadSlipSlideStress: () => SlipSlideStressStats
      getClipSourceStart: (clipId: string) => number
      getClipStartTime: (clipId: string) => number
      getStressClipDuration: (clipId: string) => number
      getClipTransformKeyframeTimes: (clipId: string) => number[]
      getClipVolumeKeyframeTimes: (clipId: string) => number[]
      slipClipById: (clipId: string, delta: number) => boolean
      slideClipById: (clipId: string, delta: number) => boolean
      loadToneCurveStress: () => ToneCurveStressStats
      getClipColorMidtones: (clipId: string) => number
      getClipPixelGradeSample: (clipId: string, gray?: number) => { r: number; g: number; b: number }
      getRgbCurveSampleAt: (clipId: string, channel: 'r' | 'g' | 'b', input: number) => number
      applyClipColorMidtones: (clipId: string, midtones: number) => number
      applyClipRgbCurvePoint: (clipId: string, channel: 'r' | 'g' | 'b', pointIndex: number, output: number) => number
      loadTemplateStress: () => TemplateStressStats
      applyBuiltinTemplateById: (templateId: string) => number
      applyUserTemplateById: (templateId: string) => boolean
      importTemplateStressJson: (json: string) => string
      tryImportTemplateStressJson: (json: string) => { ok: true; label: string } | { ok: false; error: string }
      clearTemplateStressStorage: () => void
      getTemplateStressClipCount: () => number
      getTemplateStressMarkerCount: () => number
      getVolumeAtClipLocalTime: (clipId: string, localTime: number) => number
      getClipVolumeKeyframeCount: (clipId: string) => number
      listAudioClipVolumeKeyframeCounts: () => Array<{ clipId: string; count: number }>
      updateVolumeKeyframeById: (clipId: string, keyframeId: string, patch: { time?: number; volume?: number }) => void
      importUserProjectTemplateJson: (json: string) => string
      importProjectSettingsPresetJson: (json: string) => string[]
      clearUserProjectTemplates: () => void
      clearProjectSettingsPresets: () => void
      getUserProjectTemplateCount: () => number
      getProjectSettingsPresetCount: () => number
      getProjectClipCount: () => number
      getChapterMarkerCount: () => number
      getPhotoGuideClipCount: () => number
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
      getClipTransformKeyframeCount: (clipId: string) => number
      getInterpolatedTransformAt: (clipId: string, localTime: number) => {
        x: number
        y: number
        scale: number
        rotation: number
        opacity: number
      } | null
      listImageClipTransformKeyframeCounts: () => Array<{ clipId: string; count: number }>
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
    loadTransformKeyframeStress: () => seedTransformKeyframeStress(),
    loadStructuredWeddingTemplateStress: () => seedStructuredWeddingTemplateStress(),
    getStructuredWeddingTemplateStressStats: () => getStructuredWeddingTemplateStressStats(),
    loadVertical916PresetStress: () => seedVertical916PresetStress(),
    getVertical916PresetStressStats: () => getVertical916PresetStressStats(),
    applyVertical916Preset: () => applyVertical916Preset(),
    loadExportResolutionAlignmentStress: () => seedExportResolutionAlignmentStress(),
    getExportResolutionAlignmentStressStats: () => getExportResolutionAlignmentStressStats(),
    applyResolutionPresetById: (presetId) => applyResolutionPresetById(presetId),
    loadExportPresetStress: () => seedExportPresetStress(),
    loadExportPresetExportStress: () => seedExportPresetExportStress(),
    applyExportPresetByName: (name) => applyExportPresetByName(name),
    importExportPresetJson: (json) => {
      let raw: unknown
      try {
        raw = JSON.parse(json)
      } catch {
        throw new Error('JSON の読み込みに失敗しました')
      }
      const items = parseExportedExportPresetFile(raw)
      return importExportPresets(items).map((p) => p.name)
    },
    clearExportPresets: () => clearExportPresetStress(),
    getExportPresetCount: () => getExportPresetStressCount(),
    getInPoint: () => useProjectStore.getState().inPoint,
    getOutPoint: () => useProjectStore.getState().outPoint,
    undo: () => useProjectStore.getState().undo(),
    loadVideoFadeStress: () => seedVideoFadeStress(),
    getMediaVisualOpacityForClip: (clipId, time) => getMediaVisualOpacityForClip(clipId, time),
    getClipFadeValues: (clipId) => getClipFadeValues(clipId),
    applyClipFade: (clipId, fadeIn, fadeOut) => applyClipFade(clipId, fadeIn, fadeOut),
    loadVolumeKeyframeTimelineStress: () => seedVolumeKeyframeTimelineStress(),
    loadVolumeKeyframeStress: () => seedVolumeKeyframeStress(),
    listVolumeKeyframeClipCounts: () => listVolumeKeyframeClipCounts(),
    listAudioTrackVolumeKeyframeCounts: () => listAudioTrackVolumeKeyframeCounts(),
    loadSlipSlideStress: () => seedSlipSlideStress(),
    getClipSourceStart: (clipId) => getClipSourceStart(clipId),
    getClipStartTime: (clipId) => getClipStartTime(clipId),
    getStressClipDuration: (clipId) => getStressClipDuration(clipId),
    getClipTransformKeyframeTimes: (clipId) => getClipTransformKeyframeTimes(clipId),
    getClipVolumeKeyframeTimes: (clipId) => getClipVolumeKeyframeTimes(clipId),
    slipClipById: (clipId, delta) => slipClipById(clipId, delta),
    slideClipById: (clipId, delta) => slideClipById(clipId, delta),
    loadToneCurveStress: () => seedToneCurveStress(),
    getClipColorMidtones: (clipId) => getClipColor(clipId).midtones,
    getClipPixelGradeSample: (clipId, gray) => getClipPixelGradeSample(clipId, gray),
    getRgbCurveSampleAt: (clipId, channel, input) => getRgbCurveSampleAt(clipId, channel, input),
    applyClipColorMidtones: (clipId, midtones) => applyClipColor(clipId, { midtones }, true).midtones,
    applyClipRgbCurvePoint: (clipId, channel, pointIndex, output) => (
      applyClipRgbCurvePoint(clipId, channel, pointIndex, output, true).rgbCurves[channel][pointIndex]?.y ?? output
    ),
    loadTemplateStress: () => seedTemplateStress(),
    applyBuiltinTemplateById: (templateId) => applyBuiltinTemplateById(templateId),
    applyUserTemplateById: (templateId) => applyUserTemplateById(templateId),
    importTemplateStressJson: (json) => importTemplateStressJson(json),
    tryImportTemplateStressJson: (json) => tryImportTemplateStressJson(json),
    clearTemplateStressStorage: () => clearTemplateStressStorage(),
    getTemplateStressClipCount: () => getProjectClipCountFromStore(),
    getTemplateStressMarkerCount: () => getChapterMarkerCountFromStore(),
    getVolumeAtClipLocalTime: (clipId, localTime) => getVolumeAtClipLocalTime(clipId, localTime),
    getClipVolumeKeyframeCount: (clipId) => getStressClipVolumeKeyframeCount(clipId),
    listAudioClipVolumeKeyframeCounts: () => listAudioClipVolumeKeyframeCounts(),
    updateVolumeKeyframeById: (clipId, keyframeId, patch) => updateVolumeKeyframeById(clipId, keyframeId, patch),
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
    getChapterMarkerCount: () =>
      filterChapterMarkers(useProjectStore.getState().project.markers ?? []).length,
    getPhotoGuideClipCount: () =>
      useProjectStore.getState().project.tracks
        .flatMap((t) => t.clips)
        .filter((c) => isPhotoGuideClip(c)).length,
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
    getClipTransformKeyframeCount: (clipId) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      if (!clip || (clip.type !== 'video' && clip.type !== 'image' && clip.type !== 'text')) return 0
      return clip.transformKeyframes?.length ?? 0
    },
    getInterpolatedTransformAt: (clipId, localTime) => {
      const clip = findClipInProject(useProjectStore.getState().project, clipId)
      if (!clip || (clip.type !== 'video' && clip.type !== 'image' && clip.type !== 'text')) return null
      const transform = getTransformAtLocalTime(
        clip.transform,
        clip.transformKeyframes,
        localTime,
        clip.duration,
      )
      return {
        x: transform.x,
        y: transform.y,
        scale: transform.scale,
        rotation: transform.rotation,
        opacity: transform.opacity,
      }
    },
    listImageClipTransformKeyframeCounts: () =>
      useProjectStore.getState().project.tracks
        .flatMap((t) => t.clips)
        .filter((c) => c.type === 'image')
        .map((c) => ({
          clipId: c.id,
          count: c.type === 'image' ? c.transformKeyframes?.length ?? 0 : 0,
        })),
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
