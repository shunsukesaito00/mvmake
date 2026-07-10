import type { LutAsset } from '../types/project'

export interface ParsedCubeLut {
  size: number
  title?: string
  /** size³ × 3 (RGB)。インデックスは B→G→R の順 */
  data: Float32Array
}

const SIZE_PATTERN = /^LUT_3D_SIZE\s+(\d+)\s*$/i
const TITLE_PATTERN = /^TITLE\s+"([^"]*)"\s*$/i

export function parseCubeLut(text: string): ParsedCubeLut | null {
  let size = 0
  let title: string | undefined
  const values: number[] = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const titleMatch = line.match(TITLE_PATTERN)
    if (titleMatch) {
      title = titleMatch[1]
      continue
    }

    const sizeMatch = line.match(SIZE_PATTERN)
    if (sizeMatch) {
      size = Number(sizeMatch[1])
      continue
    }

    if (/^DOMAIN_MIN\b/i.test(line) || /^DOMAIN_MAX\b/i.test(line)) continue

    const parts = line.split(/\s+/).map(Number)
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) continue
    values.push(parts[0], parts[1], parts[2])
  }

  if (size < 2) return null
  const expected = size * size * size * 3
  if (values.length < expected) return null

  return {
    size,
    title,
    data: Float32Array.from(values.slice(0, expected)),
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function lutIndex(lut: ParsedCubeLut, r: number, g: number, b: number): number {
  const { size } = lut
  const ri = Math.max(0, Math.min(size - 1, r))
  const gi = Math.max(0, Math.min(size - 1, g))
  const bi = Math.max(0, Math.min(size - 1, b))
  const idx = (bi * size * size + gi * size + ri) * 3
  return idx
}

/** 3D LUT をトリリニア補間でサンプル */
export function sampleCubeLut(lut: ParsedCubeLut, r: number, g: number, b: number): [number, number, number] {
  const { size, data } = lut
  const max = size - 1
  const rf = clamp01(r) * max
  const gf = clamp01(g) * max
  const bf = clamp01(b) * max

  const r0 = Math.floor(rf)
  const g0 = Math.floor(gf)
  const b0 = Math.floor(bf)
  const r1 = Math.min(r0 + 1, max)
  const g1 = Math.min(g0 + 1, max)
  const b1 = Math.min(b0 + 1, max)

  const dr = rf - r0
  const dg = gf - g0
  const db = bf - b0

  const c000 = lutIndex(lut, r0, g0, b0)
  const c100 = lutIndex(lut, r1, g0, b0)
  const c010 = lutIndex(lut, r0, g1, b0)
  const c110 = lutIndex(lut, r1, g1, b0)
  const c001 = lutIndex(lut, r0, g0, b1)
  const c101 = lutIndex(lut, r1, g0, b1)
  const c011 = lutIndex(lut, r0, g1, b1)
  const c111 = lutIndex(lut, r1, g1, b1)

  const out: [number, number, number] = [0, 0, 0]
  for (let ch = 0; ch < 3; ch++) {
    const v000 = data[c000 + ch]
    const v100 = data[c100 + ch]
    const v010 = data[c010 + ch]
    const v110 = data[c110 + ch]
    const v001 = data[c001 + ch]
    const v101 = data[c101 + ch]
    const v011 = data[c011 + ch]
    const v111 = data[c111 + ch]

    const c00 = v000 + (v100 - v000) * dr
    const c10 = v010 + (v110 - v010) * dr
    const c01 = v001 + (v101 - v001) * dr
    const c11 = v011 + (v111 - v011) * dr
    const c0 = c00 + (c10 - c00) * dg
    const c1 = c01 + (c11 - c01) * dg
    out[ch] = clamp01(c0 + (c1 - c0) * db)
  }

  return out
}

export function applyLutToImageData(
  imageData: ImageData,
  lut: ParsedCubeLut,
  intensity = 1,
): void {
  const mix = Math.max(0, Math.min(1, intensity))
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    const [lr, lg, lb] = sampleCubeLut(lut, r, g, b)
    data[i] = Math.round((r + (lr - r) * mix) * 255)
    data[i + 1] = Math.round((g + (lg - g) * mix) * 255)
    data[i + 2] = Math.round((b + (lb - b) * mix) * 255)
  }
}

const parsedLutCache = new Map<string, ParsedCubeLut>()

export function getCachedParsedLut(lutId: string, blob: Blob): ParsedCubeLut | null {
  const cached = parsedLutCache.get(lutId)
  if (cached) return cached

  // sync path not available without text - caller should use parseCubeLutFromBlob
  void blob
  return null
}

export async function parseCubeLutFromBlob(lutId: string, blob: Blob): Promise<ParsedCubeLut | null> {
  const cached = parsedLutCache.get(lutId)
  if (cached) return cached

  const text = await blob.text()
  const parsed = parseCubeLut(text)
  if (parsed) parsedLutCache.set(lutId, parsed)
  return parsed
}

export function primeParsedLutCache(lutId: string, parsed: ParsedCubeLut): void {
  parsedLutCache.set(lutId, parsed)
}

export function clearParsedLutCache(lutId?: string): void {
  if (lutId) parsedLutCache.delete(lutId)
  else parsedLutCache.clear()
}

export function getParsedLutById(lutId: string): ParsedCubeLut | undefined {
  return parsedLutCache.get(lutId)
}

export async function preloadProjectLuts(lutAssets: LutAsset[]): Promise<void> {
  await Promise.all(lutAssets.map((asset) => parseCubeLutFromBlob(asset.id, asset.blob)))
}
