import { isWebCodecsSupported, QUALITY_PRESETS, type ExportQuality } from '../engine/exporter'
import { scaleVideoBitrate } from './exportResolution'

export interface ExportEncoderParams {
  width: number
  height: number
  fps: number
  quality: ExportQuality
}

function buildVideoEncoderConfig(params: ExportEncoderParams): VideoEncoderConfig {
  const preset = QUALITY_PRESETS[params.quality]
  return {
    codec: 'avc1.42E01E',
    width: params.width,
    height: params.height,
    bitrate: scaleVideoBitrate(preset.videoBitrate, params.width, params.height),
    framerate: params.fps,
  }
}

function buildAudioEncoderConfig(quality: ExportQuality): AudioEncoderConfig {
  const preset = QUALITY_PRESETS[quality]
  return {
    codec: 'mp4a.40.2',
    sampleRate: 48000,
    numberOfChannels: 2,
    bitrate: preset.audioBitrate,
  }
}

/** 書き出し前に映像・音声エンコーダ設定がサポートされるか検証する */
export async function assertExportEncoderSupport(params: ExportEncoderParams): Promise<void> {
  if (!isWebCodecsSupported()) {
    throw new Error('このブラウザはWebCodecsに対応していません。Chrome、Edge、Safariをご利用ください。')
  }

  const videoConfig = buildVideoEncoderConfig(params)
  const videoSupport = await VideoEncoder.isConfigSupported(videoConfig).catch(() => null)
  if (videoSupport?.supported === false) {
    throw new Error(
      `この環境では ${params.width}×${params.height} のH.264エンコードがサポートされていません。解像度を下げて再試行してください。`,
    )
  }

  const audioConfig = buildAudioEncoderConfig(params.quality)
  const audioSupport = await AudioEncoder.isConfigSupported(audioConfig).catch(() => null)
  if (audioSupport?.supported === false) {
    throw new Error('この環境では音声のエンコード設定がサポートされていません。品質を変更して再試行してください。')
  }
}

export { buildVideoEncoderConfig, buildAudioEncoderConfig }
