/** ユニット/E2E 共通のモノラル 16bit WAV 生成 */
export function makeWavWithPeak(peak: number, durationSec = 0.5): Uint8Array {
  const sampleRate = 44100
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec))
  const dataSize = numSamples * 2
  const buffer = new Uint8Array(44 + dataSize)
  const view = new DataView(buffer.buffer)

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) buffer[offset + i] = text.charCodeAt(i)
  }

  writeAscii(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(8, 'WAVE')
  writeAscii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(36, 'data')
  view.setUint32(40, dataSize, true)

  const sampleValue = Math.round(Math.min(1, Math.max(0, peak)) * 32767)
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, sampleValue, true)
  }
  return buffer
}

export function makeSilentWav(durationSec = 0.5): Uint8Array {
  return makeWavWithPeak(0, durationSec)
}
