export const NARRATION_MIN_DURATION_SEC = 0.1

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

export function isNarrationRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

export function formatNarrationFileName(recordedAt = new Date()): string {
  const stamp = recordedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `ナレーション_${stamp}.webm`
}

export function buildRecordingBlob(chunks: BlobPart[], mimeType: string): Blob {
  return new Blob(chunks, { type: mimeType })
}

export function formatRecordingDuration(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const mins = Math.floor(clamped / 60)
  const secs = Math.floor(clamped % 60)
  const frac = Math.floor((clamped % 1) * 10)
  return mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}.${frac}`
    : `${secs}.${frac}s`
}
