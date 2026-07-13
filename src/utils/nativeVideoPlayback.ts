import type { MediaAsset, VideoClip } from '../types/project'
import { isReverseShuttleRate, type PlaybackShuttleRate } from './playbackShuttle'
import { getSpeedAtLocalTime, getVideoSourceTimeAtLocalTime } from './speedKeyframes'
import { VIDEO_SEEK_TOLERANCE_SEC } from './videoSeek'

export const NATIVE_VIDEO_DRIFT_TOLERANCE_SEC = 0.12

let activeClipId: string | null = null
let activeMediaId: string | null = null
let rvfcId = 0
let frameCallback: (() => void) | null = null

export function supportsNativeVideoPlayback(): boolean {
  return typeof HTMLVideoElement !== 'undefined'
    && typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function'
}

export function getActiveNativePlaybackClipId(): string | null {
  return activeClipId
}

export function isNativeVideoPlaybackActive(): boolean {
  return activeClipId !== null
}

export function setNativeVideoFrameCallback(callback: (() => void) | null): void {
  frameCallback = callback
}

function cancelVideoFrameCallback(video: HTMLVideoElement): void {
  if (rvfcId && video.cancelVideoFrameCallback) {
    video.cancelVideoFrameCallback(rvfcId)
  }
  rvfcId = 0
}

function scheduleVideoFrameCallback(video: HTMLVideoElement): void {
  if (!supportsNativeVideoPlayback() || !video.requestVideoFrameCallback) return
  cancelVideoFrameCallback(video)
  rvfcId = video.requestVideoFrameCallback(() => {
    rvfcId = 0
    frameCallback?.()
    if (activeMediaId && !video.paused) scheduleVideoFrameCallback(video)
  })
}

export function stopNativeVideoPlayback(getVideoElement: (mediaId: string) => HTMLVideoElement | null): void {
  if (activeMediaId) {
    const video = getVideoElement(activeMediaId)
    if (video) {
      cancelVideoFrameCallback(video)
      if (!video.paused) video.pause()
    }
  }
  activeClipId = null
  activeMediaId = null
}

export function syncNativeVideoPlayback(params: {
  foregroundClip: VideoClip
  time: number
  shuttleRate: PlaybackShuttleRate
  getVideoElement: (mediaId: string) => HTMLVideoElement | null
}): void {
  const { foregroundClip, time, shuttleRate, getVideoElement } = params
  const video = getVideoElement(foregroundClip.mediaId)
  if (!video) {
    activeClipId = null
    activeMediaId = null
    return
  }

  if (activeMediaId && activeMediaId !== foregroundClip.mediaId) {
    const previous = getVideoElement(activeMediaId)
    if (previous) {
      cancelVideoFrameCallback(previous)
      if (!previous.paused) previous.pause()
    }
  }

  activeClipId = foregroundClip.id
  activeMediaId = foregroundClip.mediaId

  const localTime = Math.max(0, time - foregroundClip.startTime)
  const sourceTime = getVideoSourceTimeAtLocalTime(foregroundClip, localTime)
  const playbackRate = Math.max(0.0625, Math.min(16, getSpeedAtLocalTime(foregroundClip, localTime) * shuttleRate))

  if (Math.abs(video.playbackRate - playbackRate) > 0.01) {
    video.playbackRate = playbackRate
  }

  const drift = Math.abs(video.currentTime - sourceTime)
  if (video.paused || drift > NATIVE_VIDEO_DRIFT_TOLERANCE_SEC) {
    if (drift > VIDEO_SEEK_TOLERANCE_SEC) video.currentTime = sourceTime
    void video.play().catch(() => {})
  }

  scheduleVideoFrameCallback(video)
}

export function shouldUseNativeVideoPlayback(playing: boolean, shuttleRate: PlaybackShuttleRate): boolean {
  return playing && supportsNativeVideoPlayback() && !isReverseShuttleRate(shuttleRate)
}

export function createVideoElementAccessor(assetMap: Map<string, MediaAsset>, getVideoElement: (asset: MediaAsset) => HTMLVideoElement) {
  return (mediaId: string) => {
    const asset = assetMap.get(mediaId)
    return asset?.type === 'video' ? getVideoElement(asset) : null
  }
}
