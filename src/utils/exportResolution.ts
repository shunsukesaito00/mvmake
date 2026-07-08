import { RESOLUTION_PRESETS } from '../types/project'
import type { ExportResolution } from '../types/exportPreset'

const REF_PIXELS = 1920 * 1080

export function normalizeExportResolution(value: string): ExportResolution {
  if (value === '720p') return '720p'
  return 'project'
}

export function resolveExportSize(
  projectWidth: number,
  projectHeight: number,
  resolution: ExportResolution,
): { width: number; height: number } {
  if (resolution === '720p') {
    return { width: 1280, height: 720 }
  }
  return { width: projectWidth, height: projectHeight }
}

export function scaleVideoBitrate(baseBitrate: number, width: number, height: number): number {
  const pixels = width * height
  return Math.min(50_000_000, Math.round(baseBitrate * (pixels / REF_PIXELS)))
}

export function formatExportDimensions(width: number, height: number): string {
  return `${width}×${height}`
}

/** 書き出しボタンラベル。1080p プロジェクトは E2E 互換の「1080p で書き出し」を返す */
export function getNativeExportButtonLabel(width: number, height: number): string {
  if (width === 1920 && height === 1080) return '1080p で書き出し'
  const preset = RESOLUTION_PRESETS.find((p) => p.width === width && p.height === height)
  if (preset?.id === '4k') return '4K で書き出し'
  if (preset?.id === 'square') return '1080×1080 で書き出し'
  if (preset?.id === 'vertical') return '9:16 で書き出し'
  return `${formatExportDimensions(width, height)} で書き出し`
}

export function getExportResolutionLabel(resolution: ExportResolution, projectWidth: number, projectHeight: number): string {
  if (resolution === '720p') return '1280×720'
  return formatExportDimensions(projectWidth, projectHeight)
}

export function formatExportResolutionSummary(resolution: ExportResolution): string {
  return resolution === '720p' ? '720p' : 'プロジェクト解像度'
}
