import { expect } from '@playwright/test'
import { makeSilentWav, makeWavWithPeak } from '../src/utils/wavFixtures'

export function makeSilentWavBuffer(durationSec = 0.5): Buffer {
  return Buffer.from(makeSilentWav(durationSec))
}

export function makeWavWithPeakBuffer(peak: number, durationSec = 0.5): Buffer {
  return Buffer.from(makeWavWithPeak(peak, durationSec))
}

export { makeSilentWavBuffer as makeSilentWav, makeWavWithPeakBuffer as makeWavWithPeak }

/** E2E 用 1x1 PNG */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

export async function loadChapterExportStressProject(page: import('@playwright/test').Page) {
  const stats = await page.evaluate(() => {
    if (!window.__FABLE_E2E__) throw new Error('E2E bridge not installed')
    return window.__FABLE_E2E__.loadChapterExportStressProject()
  })
  return stats
}

export async function loadChapterExportE2eProject(page: import('@playwright/test').Page) {
  const stats = await page.evaluate(() => {
    if (!window.__FABLE_E2E__) throw new Error('E2E bridge not installed')
    return window.__FABLE_E2E__.loadChapterExportE2eProject()
  })
  return stats
}

export async function loadPhotoGuideSlideshowStress(page: import('@playwright/test').Page) {
  const stats = await page.evaluate(() => {
    if (!window.__FABLE_E2E__) throw new Error('E2E bridge not installed')
    return window.__FABLE_E2E__.loadPhotoGuideSlideshowStress()
  })
  return stats
}

export async function loadMarkerEditStress(page: import('@playwright/test').Page) {
  const stats = await page.evaluate(() => {
    if (!window.__FABLE_E2E__) throw new Error('E2E bridge not installed')
    return window.__FABLE_E2E__.loadMarkerEditStress()
  })
  return stats
}

export async function clearTextStylePresets(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    if (!window.__FABLE_E2E__) throw new Error('E2E bridge not installed')
    window.__FABLE_E2E__.clearTextStylePresets()
  })
}

export async function loadTextStylePresetStress(page: import('@playwright/test').Page) {
  const stats = await page.evaluate(() => {
    if (!window.__FABLE_E2E__) throw new Error('E2E bridge not installed')
    return window.__FABLE_E2E__.loadTextStylePresetStress()
  })
  return stats
}

export async function applyWeddingFullTemplate(page: import('@playwright/test').Page) {
  await page.getByTitle('テンプレ').click()
  await page.getByRole('button', { name: /結婚式フル構成/ }).click()
  await expect(page.getByText('結婚式フル構成テンプレートを適用しました')).toBeVisible()
}

export async function checkEncodersSupported(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(async () => {
    if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') return false
    const v = await VideoEncoder.isConfigSupported({ codec: 'avc1.42E01E', width: 1920, height: 1080, bitrate: 8_000_000, framerate: 30 }).catch(() => null)
    const a = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192_000 }).catch(() => null)
    return Boolean(v?.supported && a?.supported)
  })
}

/** Space で再生→K で停止し、再生ヘッドが止まること */
export async function assertPlaybackStops(page: import('@playwright/test').Page) {
  await page.keyboard.press('Escape')
  const transport = page.locator('main input[type="range"]').first()
  const before = parseFloat(await transport.inputValue())

  await page.keyboard.press('Space')
  await expect.poll(async () => parseFloat(await transport.inputValue()), { timeout: 5000 }).toBeGreaterThan(before + 0.05)

  await page.keyboard.press('k')
  const atStop = parseFloat(await transport.inputValue())
  await page.waitForTimeout(400)
  expect(Math.abs(parseFloat(await transport.inputValue()) - atStop)).toBeLessThan(0.05)
}

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

/** マイク権限拒否をシミュレート */
export async function installNarrationPermissionDeniedMock(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fable-onboarded', '1')
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
      }
    }
    ;(MockMediaRecorder as unknown as typeof MediaRecorder).isTypeSupported = () => true
    window.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError')
    }
  })
}

/** タイムライン上のクリップ本体（ラベルは pointer-events-none のため .cursor-grab を使う） */
export function timelineClip(page: import('@playwright/test').Page, name: string | RegExp) {
  return page.locator('footer .cursor-grab').filter({ hasText: name })
}

export async function clickTimelineClip(page: import('@playwright/test').Page, name: string | RegExp) {
  await timelineClip(page, name).click()
}
