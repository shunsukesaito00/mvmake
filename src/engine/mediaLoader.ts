import type { MediaAsset } from '../types/project'
import { createId } from '../utils/id'

const IMAGE_DEFAULT_DURATION = 5

async function generateThumbnail(
  type: 'video' | 'image',
  url: string,
  width?: number,
  height?: number,
): Promise<string> {
  if (type === 'image') {
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

  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'metadata'
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      const w = width ?? video.videoWidth
      const h = height ?? video.videoHeight
      const scale = Math.min(160 / w, 90 / h, 1)
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    video.onerror = () => resolve('')
    video.src = url
  })
}

async function generateWaveform(blob: Blob, samples = 100): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const audioContext = new AudioContext()
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
      const channel = audioBuffer.getChannelData(0)
      const blockSize = Math.floor(channel.length / samples)
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
    } finally {
      await audioContext.close()
    }
  } catch {
    return Array(samples).fill(0.1)
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
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }
    video.onerror = () => reject(new Error('Failed to load video'))
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
    audio.onloadedmetadata = () => resolve(audio.duration)
    audio.onerror = () => reject(new Error('Failed to load audio'))
    audio.src = url
  })
}

async function loadMediaFile(file: File): Promise<MediaAsset | null> {
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
      waveform = await generateWaveform(file)
    }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }

  const thumbnail = type !== 'audio' ? await generateThumbnail(type, url, width, height) : undefined

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

export async function loadMediaFiles(files: FileList | File[]): Promise<MediaAsset[]> {
  const results: MediaAsset[] = []
  for (const file of Array.from(files)) {
    const asset = await loadMediaFile(file)
    if (asset) results.push(asset)
  }
  return results
}

/** 録音 Blob などからオーディオ MediaAsset を生成する */
export async function createAudioAssetFromBlob(
  blob: Blob,
  name: string,
  durationHint?: number,
): Promise<MediaAsset | null> {
  const url = URL.createObjectURL(blob)
  let duration = durationHint ?? 0

  if (!durationHint) {
    try {
      duration = await getAudioDuration(url)
    } catch {
      URL.revokeObjectURL(url)
      return null
    }
  }

  if (duration < 0.1) {
    URL.revokeObjectURL(url)
    return null
  }

  const waveform = await generateWaveform(blob)

  return {
    id: createId(),
    name,
    type: 'audio',
    blob,
    url,
    duration,
    waveform,
  }
}
