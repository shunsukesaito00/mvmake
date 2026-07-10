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

export type NarrationRecorderErrorCode =
  | 'unsupported'
  | 'permission_denied'
  | 'no_device'
  | 'device_busy'
  | 'recorder_error'
  | 'empty_recording'
  | 'unknown'

export interface NarrationRecorderErrorInfo {
  code: NarrationRecorderErrorCode
  title: string
  message: string
  guidance: string
}

export function narrationUnsupportedError(): NarrationRecorderErrorInfo {
  return {
    code: 'unsupported',
    title: 'このブラウザでは録音できません',
    message: 'マイク録音には MediaRecorder と getUserMedia に対応したブラウザが必要です。',
    guidance: 'Chrome / Edge / Safari の最新版をお使いください。',
  }
}

export function narrationEmptyRecordingError(): NarrationRecorderErrorInfo {
  return {
    code: 'empty_recording',
    title: '録音データが空です',
    message: 'マイク入力を取得できなかったか、録音時間が短すぎました。',
    guidance: 'マイクが正しく接続されているか確認し、もう一度録音してください。',
  }
}

export function narrationRecorderRuntimeError(): NarrationRecorderErrorInfo {
  return {
    code: 'recorder_error',
    title: '録音中にエラーが発生しました',
    message: '録音処理が中断されました。',
    guidance: 'ブラウザを再読み込みするか、他のアプリでマイクを使っていないか確認してから再試行してください。',
  }
}

/** getUserMedia / DOMException をユーザー向けメッセージへ分類 */
export function classifyGetUserMediaError(error: unknown): NarrationRecorderErrorInfo {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          code: 'permission_denied',
          title: 'マイクの使用が許可されていません',
          message: 'ブラウザまたは OS でマイクへのアクセスがブロックされています。',
          guidance:
            'アドレスバー左の鍵／設定アイコンからこのサイトのマイクを「許可」に変更してください。macOS では「システム設定 → プライバシーとセキュリティ → マイク」でブラウザを許可する必要があります。',
        }
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          code: 'no_device',
          title: 'マイクが見つかりません',
          message: '利用可能なマイク入力デバイスがありません。',
          guidance: 'マイクやヘッドセットを接続し、OS のサウンド設定で入力デバイスが認識されているか確認してから再試行してください。',
        }
      case 'NotReadableError':
        return {
          code: 'device_busy',
          title: 'マイクを使用できません',
          message: '他のアプリがマイクを占有している可能性があります。',
          guidance: 'ビデオ会議アプリなどを終了してから再試行してください。',
        }
      case 'OverconstrainedError':
        return {
          code: 'no_device',
          title: 'マイクの設定に問題があります',
          message: '要求したマイク設定に合うデバイスが見つかりませんでした。',
          guidance: '別のマイクを選択するか、入力デバイスを接続してから再試行してください。',
        }
      default:
        break
    }
  }

  return {
    code: 'unknown',
    title: 'マイクの取得に失敗しました',
    message: '原因不明のエラーが発生しました。',
    guidance: 'ブラウザを再読み込みし、マイク権限を確認してから再試行してください。',
  }
}

export function canRetryNarrationError(code: NarrationRecorderErrorCode): boolean {
  return code !== 'unsupported'
}
