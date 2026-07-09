/** E2E 用の最小 WAV (PCM mono) を生成 */
export function makeSilentWav(durationSec = 0.5): Buffer {
  const sampleRate = 44100
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec))
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  return buffer
}

/** MediaRecorder / getUserMedia をモックする init スクリプト（ナレーション録音 E2E 用） */
export const mockNarrationRecordingScript = `
(() => {
  function makeSilentWavBlob(durationSec) {
    const sampleRate = 44100
    const numSamples = Math.max(1, Math.floor(sampleRate * durationSec))
    const dataSize = numSamples * 2
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
    }
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, 'data')
    view.setUint32(40, dataSize, true)
    return new Blob([buffer], { type: 'audio/webm' })
  }

  navigator.mediaDevices.getUserMedia = async () => {
    const ctx = new AudioContext()
    return ctx.createMediaStreamDestination().stream
  }

  class MockMediaRecorder {
  constructor(stream) {
      this.stream = stream
      this.mimeType = 'audio/webm'
      this.state = 'inactive'
      this.ondataavailable = null
      this.onstop = null
      this.onerror = null
      this._startedAt = 0
    }
    start() {
      this.state = 'recording'
      this._startedAt = Date.now()
    }
    stop() {
      this.state = 'inactive'
      const durationSec = Math.max(0.2, (Date.now() - this._startedAt) / 1000)
      const blob = makeSilentWavBlob(durationSec)
      this.ondataavailable?.({ data: blob })
      this.onstop?.()
    }
    static isTypeSupported() { return true }
  }

  window.MediaRecorder = MockMediaRecorder
})()
`
