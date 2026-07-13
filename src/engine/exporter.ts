import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import type { Project } from '../types/project'
import { renderFrame, seekVideosToTime } from './compositor'
import { mixAudioOffline } from './audioEngine'
import { ensureProjectFontsLoaded } from '../utils/googleFonts'
import { assertExportEncoderSupport, buildAudioEncoderConfig, buildVideoEncoderConfig } from '../utils/exportPreflight'

export function isWebCodecsSupported(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof AudioEncoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined' &&
    typeof AudioData !== 'undefined'
  )
}

function audioBufferToF32Planar(buffer: AudioBuffer): Float32Array[] {
  const channels: Float32Array[] = []
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    channels.push(buffer.getChannelData(ch))
  }
  return channels
}

export type ExportQuality = 'high' | 'standard' | 'light'

export const QUALITY_PRESETS: Record<ExportQuality, { label: string; description: string; videoBitrate: number; audioBitrate: number }> = {
  high: { label: '高品質', description: '結婚式場での上映向け', videoBitrate: 16_000_000, audioBitrate: 256_000 },
  standard: { label: '標準', description: 'バランス重視', videoBitrate: 8_000_000, audioBitrate: 192_000 },
  light: { label: '軽量', description: 'SNS共有・確認用', videoBitrate: 4_000_000, audioBitrate: 128_000 },
}

export interface ExportOptions {
  signal?: AbortSignal
  startTime?: number
  quality?: ExportQuality
}

/** WebCodecs のエンコーダエラーをユーザー向けメッセージに変換する */
function friendlyEncoderError(kind: '映像' | '音声', e: DOMException): Error {
  console.error(`${kind}エンコーダーエラー:`, e)
  if (e.name === 'QuotaExceededError') {
    return new Error('メモリ不足のため書き出しに失敗しました。他のタブを閉じるか、解像度・品質を下げて再試行してください。')
  }
  if (e.name === 'NotSupportedError') {
    return new Error(`この環境では${kind}のエンコード設定がサポートされていません。解像度や品質を変更して再試行してください。`)
  }
  return new Error(`${kind}のエンコード中にエラーが発生しました。解像度・品質を下げて再試行してください。`)
}

function toDomException(err: unknown): DOMException {
  if (err instanceof DOMException) return err
  return new DOMException(err instanceof Error ? err.message : String(err))
}

function safeCloseEncoder(encoder: VideoEncoder | AudioEncoder | null): void {
  if (!encoder || encoder.state === 'closed') return
  try {
    encoder.close()
  } catch {
    // 失敗・キャンセル後の close は環境依存で throw しうる
  }
}

export async function exportProject(
  project: Project,
  duration: number,
  onProgress: (progress: number) => void,
  options: ExportOptions = {},
): Promise<Blob> {
  const { signal, startTime = 0, quality = 'standard' } = options
  const { width, height, fps } = project

  await assertExportEncoderSupport({ width, height, fps, quality })

  const checkAborted = () => {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
  }

  const totalFrames = Math.ceil(duration * fps)

  await ensureProjectFontsLoaded(project)
  checkAborted()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height },
    audio: { codec: 'aac', sampleRate: 48000, numberOfChannels: 2 },
    fastStart: 'in-memory',
  })

  let encoderError: Error | null = null
  const checkEncoderError = () => {
    if (encoderError) throw encoderError
  }

  let videoEncoder: VideoEncoder | null = null
  let audioEncoder: AudioEncoder | null = null

  try {
    videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { encoderError ??= friendlyEncoderError('映像', e) },
    })

    const videoConfig = buildVideoEncoderConfig({ width, height, fps, quality })
    try {
      videoEncoder.configure(videoConfig)
    } catch (e) {
      throw friendlyEncoderError('映像', toDomException(e))
    }

    onProgress(0.05)
    checkAborted()

    const audioBuffer = await mixAudioOffline(project, duration, 48000, { startTime })
    checkAborted()

    const audioData = audioBufferToF32Planar(audioBuffer)
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => { encoderError ??= friendlyEncoderError('音声', e) },
    })

    const audioConfig = buildAudioEncoderConfig(quality)
    try {
      audioEncoder.configure(audioConfig)
    } catch (e) {
      throw friendlyEncoderError('音声', toDomException(e))
    }

    const samplesPerFrame = Math.floor(48000 / fps)
    let audioSampleOffset = 0
    const audioEndSample = Math.min(Math.floor(duration * 48000), audioBuffer.length)

    for (let frame = 0; frame < totalFrames; frame++) {
      checkAborted()
      checkEncoderError()

      const time = startTime + frame / fps
      await seekVideosToTime(project, time)
      await renderFrame(ctx, project, time)

      const videoFrame = new VideoFrame(canvas, { timestamp: (frame * 1_000_000) / fps })
      try {
        videoEncoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 })
      } finally {
        videoFrame.close()
      }

      const endSample = Math.min(audioSampleOffset + samplesPerFrame, audioEndSample, audioBuffer.length)
      const frameLength = endSample - audioSampleOffset
      if (frameLength > 0) {
        const interleaved = new Float32Array(frameLength * 2)
        const left = audioData[0]
        const right = audioData[1] ?? audioData[0]
        for (let i = 0; i < frameLength; i++) {
          interleaved[i * 2] = left[audioSampleOffset + i] ?? 0
          interleaved[i * 2 + 1] = right[audioSampleOffset + i] ?? 0
        }
        const audioFrame = new AudioData({
          format: 'f32',
          sampleRate: 48000,
          numberOfFrames: frameLength,
          numberOfChannels: 2,
          timestamp: (audioSampleOffset / 48000) * 1_000_000,
          data: interleaved,
        })
        try {
          audioEncoder.encode(audioFrame)
        } finally {
          audioFrame.close()
        }
        audioSampleOffset = endSample
      }

      onProgress(0.1 + (frame / totalFrames) * 0.85)

      if (frame % 5 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }

    checkAborted()
    checkEncoderError()

    try {
      await videoEncoder.flush()
      await audioEncoder.flush()
    } catch (e) {
      checkEncoderError()
      throw e
    }
    checkEncoderError()
    muxer.finalize()

    onProgress(1)
    return new Blob([target.buffer], { type: 'video/mp4' })
  } finally {
    safeCloseEncoder(videoEncoder)
    safeCloseEncoder(audioEncoder)
  }
}
