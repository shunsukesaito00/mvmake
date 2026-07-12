/** プレビュー canvas から輝度波形をサンプリング（列平均の簡易スコープ） */

export function sampleLuminanceWaveform(
  imageData: ImageData,
  bins = 64,
): number[] {
  const { width, height, data } = imageData
  if (width <= 0 || height <= 0) return Array.from({ length: bins }, () => 0)

  const values = new Array<number>(bins).fill(0)
  const counts = new Array<number>(bins).fill(0)

  for (let x = 0; x < width; x++) {
    const bin = Math.min(bins - 1, Math.floor((x / width) * bins))
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
      values[bin] += l
      counts[bin] += 1
    }
  }

  return values.map((sum, index) => (counts[index] ? sum / counts[index] : 0))
}

export function buildLuminanceWaveformPath(
  values: number[],
  width: number,
  height: number,
): string {
  if (!values.length || width <= 0 || height <= 0) return ''
  const step = width / values.length
  const parts: string[] = []

  values.forEach((value, index) => {
    const x = index * step + step / 2
    const y = height - Math.max(0, Math.min(1, value)) * height
    parts.push(`${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  })

  return parts.join(' ')
}

export function downsampleImageData(source: ImageData, maxWidth = 128): ImageData {
  if (source.width <= maxWidth) return source
  const scale = maxWidth / source.width
  const w = maxWidth
  const h = Math.max(1, Math.round(source.height * scale))
  const data = new Uint8ClampedArray(w * h * 4)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.floor((x / w) * source.width)
      const sy = Math.floor((y / h) * source.height)
      const si = (sy * source.width + sx) * 4
      const di = (y * w + x) * 4
      data[di] = source.data[si]
      data[di + 1] = source.data[si + 1]
      data[di + 2] = source.data[si + 2]
      data[di + 3] = source.data[si + 3]
    }
  }

  return { data, width: w, height: h, colorSpace: 'srgb' } as ImageData
}
