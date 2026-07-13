export const VIDEO_SEEK_TIMEOUT_MS = 3000
export const VIDEO_SEEK_TOLERANCE_SEC = 0.03

export interface VideoSeekOptions {
  timeoutMs?: number
  toleranceSec?: number
}

/** HTMLVideoElement を指定時刻へシーク（タイムアウト・error ハンドリング付き） */
export function seekVideoElement(
  video: HTMLVideoElement,
  sourceTime: number,
  options: VideoSeekOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? VIDEO_SEEK_TIMEOUT_MS
  const toleranceSec = options.toleranceSec ?? VIDEO_SEEK_TOLERANCE_SEC

  if (Math.abs(video.currentTime - sourceTime) <= toleranceSec) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timer)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
    }

    const onSeeked = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      const code = video.error?.code
      reject(new Error(
        `動画のシークに失敗しました${code != null ? ` (code ${code})` : ''}。別の動画ファイルをお試しください。`,
      ))
    }

    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error(
        `動画のシークがタイムアウトしました（${timeoutMs}ms）。別の動画ファイルをお試しください。`,
      ))
    }, timeoutMs)

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)
    video.currentTime = sourceTime
  })
}
