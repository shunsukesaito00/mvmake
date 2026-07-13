import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  getActiveNativePlaybackClipId,
  isNativeVideoPlaybackActive,
  setNativeVideoFrameCallback,
  shouldUseNativeVideoPlayback,
  stopNativeVideoPlayback,
  syncNativeVideoPlayback,
  supportsNativeVideoPlayback,
} from './nativeVideoPlayback'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE, type VideoClip } from '../types/project'

const baseClip: VideoClip = {
  id: 'clip-a',
  trackId: 'track-v1',
  type: 'video',
  mediaId: 'media-a',
  startTime: 0,
  duration: 10,
  sourceStart: 0,
  sourceDuration: 10,
  transform: { ...DEFAULT_TRANSFORM },
  audio: { ...DEFAULT_AUDIO },
  speed: 2,
  color: { ...DEFAULT_COLOR },
  crop: { ...DEFAULT_CROP },
  ...DEFAULT_VISUAL_FADE,
}

function setupVideoDom() {
  class MockHTMLVideoElement {
    paused = true
    currentTime = 0
    playbackRate = 1
    play = vi.fn(async () => { this.paused = false })
    pause = vi.fn(() => { this.paused = true })
  }
  MockHTMLVideoElement.prototype.requestVideoFrameCallback = vi.fn(() => 1)
  MockHTMLVideoElement.prototype.cancelVideoFrameCallback = vi.fn()
  vi.stubGlobal('HTMLVideoElement', MockHTMLVideoElement)
}

function createMockVideo() {
  const Video = HTMLVideoElement as unknown as { new (): HTMLVideoElement }
  const video = new Video()
  let rvfc: ((now: number, metadata: { mediaTime: number }) => void) | null = null
  video.requestVideoFrameCallback = vi.fn((cb: (now: number, metadata: { mediaTime: number }) => void) => {
    rvfc = cb
    return 1
  }) as HTMLVideoElement['requestVideoFrameCallback']
  ;(video as unknown as { fireFrame: () => void }).fireFrame = () => rvfc?.(0, { mediaTime: video.currentTime })
  return video as HTMLVideoElement & { fireFrame: () => void }
}

describe('nativeVideoPlayback', () => {
  beforeEach(() => {
    setupVideoDom()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setNativeVideoFrameCallback(null)
    stopNativeVideoPlayback(() => null)
  })

  it('shouldUseNativeVideoPlayback は逆シャトル時は false', () => {
    expect(supportsNativeVideoPlayback()).toBe(true)
    expect(shouldUseNativeVideoPlayback(true, 1)).toBe(true)
    expect(shouldUseNativeVideoPlayback(true, -1)).toBe(false)
    expect(shouldUseNativeVideoPlayback(false, 2)).toBe(false)
  })

  it('syncNativeVideoPlayback は前面クリップを play し playbackRate を速度に合わせる', () => {
    const video = createMockVideo()
    const listener = vi.fn()
    setNativeVideoFrameCallback(listener)

    syncNativeVideoPlayback({
      foregroundClip: baseClip,
      time: 2,
      shuttleRate: 1,
      getVideoElement: (mediaId) => (mediaId === 'media-a' ? video : null),
    })

    expect(getActiveNativePlaybackClipId()).toBe('clip-a')
    expect(isNativeVideoPlaybackActive()).toBe(true)
    expect(video.play).toHaveBeenCalled()
    expect(video.playbackRate).toBe(2)
    expect(video.requestVideoFrameCallback).toHaveBeenCalled()

    ;(video as HTMLVideoElement & { fireFrame: () => void }).fireFrame()
    expect(listener).toHaveBeenCalled()
  })
})
