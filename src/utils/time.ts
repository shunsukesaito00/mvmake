export function sanitizeMediaDuration(duration: number, fallback = 5): number {
  return Number.isFinite(duration) && duration > 0 ? duration : fallback
}

export function formatTime(seconds: number, fps = 30): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * fps)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
}

export function snapTime(time: number, snapPoints: number[], threshold = 0.15): number {
  for (const point of snapPoints) {
    if (Math.abs(time - point) < threshold) {
      return point
    }
  }
  return time
}

export function getProjectDuration(tracks: { clips: { startTime: number; duration: number }[] }[]): number {
  let max = 0
  for (const track of tracks) {
    for (const clip of track.clips) {
      const end = clip.startTime + clip.duration
      if (Number.isFinite(end)) max = Math.max(max, end)
    }
  }
  return max
}
