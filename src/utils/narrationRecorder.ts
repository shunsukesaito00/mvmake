const RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const

export type NarrationRecorderStatus = 'idle' | 'recording' | 'recorded'

export function isNarrationRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  )
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  const match = RECORDER_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
  return match ?? 'audio/webm'
}

export function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a'
  return 'webm'
}

export function buildNarrationFileName(mimeType: string, date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const ext = extensionForMimeType(mimeType)
  return `narration-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.${ext}`
}

export function mergeRecordedChunks(chunks: Blob[]): Blob | null {
  if (chunks.length === 0) return null
  const mimeType = chunks[0]?.type || pickRecorderMimeType()
  return new Blob(chunks, { type: mimeType })
}

export function formatRecordingElapsed(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const secs = whole % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}
