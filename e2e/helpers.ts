/** E2E 用の最小 WebM 動画をブラウザ内で生成（MediaRecorder + canvas） */
export async function makeTinyWebmVideo(page: import('@playwright/test').Page): Promise<Buffer> {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 90
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, 160, 90)

    const stream = canvas.captureStream(10)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []

    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onerror = () => reject(new Error('MediaRecorder failed'))
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
      recorder.start(100)
      window.setTimeout(() => recorder.stop(), 400)
    })

    stream.getTracks().forEach((track) => track.stop())
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })

  return Buffer.from(bytes)
}

export function makeSilentWav(durationSec = 0.5): Buffer {
  return makeWavWithPeak(0, durationSec)
}

/** 指定ピーク振幅（0〜1）のモノラル 16bit WAV を生成 */
export function makeWavWithPeak(peak: number, durationSec = 0.5): Buffer {
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

  const sampleValue = Math.round(Math.min(1, Math.max(0, peak)) * 32767)
  for (let i = 0; i < numSamples; i++) {
    buffer.writeInt16LE(sampleValue, 44 + i * 2)
  }
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
