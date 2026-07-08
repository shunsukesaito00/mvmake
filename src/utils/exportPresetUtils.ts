import type { ExportQuality } from '../engine/exporter'
import type { ExportPreset, ExportResolution } from '../types/exportPreset'
import { createId } from './id'

export function buildExportPreset(
  name: string,
  quality: ExportQuality,
  resolution: ExportResolution,
  inPoint: number | null,
  outPoint: number | null,
): ExportPreset {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('プリセット名を入力してください')

  const useInOut = inPoint !== null || outPoint !== null
  return {
    id: createId(),
    name: trimmed,
    quality,
    resolution,
    useInOut,
    inPoint: useInOut ? inPoint : null,
    outPoint: useInOut ? outPoint : null,
  }
}

export function formatExportPresetSummary(preset: ExportPreset, qualityLabel: string): string {
  const res = preset.resolution
  const range = preset.useInOut
    ? `In/Out ${preset.inPoint?.toFixed(1) ?? '—'}–${preset.outPoint?.toFixed(1) ?? '—'}s`
    : '全体'
  return `${res} · ${qualityLabel} · ${range}`
}
