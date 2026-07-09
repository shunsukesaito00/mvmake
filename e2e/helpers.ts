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

/** MediaRecorder / getUserMedia をモックしてナレーション録音 E2E を可能にする */
export async function installNarrationRecordingMocks(
  page: import('@playwright/test').Page,
  wavBuffer: Buffer = makeSilentWav(0.5),
) {
  const encoded = wavBuffer.toString('base64')
  await page.addInitScript((b64: string) => {
    localStorage.setItem('fable-onboarded', '1')

    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const fakeBlob = () => new Blob([bytes], { type: 'audio/wav' })

    class MockMediaRecorder {
      stream: MediaStream
      ondataavailable: ((event: BlobEvent) => void) | null = null
      onstop: (() => void) | null = null
      state: RecordingState = 'inactive'

      constructor(stream: MediaStream) {
        this.stream = stream
      }

      start() {
        this.state = 'recording'
      }

      stop() {
        this.state = 'inactive'
        this.ondataavailable?.({ data: fakeBlob() } as BlobEvent)
        this.onstop?.()
      }
    }

    ;(MockMediaRecorder as unknown as typeof MediaRecorder).isTypeSupported = () => true
    window.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder

    navigator.mediaDevices.getUserMedia = async () =>
      ({
        getTracks: () => [{ stop: () => {} }],
      }) as MediaStream
  }, encoded)
}
