import type { ExportQuality } from '../engine/exporter'
import type { ExportResolution } from '../types/exportPreset'

export const SNS_VERTICAL_WIDTH = 1080
export const SNS_VERTICAL_HEIGHT = 1920

export const SNS_EXPORT_QUALITY: ExportQuality = 'light'
export const SNS_EXPORT_RESOLUTION: ExportResolution = 'project'

export function isVertical916Project(width: number, height: number): boolean {
  return width === SNS_VERTICAL_WIDTH && height === SNS_VERTICAL_HEIGHT
}

export function getSnsExportDefaults(): { quality: ExportQuality; resolution: ExportResolution } {
  return { quality: SNS_EXPORT_QUALITY, resolution: SNS_EXPORT_RESOLUTION }
}
