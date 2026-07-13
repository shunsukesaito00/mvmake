import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertExportEncoderSupport, buildAudioEncoderConfig, buildVideoEncoderConfig } from './exportPreflight'

function stubWebCodecsGlobals(videoSupported: boolean, audioSupported: boolean) {
  vi.stubGlobal('VideoEncoder', {
    isConfigSupported: vi.fn().mockResolvedValue({ supported: videoSupported }),
  })
  vi.stubGlobal('AudioEncoder', {
    isConfigSupported: vi.fn().mockResolvedValue({ supported: audioSupported }),
  })
  vi.stubGlobal('VideoFrame', class {})
  vi.stubGlobal('AudioData', class {})
}

describe('exportPreflight', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('buildVideoEncoderConfig は解像度と品質を反映する', () => {
    const config = buildVideoEncoderConfig({ width: 1920, height: 1080, fps: 30, quality: 'standard' })
    expect(config.width).toBe(1920)
    expect(config.height).toBe(1080)
    expect(config.framerate).toBe(30)
    expect(config.codec).toBe('avc1.42E01E')
  })

  it('buildAudioEncoderConfig は AAC を返す', () => {
    const config = buildAudioEncoderConfig('light')
    expect(config.codec).toBe('mp4a.40.2')
    expect(config.sampleRate).toBe(48000)
  })

  it('assertExportEncoderSupport は非対応映像設定で例外', async () => {
    stubWebCodecsGlobals(false, true)
    await expect(
      assertExportEncoderSupport({ width: 3840, height: 2160, fps: 30, quality: 'high' }),
    ).rejects.toThrow(/H\.264/)
  })

  it('assertExportEncoderSupport は非対応音声設定で例外', async () => {
    stubWebCodecsGlobals(true, false)
    await expect(
      assertExportEncoderSupport({ width: 1920, height: 1080, fps: 30, quality: 'standard' }),
    ).rejects.toThrow(/音声/)
  })
})
