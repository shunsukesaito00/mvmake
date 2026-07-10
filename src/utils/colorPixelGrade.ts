import type { ColorAdjustments } from '../types/project'
import { applyPixelHslAdjustments, isPixelHslActive } from './colorHsl'
import { applyPixelRgbCurveAdjustments, isPixelRgbCurvesActive } from './colorRgbCurve'
import { applyPixelToneCurveAdjustments, isPixelToneCurveActive } from './colorToneCurve'

export function isPixelColorGradeActive(color: ColorAdjustments): boolean {
  return isPixelToneCurveActive(color) || isPixelRgbCurvesActive(color) || isPixelHslActive(color)
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
}
