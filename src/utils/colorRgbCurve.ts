import type { ColorAdjustments, RgbCurveChannel, RgbCurvePoints, RgbCurves } from '../types/project'
import { DEFAULT_RGB_CURVES, RGB_CURVE_INPUTS } from '../types/project'

const EPSILON = 0.001

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function rgbCurvePointsEqual(a: RgbCurvePoints, b: RgbCurvePoints): boolean {
  return a.every((value, index) => Math.abs(value - b[index]) < EPSILON)
}

export function isRgbCurveChannelActive(points: RgbCurvePoints): boolean {
  return !rgbCurvePointsEqual(points, RGB_CURVE_INPUTS)
}

export function isRgbCurvesActive(curves: RgbCurves): boolean {
  return (
    isRgbCurveChannelActive(curves.r)
    || isRgbCurveChannelActive(curves.g)
    || isRgbCurveChannelActive(curves.b)
  )
}

export function isPixelRgbCurvesActive(color: ColorAdjustments): boolean {
  return isRgbCurvesActive(color.rgbCurves ?? DEFAULT_RGB_CURVES)
}

export function sampleRgbCurve(points: RgbCurvePoints, input: number): number {
  const x = clamp01(input)
  if (x <= RGB_CURVE_INPUTS[0]) return clamp01(points[0])
  if (x >= RGB_CURVE_INPUTS[4]) return clamp01(points[4])

  for (let i = 0; i < RGB_CURVE_INPUTS.length - 1; i++) {
    const x0 = RGB_CURVE_INPUTS[i]
    const x1 = RGB_CURVE_INPUTS[i + 1]
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0)
      return clamp01(points[i] + (points[i + 1] - points[i]) * t)
    }
  }

  return x
}

export function buildRgbCurveLookup(points: RgbCurvePoints): Uint8Array {
  const lookup = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    lookup[i] = Math.round(sampleRgbCurve(points, i / 255) * 255)
  }
  return lookup
}

export function applyRgbCurvesToImageData(imageData: ImageData, curves: RgbCurves): void {
  if (!isRgbCurvesActive(curves)) return

  const lookupR = buildRgbCurveLookup(curves.r)
  const lookupG = buildRgbCurveLookup(curves.g)
  const lookupB = buildRgbCurveLookup(curves.b)
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    data[i] = lookupR[data[i]]
    data[i + 1] = lookupG[data[i + 1]]
    data[i + 2] = lookupB[data[i + 2]]
  }
}

export function applyPixelRgbCurveAdjustments(imageData: ImageData, color: ColorAdjustments): void {
  applyRgbCurvesToImageData(imageData, color.rgbCurves ?? DEFAULT_RGB_CURVES)
}

function mergeRgbCurveChannel(base: RgbCurvePoints, overlay: RgbCurvePoints): RgbCurvePoints {
  return base.map((value, index) => clamp01(value + (overlay[index] - RGB_CURVE_INPUTS[index]))) as RgbCurvePoints
}

export function mergeRgbCurves(base: RgbCurves, overlay: RgbCurves): RgbCurves {
  if (!isRgbCurvesActive(overlay)) return base
  if (!isRgbCurvesActive(base)) return overlay
  return {
    r: mergeRgbCurveChannel(base.r, overlay.r),
    g: mergeRgbCurveChannel(base.g, overlay.g),
    b: mergeRgbCurveChannel(base.b, overlay.b),
  }
}

export function updateRgbCurvePoint(
  curves: RgbCurves,
  channel: RgbCurveChannel,
  pointIndex: number,
  output: number,
): RgbCurves {
  if (pointIndex <= 0 || pointIndex >= 4) return curves
  const next = { ...curves, [channel]: [...curves[channel]] as RgbCurvePoints }
  next[channel][pointIndex] = clamp01(output)
  return next
}

export function resetRgbCurves(): RgbCurves {
  return {
    r: [...DEFAULT_RGB_CURVES.r],
    g: [...DEFAULT_RGB_CURVES.g],
    b: [...DEFAULT_RGB_CURVES.b],
  }
}
