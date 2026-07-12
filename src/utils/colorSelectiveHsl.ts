import type { SelectiveHsl } from '../types/project'
import { DEFAULT_SELECTIVE_HSL } from '../types/project'

export function isSelectiveHslActive(selective: SelectiveHsl): boolean {
  if (!selective.enabled) return false
  return (
    Math.abs(selective.hueShift) > 0.001
    || Math.abs(selective.saturation) > 0.001
    || Math.abs(selective.luminance) > 0.001
  )
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
  else if (max === gn) h = ((bn - rn) / d + 2) * 60
  else h = ((rn - gn) / d + 4) * 60
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }

  const hue = ((h % 360) + 360) % 360 / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }

  return [
    Math.round(hue2rgb(hue + 1 / 3) * 255),
    Math.round(hue2rgb(hue) * 255),
    Math.round(hue2rgb(hue - 1 / 3) * 255),
  ]
}

function selectiveMaskWeight(pixelHue: number, targetHue: number, range: number): number {
  const dist = hueDistance(pixelHue, targetHue)
  if (dist >= range) return 0
  const t = 1 - dist / range
  return t * t * (3 - 2 * t)
}

/** 色相マスクで対象色域のみ HSL シフト */
export function applySelectiveHslToImageData(imageData: ImageData, selective: SelectiveHsl): void {
  if (!isSelectiveHslActive(selective)) return

  const { data } = imageData
  const hueShiftDeg = selective.hueShift * 90
  const satShift = selective.saturation
  const lumShift = selective.luminance

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    const weight = selectiveMaskWeight(h, selective.targetHue, selective.hueRange)
    if (weight < 0.001) continue

    let nh = h + hueShiftDeg * weight
    let ns = Math.max(0, Math.min(1, s + satShift * weight))
    let nl = Math.max(0, Math.min(1, l + lumShift * 0.5 * weight))
    if (nh < 0) nh += 360
    if (nh >= 360) nh -= 360

    const [r, g, b] = hslToRgb(nh, ns, nl)
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}

export function applyPixelSelectiveHslAdjustments(imageData: ImageData, selective: SelectiveHsl = DEFAULT_SELECTIVE_HSL): void {
  applySelectiveHslToImageData(imageData, selective)
}
