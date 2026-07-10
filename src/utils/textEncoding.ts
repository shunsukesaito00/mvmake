export type TextEncodingLabel = 'utf-8' | 'shift_jis' | 'euc-jp'

const DECODE_CANDIDATES: TextEncodingLabel[] = ['utf-8', 'shift_jis', 'euc-jp']

const ENCODING_LABELS: Record<TextEncodingLabel, string> = {
  'utf-8': 'UTF-8',
  shift_jis: 'Shift_JIS',
  'euc-jp': 'EUC-JP',
}

export function formatEncodingLabel(encoding: TextEncodingLabel): string {
  return ENCODING_LABELS[encoding]
}

function isReadableSubtitleText(text: string): boolean {
  if (!text.trim()) return false
  if (text.includes('\uFFFD')) return false

  let suspicious = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 9 || (code > 13 && code < 32)) suspicious++
  }
  return suspicious / Math.max(text.length, 1) < 0.02
}

function tryDecodeStrict(bytes: Uint8Array, encoding: string): string | null {
  try {
    const text = new TextDecoder(encoding, { fatal: true }).decode(bytes)
    return isReadableSubtitleText(text) ? text : null
  } catch {
    return null
  }
}

/** バイト列から字幕テキスト用エンコーディングを推定してデコード */
export function decodeTextBytes(bytes: Uint8Array): { text: string; encoding: TextEncodingLabel } {
  let data = bytes
  if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
    data = data.subarray(3)
    return { text: new TextDecoder('utf-8').decode(data), encoding: 'utf-8' }
  }

  for (const encoding of DECODE_CANDIDATES) {
    const text = tryDecodeStrict(data, encoding)
    if (text) return { text, encoding }
  }

  return { text: new TextDecoder('utf-8').decode(data), encoding: 'utf-8' }
}

export async function readTextFileWithEncoding(file: File): Promise<{ text: string; encoding: TextEncodingLabel }> {
  const buffer = await file.arrayBuffer()
  return decodeTextBytes(new Uint8Array(buffer))
}
