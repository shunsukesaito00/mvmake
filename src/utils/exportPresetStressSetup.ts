import type { ExportQuality } from '../engine/exporter'
import type { ExportPreset, ExportResolution } from '../types/exportPreset'
import { loadExportPresets, replaceExportPresets } from '../persistence/exportPresets'
import { useProjectStore } from '../store/projectStore'
import { buildExportPreset } from './exportPresetUtils'

/** E2E/ストレス用の書き出しプリセット件数 */
export const EXPORT_PRESET_STRESS_COUNT = 4
export const EXPORT_PRESET_STRESS_HIGHLIGHT_NAME = '高品質範囲'

const STRESS_PRESET_DEFINITIONS: Array<{
  name: string
  quality: ExportQuality
  resolution: ExportResolution
  inPoint: number | null
  outPoint: number | null
}> = [
  { name: 'SNS軽量', quality: 'light', resolution: '720p', inPoint: null, outPoint: null },
  { name: '標準全体', quality: 'standard', resolution: 'project', inPoint: null, outPoint: null },
  { name: EXPORT_PRESET_STRESS_HIGHLIGHT_NAME, quality: 'high', resolution: 'project', inPoint: 2, outPoint: 10 },
  { name: '軽量720p範囲', quality: 'light', resolution: '720p', inPoint: 1.5, outPoint: 8 },
]

export interface ExportPresetStressStats {
  presetCount: number
  names: string[]
  highlightPresetName: string
  highlightQuality: ExportQuality
  highlightResolution: ExportResolution
  highlightInPoint: number
  highlightOutPoint: number
}

export interface AppliedExportPresetState {
  name: string
  quality: ExportQuality
  resolution: ExportResolution
  useInOut: boolean
  inPoint: number | null
  outPoint: number | null
}

export function clearExportPresetStress(): void {
  replaceExportPresets([])
}

/** 品質・解像度・In/Out の4パターンを localStorage に投入 */
export function seedExportPresetStress(): ExportPresetStressStats {
  const presets = STRESS_PRESET_DEFINITIONS.map((def) =>
    buildExportPreset(def.name, def.quality, def.resolution, def.inPoint, def.outPoint),
  )
  replaceExportPresets(presets)

  const highlight = STRESS_PRESET_DEFINITIONS.find((d) => d.name === EXPORT_PRESET_STRESS_HIGHLIGHT_NAME)!
  return {
    presetCount: presets.length,
    names: presets.map((p) => p.name),
    highlightPresetName: highlight.name,
    highlightQuality: highlight.quality,
    highlightResolution: highlight.resolution,
    highlightInPoint: highlight.inPoint!,
    highlightOutPoint: highlight.outPoint!,
  }
}

export function getExportPresetStressCount(): number {
  return loadExportPresets().length
}

/** 保存済みプリセットの In/Out を projectStore に反映（ExportButton の適用と同経路） */
export function applyExportPreset(preset: ExportPreset): AppliedExportPresetState {
  const store = useProjectStore.getState()
  if (preset.useInOut) {
    store.setInPoint(preset.inPoint)
    store.setOutPoint(preset.outPoint)
  } else {
    store.clearInOut()
  }

  return {
    name: preset.name,
    quality: preset.quality,
    resolution: preset.resolution,
    useInOut: preset.useInOut,
    inPoint: preset.useInOut ? preset.inPoint : null,
    outPoint: preset.useInOut ? preset.outPoint : null,
  }
}

export function applyExportPresetByName(name: string): AppliedExportPresetState {
  const preset = loadExportPresets().find((p) => p.name === name)
  if (!preset) throw new Error(`export preset not found: ${name}`)
  return applyExportPreset(preset)
}
