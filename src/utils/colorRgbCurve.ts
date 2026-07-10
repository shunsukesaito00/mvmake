import type { ColorAdjustments, RgbCurveChannel, RgbCurveChannelPoints, RgbCurves } from '../types/project'
import {
  DEFAULT_RGB_CURVE_CHANNEL,
  DEFAULT_RGB_CURVES,
  RGB_CURVE_MAX_POINTS,
  RGB_CURVE_MIN_POINT_GAP,
  sortRgbCurveChannel,
} from '../types/project'

const EPSILON = 0.001

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function computePchipSlopes(xs: number[], ys: number[]): number[] {
  const n = xs.length
  const ms = new Array<number>(n).fill(0)
  if (n < 2) return ms

  const deltas = new Array<number>(n - 1)
  for (let i = 0; i < n - 1; i++) {
    deltas[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i])
  }

  ms[0] = deltas[0]
  ms[n - 1] = deltas[n - 2]

  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      ms[i] = 0
      continue
    }
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1])
    const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1])
    ms[i] = (w1 + w2) / (w1 / deltas[i - 1] + w2 / deltas[i])
  }

  return ms
}

export function rgbCurveChannelEqual(a: RgbCurveChannelPoints, b: RgbCurveChannelPoints): boolean {
  if (a.length !== b.length) return false
  return a.every((point, index) => (
    Math.abs(point.x - b[index].x) < EPSILON
    && Math.abs(point.y - b[index].y) < EPSILON
  ))
}

export function isRgbCurveChannelActive(points: RgbCurveChannelPoints): boolean {
  return points.some((point) => Math.abs(point.y - point.x) > EPSILON)
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

/** 単調三次 Hermite (PCHIP) で入力輝度 0〜1 を出力にマッピング */
export function sampleRgbCurve(points: RgbCurveChannelPoints, input: number): number {
  const x = clamp01(input)
  const sorted = sortRgbCurveChannel(points)
  const n = sorted.length

  if (n === 0) return x
  if (n === 1) return clamp01(sorted[0].y)

  const xs = sorted.map((p) => p.x)
  const ys = sorted.map((p) => p.y)

  if (x <= xs[0]) return clamp01(ys[0])
  if (x >= xs[n - 1]) return clamp01(ys[n - 1])

  let i = 0
  while (i < n - 2 && x > xs[i + 1]) i++

  const x0 = xs[i]
  const x1 = xs[i + 1]
  const y0 = ys[i]
  const y1 = ys[i + 1]
  if (x1 === x0) return clamp01(y0)

  const ms = computePchipSlopes(xs, ys)
  const h = x1 - x0
  const t = (x - x0) / h
  const t2 = t * t
  const t3 = t2 * t

  return clamp01(
    y0 * (2 * t3 - 3 * t2 + 1)
    + y1 * (-2 * t3 + 3 * t2)
    + ms[i] * h * (t3 - 2 * t2 + t)
    + ms[i + 1] * h * (t3 - t2),
  )
}

export function buildRgbCurveLookup(points: RgbCurveChannelPoints): Uint8Array {
  const lookup = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    lookup[i] = Math.round(sampleRgbCurve(points, i / 255) * 255)
  }
  return lookup
}

export function buildRgbCurveSvgPath(points: RgbCurveChannelPoints, samples = 64): string {
  const parts: string[] = []
  for (let i = 0; i <= samples; i++) {
    const input = i / samples
    const sx = input * 100
    const sy = (1 - sampleRgbCurve(points, input)) * 100
    parts.push(`${i === 0 ? 'M' : 'L'} ${sx} ${sy}`)
  }
  return parts.join(' ')
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

function collectMergeXs(base: RgbCurveChannelPoints, overlay: RgbCurveChannelPoints): number[] {
  const xs = new Set<number>([0, 1])
  for (const point of base) xs.add(point.x)
  for (const point of overlay) xs.add(point.x)
  return [...xs].sort((a, b) => a - b)
}

function mergeRgbCurveChannel(base: RgbCurveChannelPoints, overlay: RgbCurveChannelPoints): RgbCurveChannelPoints {
  if (!isRgbCurveChannelActive(overlay)) return base
  if (!isRgbCurveChannelActive(base)) return overlay

  return collectMergeXs(base, overlay).map((x) => ({
    x,
    y: clamp01(sampleRgbCurve(base, x) + (sampleRgbCurve(overlay, x) - x)),
  }))
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

function clampXBetweenNeighbors(points: RgbCurveChannelPoints, index: number, x: number): number {
  const minX = points[index - 1].x + RGB_CURVE_MIN_POINT_GAP
  const maxX = points[index + 1].x - RGB_CURVE_MIN_POINT_GAP
  if (minX >= maxX) return points[index].x
  return clamp01(Math.max(minX, Math.min(maxX, x)))
}

export function moveRgbCurvePoint(
  curves: RgbCurves,
  channel: RgbCurveChannel,
  pointIndex: number,
  x: number,
  y: number,
): RgbCurves {
  const points = curves[channel].map((p) => ({ ...p }))
  if (pointIndex < 0 || pointIndex >= points.length) return curves

  const isStart = pointIndex === 0
  const isEnd = pointIndex === points.length - 1
  points[pointIndex] = {
    x: isStart ? 0 : isEnd ? 1 : clampXBetweenNeighbors(points, pointIndex, x),
    y: clamp01(y),
  }

  return { ...curves, [channel]: sortRgbCurveChannel(points) }
}

export function addRgbCurvePoint(
  curves: RgbCurves,
  channel: RgbCurveChannel,
  x: number,
  y: number,
): RgbCurves {
  const points = curves[channel]
  if (points.length >= RGB_CURVE_MAX_POINTS) return curves

  const nextX = clamp01(x)
  const nextY = clamp01(y)
  const sorted = sortRgbCurveChannel([...points, { x: nextX, y: nextY }])

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].x - sorted[i - 1].x < RGB_CURVE_MIN_POINT_GAP) {
      return curves
    }
  }

  return { ...curves, [channel]: sorted }
}

export function removeRgbCurvePoint(
  curves: RgbCurves,
  channel: RgbCurveChannel,
  pointIndex: number,
): RgbCurves {
  const points = curves[channel]
  if (pointIndex <= 0 || pointIndex >= points.length - 1 || points.length <= 2) return curves
  return {
    ...curves,
    [channel]: points.filter((_, index) => index !== pointIndex),
  }
}

export function updateRgbCurvePoint(
  curves: RgbCurves,
  channel: RgbCurveChannel,
  pointIndex: number,
  output: number,
): RgbCurves {
  const point = curves[channel][pointIndex]
  if (!point) return curves
  return moveRgbCurvePoint(curves, channel, pointIndex, point.x, output)
}

export function resetRgbCurves(): RgbCurves {
  return {
    r: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
    g: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
    b: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
  }
}

export function findRgbCurvePointIndexAt(points: RgbCurveChannelPoints, x: number, tolerance = 0.04): number {
  let bestIndex = -1
  let bestDistance = Infinity
  for (let i = 0; i < points.length; i++) {
    const distance = Math.abs(points[i].x - x)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  }
  return bestDistance <= tolerance ? bestIndex : -1
}
