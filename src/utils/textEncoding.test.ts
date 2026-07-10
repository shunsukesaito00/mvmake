import { describe, expect, it } from 'vitest'
import { decodeTextBytes, formatEncodingLabel } from './textEncoding'

/** 「乾杯のご挨拶」の Shift_JIS バイト列 */
const SAMPLE_SHIFT_JIS_BYTES = new Uint8Array([
  0x8a, 0xa3, 0x94, 0x74, 0x82, 0xcc, 0x82, 0xb2, 0x88, 0xa5, 0x8e, 0x41,
])

describe('textEncoding', () => {
  it('UTF-8 BOM を除去してデコードする', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('字幕')])
    const { text, encoding } = decodeTextBytes(bytes)
    expect(encoding).toBe('utf-8')
    expect(text).toBe('字幕')
  })

  it('UTF-8 テキストをデコードする', () => {
    const bytes = new TextEncoder().encode('乾杯のご挨拶')
    const { text, encoding } = decodeTextBytes(bytes)
    expect(encoding).toBe('utf-8')
    expect(text).toBe('乾杯のご挨拶')
  })

  it('Shift_JIS テキストをデコードする', () => {
    const { text, encoding } = decodeTextBytes(SAMPLE_SHIFT_JIS_BYTES)
    expect(encoding).toBe('shift_jis')
    expect(text).toBe('乾杯のご挨拶')
  })

  it('formatEncodingLabel が表示名を返す', () => {
    expect(formatEncodingLabel('shift_jis')).toBe('Shift_JIS')
  })
})
