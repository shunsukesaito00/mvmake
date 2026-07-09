import type { MediaAsset } from '../types/project'
import { createId } from '../utils/id'

const IMAGE_DEFAULT_DURATION = 5
const THUMBNAIL_TIMEOUT_MS = 8_000
const MAX_WAVEFORM_DECODE_BYTES = 5 * 1024 * 1024

export interface LoadMediaProgress {
  fileIndex: number
  fileTotal: number
  fileName: string
  phase: 'loading' | 'done'
}

export interface LoadMediaOptions {
  /** サムネイル生成をスキップ（後から enrichMediaAsset で追加） */
  deferThumbnail?: boolean
  /** 波形生成をスキップ（後から enrichMediaAsset で追加） */
  deferWaveform?: boolean
}

export function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

async function generateImageThumbnail(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(160 / img.width, 90 / img.height, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve('')
    img.src = url
  })
}

/** metadata + seek で1フレームだけ取得（onloadeddata は使わない） */
export async function generateVideoThumbnail(
  url: string,
  width?: number,
  height?: number,
): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    let settled = false

    const finish = (value: string) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      video.removeAttribute('src')
      video.load()
      resolve(value)
    }

    const timer = window.setTimeout(() => finish(''), THUMBNAIL_TIMEOUT_MS)

    video.onloadedmetadata = () => {
      const seekTo =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(0.1, video.duration * 0.1)
          : 0
      video.currentTime = seekTo
    }

    video.onseeked = () => {
      try {
        const w = width ?? video.videoWidth
        const h = height ?? video.videoHeight
        if (!w || !h) {
          finish('')
          return
        }
        const canvas = document.createElement('canvas')
        const scale = Math.min(160 / w, 90 / h, 1)
        canvas.width = w * scale
        canvas.height = h * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        finish(canvas.toDataURL('image/jpeg', 0.7))
      } catch {
        finish('')
      }
    }

    video.onerror = () => finish('')
    video.src = url
  })
}

async function generateThumbnail(
  type: 'video' | 'image',
  url: string,
  width?: number,
  height?: number,
): Promise<string> {
  if (type === 'image') return generateImageThumbnail(url)
  return generateVideoThumbnail(url, width, height)
}

async function generateWaveform(blob: Blob, samples = 100): Promise<number[]> {
  const decodeBlob =
    blob.size > MAX_WAVEFORM_DECODE_BYTES ? blob.slice(0, MAX_WAVEFORM_DECODE_BYTES) : blob
  const arrayBuffer = await decodeBlob.arrayBuffer()
  const audioContext = new AudioContext()
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const channel = audioBuffer.getChannelData(0)
    const blockSize = Math.max(1, Math.floor(channel.length / samples))
    const waveform: number[] = []
    for (let i = 0; i < samples; i++) {
      let sum = 0
      const start = i * blockSize
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channel[start + j] ?? 0)
      }
      waveform.push(sum / blockSize)
    }
    const max = Math.max(...waveform, 0.001)
    return waveform.map((v) => v / max)
  } catch {
    return Array(samples).fill(0.1)
  } finally {
    await audioContext.close()
  }
}

function getMediaType(file: File): 'video' | 'image' | 'audio' | null {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  return null
}

async function getVideoMetadata(url: string): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const timer = window.setTimeout(() => {
      video.removeAttribute('src')
      video.load()
      reject(new Error('Video metadata timeout'))
    }, THUMBNAIL_TIMEOUT_MS)

    video.onloadedmetadata = () => {
      window.clearTimeout(timer)
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }
    video.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error('Failed to load video'))
    }
    video.src = url
  })
}

async function getImageMetadata(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

async function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    const timer = window.setTimeout(() => {
      audio.removeAttribute('src')
      audio.load()
      reject(new Error('Audio metadata timeout'))
    }, THUMBNAIL_TIMEOUT_MS)

    audio.onloadedmetadata = () => {
      window.clearTimeout(timer)
      resolve(audio.duration)
    }
    audio.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error('Failed to load audio'))
    }
    audio.src = url
  })
}

async function loadMediaFile(file: File, options: LoadMediaOptions = {}): Promise<MediaAsset | null> {
  const { deferThumbnail = false, deferWaveform = false } = options
  const type = getMediaType(file)
  if (!type) return null

  const url = URL.createObjectURL(file)
  let duration = IMAGE_DEFAULT_DURATION
  let width: number | undefined
  let height: number | undefined
  let waveform: number[] | undefined

  try {
    if (type === 'video') {
      const meta = await getVideoMetadata(url)
      duration = meta.duration
      width = meta.width
      height = meta.height
    } else if (type === 'image') {
      const meta = await getImageMetadata(url)
      width = meta.width
      height = meta.height
    } else {
      duration = await getAudioDuration(url)
      if (!deferWaveform) {
        await yieldToMainThread()
        waveform = await generateWaveform(file)
      }
    }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }

  let thumbnail: string | undefined
  if (type !== 'audio' && !deferThumbnail) {
    await yieldToMainThread()
    thumbnail = await generateThumbnail(type, url, width, height)
  }

  return {
    id: createId(),
    name: file.name,
    type,
    blob: file,
    url,
    duration,
    width,
    height,
    thumbnail,
    waveform,
  }
}

/** サムネイル・波形など重い処理を後から追加 */
export async function enrichMediaAsset(asset: MediaAsset): Promise<Partial<MediaAsset>> {
  const updates: Partial<MediaAsset> = {}

  if (asset.type !== 'audio' && !asset.thumbnail) {
    await yieldToMainThread()
    updates.thumbnail = await generateThumbnail(asset.type, asset.url, asset.width, asset.height)
  }

  if (asset.type === 'audio' && !asset.waveform) {
    await yieldToMainThread()
    updates.waveform = await generateWaveform(asset.blob)
  }

  return updates
}

export async function loadMediaFiles(
  files: FileList | File[],
  options: LoadMediaOptions = { deferThumbnail: true, deferWaveform: true },
  onProgress?: (progress: LoadMediaProgress) => void,
): Promise<MediaAsset[]> {
  const fileArray = Array.from(files)
  const results: MediaAsset[] = []
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]!
    onProgress?.({
      fileIndex: i + 1,
      fileTotal: fileArray.length,
      fileName: file.name,
      phase: 'loading',
    })
    const asset = await loadMediaFile(file, options)
    if (asset) results.push(asset)
    onProgress?.({
      fileIndex: i + 1,
      fileTotal: fileArray.length,
      fileName: file.name,
      phase: 'done',
    })
    await yieldToMainThread()
  }
  return results
}

/** 録音 Blob をメディアアセットに変換 */
export async function createAudioAssetFromBlob(blob: Blob, name: string): Promise<MediaAsset | null> {
  const file = new File([blob], name, { type: blob.type || 'audio/webm' })
  return loadMediaFile(file, { deferThumbnail: true, deferWaveform: false })
}
