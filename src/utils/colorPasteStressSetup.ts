import type { ImageClip, LutAsset, MediaAsset, Project, Track } from '../types/project'
import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeColorAdjustments,
  normalizeProject,
} from '../types/project'
import { createId } from './id'
import { updateRgbCurvePoint } from './colorRgbCurve'
import { clipColorSettingsEqual, extractClipColorSettings, type ClipColorSettings } from './colorPaste'
import { useProjectStore } from '../store/projectStore'

export const COLOR_PASTE_STRESS_SOURCE_MIDTONES = 0.35
export const COLOR_PASTE_STRESS_SOURCE_TEMPERATURE = 0.22
export const COLOR_PASTE_STRESS_RGB_R_MID = 0.68
export const COLOR_PASTE_STRESS_LUT_INTENSITY = 0.72

export interface ColorPasteStressStats {
  sourceClipId: string
  targetClipIds: string[]
  sourceSettings: ClipColorSettings
}

export function buildColorPasteStressSourceColor() {
  return normalizeColorAdjustments({
    ...DEFAULT_COLOR,
    midtones: COLOR_PASTE_STRESS_SOURCE_MIDTONES,
    temperature: COLOR_PASTE_STRESS_SOURCE_TEMPERATURE,
    rgbCurves: updateRgbCurvePoint(DEFAULT_COLOR.rgbCurves, 'r', 2, COLOR_PASTE_STRESS_RGB_R_MID),
  })
}

function imageClip(
  trackId: string,
  mediaId: string,
  startTime: number,
  overrides: Partial<ImageClip> = {},
): ImageClip {
  return {
    id: createId(),
    trackId,
    type: 'image',
    mediaId,
    startTime,
    duration: 4,
    sourceStart: 0,
    sourceDuration: 4,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { ...DEFAULT_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    ...overrides,
  }
}

export function createColorPasteStressProject(): Project {
  const imageAssets: MediaAsset[] = Array.from({ length: 3 }, (_, index) => ({
    id: createId(),
    name: `stress-color-paste-${index + 1}.jpg`,
    type: 'image',
    blob: new Blob(),
    url: URL.createObjectURL(new Blob()),
    duration: 10,
  }))

  const lutAsset: LutAsset = {
    id: createId(),
    name: 'stress-lut.cube',
    blob: new Blob(['TITLE "stress"\nLUT_3D_SIZE 2\n0 0 0\n1 1 1'], { type: 'text/plain' }),
    size: 48,
    title: 'stress',
  }

  const videoTrack: Track = {
    id: createId(),
    name: '映像 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
  }

  const sourceColor = buildColorPasteStressSourceColor()
  const sourceClip = imageClip(videoTrack.id, imageAssets[0].id, 0, {
    color: sourceColor,
    lutId: lutAsset.id,
    lutIntensity: COLOR_PASTE_STRESS_LUT_INTENSITY,
  })
  const targetClipA = imageClip(videoTrack.id, imageAssets[1].id, 4)
  const targetClipB = imageClip(videoTrack.id, imageAssets[2].id, 8)

  videoTrack.clips = [sourceClip, targetClipA, targetClipB]

  return normalizeProject({
    id: createId(),
    name: 'ストレス色調ペースト検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: imageAssets,
    lutAssets: [lutAsset],
    markers: [],
    tracks: [
      videoTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    ],
  })
}

export function getColorPasteStressStats(project: Project): ColorPasteStressStats {
  const videoTrack = project.tracks.find((t) => t.type === 'video')
  const clips = videoTrack?.clips.filter((c) => c.type === 'image') ?? []
  const sourceClip = clips[0]
  const targetClips = clips.slice(1)
  if (!sourceClip || sourceClip.type !== 'image' || targetClips.length < 2) {
    throw new Error('color paste stress: clips missing')
  }

  return {
    sourceClipId: sourceClip.id,
    targetClipIds: targetClips.map((c) => c.id),
    sourceSettings: extractClipColorSettings(sourceClip),
  }
}

export function seedColorPasteStress(): ColorPasteStressStats {
  const project = createColorPasteStressProject()
  const stats = getColorPasteStressStats(project)
  useProjectStore.getState().loadProject(project)
  useProjectStore.getState().setSelectedClipId(stats.sourceClipId)
  return stats
}

export function getClipColorSettings(clipId: string): ClipColorSettings | null {
  const clip = useProjectStore.getState().project.tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === clipId)
  if (!clip || (clip.type !== 'video' && clip.type !== 'image' && clip.type !== 'adjustment')) return null
  return extractClipColorSettings(clip)
}

export function clipMatchesColorPasteSource(clipId: string, source: ClipColorSettings): boolean {
  const settings = getClipColorSettings(clipId)
  if (!settings) return false
  return clipColorSettingsEqual(settings, source)
}

export function copyClipColorById(clipId: string): boolean {
  return useProjectStore.getState().copyClipColor(clipId)
}

export function pasteColorToSelectedClips(): number {
  return useProjectStore.getState().pasteColorToSelectedClips()
}

export function applyPrimaryClipColorToSelection(): number {
  return useProjectStore.getState().applyPrimaryClipColorToSelection()
}

export function hasColorClipboard(): boolean {
  return useProjectStore.getState().colorClipboard !== null
}

export function clipMatchesColorPasteSourceClip(clipId: string, sourceClipId: string): boolean {
  const source = getClipColorSettings(sourceClipId)
  if (!source) return false
  return clipMatchesColorPasteSource(clipId, source)
}
