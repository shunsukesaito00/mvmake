import type {
  AdjustmentClip,
  Clip,
  ColorAdjustments,
  ImageClip,
  SelectiveHsl,
  VideoClip,
} from '../types/project'
import { DEFAULT_LUT_INTENSITY, normalizeColorAdjustments } from '../types/project'
import { colorAdjustmentsEqual } from './colorLooks'

export interface ClipColorSettings {
  color: ColorAdjustments
  lutId?: string
  lutIntensity?: number
}

export type ColorPasteCapableClip = VideoClip | ImageClip | AdjustmentClip

export function clipSupportsColorPaste(clip: Clip): clip is ColorPasteCapableClip {
  return clip.type === 'video' || clip.type === 'image' || clip.type === 'adjustment'
}

export function extractClipColorSettings(clip: ColorPasteCapableClip): ClipColorSettings {
  return {
    color: normalizeColorAdjustments(clip.color),
    lutId: clip.lutId,
    lutIntensity: clip.lutIntensity ?? DEFAULT_LUT_INTENSITY,
  }
}

function selectiveHslEqual(a: SelectiveHsl, b: SelectiveHsl): boolean {
  return (
    a.enabled === b.enabled &&
    a.targetHue === b.targetHue &&
    a.hueRange === b.hueRange &&
    Math.abs(a.hueShift - b.hueShift) < 0.001 &&
    Math.abs(a.saturation - b.saturation) < 0.001 &&
    Math.abs(a.luminance - b.luminance) < 0.001
  )
}

function selectiveHslBandsEqual(a: SelectiveHsl[], b: SelectiveHsl[]): boolean {
  if (a.length !== b.length) return false
  return a.every((band, index) => selectiveHslEqual(band, b[index]))
}

export function clipColorSettingsEqual(a: ClipColorSettings, b: ClipColorSettings): boolean {
  return (
    colorAdjustmentsEqual(a.color, b.color) &&
    selectiveHslBandsEqual(a.color.selectiveHslBands, b.color.selectiveHslBands) &&
    a.lutId === b.lutId &&
    Math.abs((a.lutIntensity ?? DEFAULT_LUT_INTENSITY) - (b.lutIntensity ?? DEFAULT_LUT_INTENSITY)) < 0.001
  )
}

export function buildColorPasteUpdates(settings: ClipColorSettings): {
  color: ColorAdjustments
  lutId?: string
  lutIntensity?: number
} {
  return {
    color: structuredClone(settings.color),
    lutId: settings.lutId,
    lutIntensity: settings.lutIntensity,
  }
}
