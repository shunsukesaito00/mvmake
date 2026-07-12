import type { ColorAdjustments } from '../types/project'
import type { ParsedCubeLut } from './cubeLut'
import { applyLutToImageData } from './cubeLut'
import { applyPixelHslAdjustments, isPixelHslActive } from './colorHsl'
import { applyPixelSelectiveHslAdjustments, isSelectiveHslActive } from './colorSelectiveHsl'
import { applyPixelRgbCurveAdjustments, isPixelRgbCurvesActive } from './colorRgbCurve'
import { applyPixelToneCurveAdjustments, isPixelToneCurveActive } from './colorToneCurve'

export function isPixelColorGradeActive(color: ColorAdjustments): boolean {
  return (
    isPixelToneCurveActive(color)
    || isPixelRgbCurvesActive(color)
    || isPixelHslActive(color)
    || isSelectiveHslActive(color.selectiveHsl)
  )
}

/** LUT 適用後のピクセル色調: トーンカーブ → RGB カーブ → 色温度/ティント */
export function applyPixelColorGradeAdjustments(imageData: ImageData, color: ColorAdjustments): void {
  if (isPixelToneCurveActive(color)) {
    applyPixelToneCurveAdjustments(imageData, color)
  }
  if (isPixelRgbCurvesActive(color)) {
    applyPixelRgbCurveAdjustments(imageData, color)
  }
  if (isPixelHslActive(color)) {
    applyPixelHslAdjustments(imageData, color)
  }
  if (isSelectiveHslActive(color.selectiveHsl)) {
    applyPixelSelectiveHslAdjustments(imageData, color.selectiveHsl)
  }
}

/** compositor.drawMediaClip と同一順序のピクセル色調スタック（LUT → ピクセルグレード） */
export function applyCompositorColorStackToImageData(
  imageData: ImageData,
  color: ColorAdjustments,
  lut?: { parsed: ParsedCubeLut; intensity: number } | null,
): void {
  if (lut) {
    applyLutToImageData(imageData, lut.parsed, lut.intensity)
  }
  if (isPixelColorGradeActive(color)) {
    applyPixelColorGradeAdjustments(imageData, color)
  }
}

export function needsCompositorPixelGrade(
  color: ColorAdjustments,
  lut?: { parsed: ParsedCubeLut; intensity: number } | null,
): boolean {
  return Boolean(lut) || isPixelColorGradeActive(color)
}
