import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioClip, MediaAsset, Project, VideoClip } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_COLOR, DEFAULT_CROP, DEFAULT_DUCKING, DEFAULT_TRANSFORM, DEFAULT_VISUAL_FADE } from '../types/project'
import { mixAudioOffline } from '../engine/audioEngine'
import { makeWavWithPeak } from './wavFixtures'
import {
  AUDIO_SIGNAL_CHAIN,
  audioEngineUsesSharedMixChain,
  getExportAudioSampleRange,
} from './audioPathAudit'
import { scheduleVolumeAutomation } from './volumeKeyframes'

const dir = dirname(fileURLToPath(import.meta.url))
const audioEngineSource = readFileSync(resolve(dir, '../engine/audioEngine.ts'), 'utf8')

type AutomationEvent = { type: 'set' | 'ramp'; time: number; value: number }

function createMockGainParam(): GainNode['gain'] & { events: AutomationEvent[] } {
  const events: AutomationEvent[] = []
  const param = {
    value: 1,
    defaultValue: 1,
    events,
    setValueAtTime(value: number, time: number) {
      events.push({ type: 'set', time, value })
      param.value = value
    },
    linearRampToValueAtTime(value: number, time: number) {
      events.push({ type: 'ramp', time, value })
    },
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
    cancelAndHoldAtTime() {},
  }
  return param as GainNode['gain'] & { events: AutomationEvent[] }
}

function wavAsset(id: string, peak: number, durationSec: number): MediaAsset {
  const blob = new Blob([makeWavWithPeak(peak, durationSec)], { type: 'audio/wav' })
  return { id, name: `${id}.wav`, type: 'audio', blob, url: `blob:${id}`, duration: durationSec }
}

function makeProject(clips: { audio?: AudioClip; video?: VideoClip }[], mediaAssets: MediaAsset[]): Project {
  return {
    id: 'p1',
    name: 'test',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets,
    tracks: [
      { id: 't1', name: '映像', type: 'video', clips: clips.map((c) => c.video).filter(Boolean) as VideoClip[], muted: false, locked: false },
      { id: 't2', name: 'BGM', type: 'audio', clips: clips.map((c) => c.audio).filter(Boolean) as AudioClip[], muted: false, locked: false },
    ],
  }
}

describe('audioPathAudit', () => {
  it('preview and export share the same signal chain imports', () => {
    expect(audioEngineUsesSharedMixChain(audioEngineSource)).toBe(true)
    for (const fn of AUDIO_SIGNAL_CHAIN) {
      expect(audioEngineSource).toContain(fn)
    }
    expect(audioEngineSource).toContain('mixAudioOffline')
    expect(audioEngineSource).toContain('scheduleClip')
  })

  it('computes export audio slice range for chapter In/Out', () => {
    const { audioSampleOffset, audioEndSample } = getExportAudioSampleRange(2, 3, 48000, 48000 * 10)
    expect(audioSampleOffset).toBe(96000)
    expect(audioEndSample).toBe(240000)
  })
})

describe('scheduleVolumeAutomation', () => {
  it('schedules constant volume without keyframes', () => {
    const gain = createMockGainParam()
    scheduleVolumeAutomation(gain, 0, 0, 4, 4, { ...DEFAULT_AUDIO, volume: 0.6, fadeIn: 0, fadeOut: 0 })
    expect(gain.events[0]).toEqual({ type: 'set', time: 0, value: 0.6 })
  })

  it('schedules fade in when no keyframes', () => {
    const gain = createMockGainParam()
    scheduleVolumeAutomation(gain, 1, 0, 4, 4, { ...DEFAULT_AUDIO, volume: 0.8, fadeIn: 1, fadeOut: 0 })
    expect(gain.events[0]).toEqual({ type: 'set', time: 1, value: 0.8 })
    expect(gain.events[1]).toEqual({ type: 'set', time: 1, value: 0 })
    expect(gain.events[2]).toEqual({ type: 'ramp', time: 2, value: 0.8 })
  })

  it('schedules keyframed volume segments', () => {
    const gain = createMockGainParam()
    scheduleVolumeAutomation(gain, 0, 0, 4, 4, {
      ...DEFAULT_AUDIO,
      volumeKeyframes: [
        { id: 'a', time: 0, volume: 0.2 },
        { id: 'b', time: 2, volume: 0.8 },
        { id: 'c', time: 4, volume: 0.5 },
      ],
    })
    expect(gain.events.some((e) => e.type === 'set' && e.value === 0.2)).toBe(true)
    expect(gain.events.some((e) => e.type === 'ramp' && e.value === 0.8)).toBe(true)
  })
})

describe('mixAudioOffline', () => {
  beforeEach(() => {
    class MockOfflineAudioContext {
      readonly length: number
      readonly sampleRate: number
      readonly destination = { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 2, connect: () => {} }
      private readonly scheduled: Array<{ when: number; duration: number; peak: number; gainHead: MockGain }> = []

      constructor(_channels: number, length: number, sampleRate: number) {
        this.length = length
        this.sampleRate = sampleRate
      }

      createBufferSource() {
        const ctx = this
        let when = 0
        let duration = 0
        let head: MockGain | null = null
        return {
          buffer: null as AudioBuffer | null,
          playbackRate: { value: 1, setValueAtTime() {} },
          connect(node: MockGain) {
            head = node
            return node
          },
          start(w: number, _off = 0, dur?: number) {
            when = w
            duration = dur ?? 0
            const bufferPeak = bufferPeakFromBuffer(this.buffer)
            if (head) ctx.scheduled.push({ when, duration, peak: bufferPeak, gainHead: head })
          },
          stop() {},
        }
      }

      createGain() {
        return new MockGain()
      }

      async decodeAudioData(arrayBuffer: ArrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer)
        if (bytes.byteLength < 16) throw new DOMException('Unable to decode audio data', 'EncodingError')
        const peak = peakFromWavBytes(bytes)
        const duration = this.length / this.sampleRate
        return {
          sampleRate: this.sampleRate,
          length: Math.floor(duration * this.sampleRate),
          duration,
          numberOfChannels: 1,
          getChannelData: () => new Float32Array([peak]),
        } as AudioBuffer
      }

      async startRendering() {
        const output = new Float32Array(this.length)
        for (const clip of this.scheduled) {
          const startSample = Math.floor(clip.when * this.sampleRate)
          const endSample = Math.min(this.length, startSample + Math.floor(clip.duration * this.sampleRate))
          for (let i = startSample; i < endSample; i++) {
            const t = i / this.sampleRate
            const gain = clip.gainHead.evaluateAt(t)
            output[i] += clip.peak * gain
          }
        }
        return {
          length: this.length,
          sampleRate: this.sampleRate,
          duration: this.length / this.sampleRate,
          numberOfChannels: 2,
          getChannelData: (ch: number) => (ch === 0 ? output : output),
        } as AudioBuffer
      }
    }

    class MockGain {
      gain = createMockGainParam()
      private next: MockGain | null = null

      connect(dest: MockGain | MockOfflineAudioContext['destination']) {
        if (dest instanceof MockGain) this.next = dest
        return dest
      }

      evaluateAt(time: number): number {
        const own = this.gain.events.length ? automationValueAt(this.gain.events, time) : this.gain.value
        if (!this.next) return own
        return own * this.next.evaluateAt(time)
      }
    }

    function automationValueAt(events: AutomationEvent[], time: number): number {
      const sorted = [...events].sort((a, b) => a.time - b.time)
      let value = 1
      for (let i = 0; i < sorted.length; i++) {
        const ev = sorted[i]
        if (ev.time > time) break
        if (ev.type === 'set') {
          value = ev.value
        } else {
          const prev = sorted[i - 1]
          const prevTime = prev?.time ?? ev.time
          const prevValue = prev?.value ?? value
          if (time <= ev.time) {
            const span = ev.time - prevTime
            if (span <= 0) value = ev.value
            else value = prevValue + ((ev.value - prevValue) * (time - prevTime)) / span
          } else {
            value = ev.value
          }
        }
      }
      return value
    }

    function peakFromWavBytes(bytes: Uint8Array): number {
      const dataStart = 44
      if (bytes.length < dataStart + 2) return 0
      const sample = bytes[dataStart] | (bytes[dataStart + 1] << 8)
      const signed = sample > 32767 ? sample - 65536 : sample
      return Math.abs(signed) / 32767
    }

    function bufferPeakFromBuffer(buffer: AudioBuffer | null): number {
      if (!buffer) return 0
      return Math.abs(buffer.getChannelData(0)[0] ?? 0)
    }

    vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders BGM at configured volume', async () => {
    const asset = wavAsset('bgm', 0.8, 2)
    const audio: AudioClip = {
      id: 'a1',
      type: 'audio',
      trackId: 't2',
      mediaId: 'bgm',
      startTime: 0,
      duration: 2,
      sourceStart: 0,
      sourceDuration: 2,
      audio: { ...DEFAULT_AUDIO, volume: 0.5 },
      speed: 1,
      ducking: { ...DEFAULT_DUCKING },
    }
    const project = makeProject([{ audio }], [asset])
    const { buffer } = await mixAudioOffline(project, 2, 48000)
    const sample = buffer.getChannelData(0)[1000] ?? 0
    expect(sample).toBeGreaterThan(0.35)
    expect(sample).toBeLessThan(0.45)
  })

  it('ducks BGM during video speech interval', async () => {
    const bgmAsset = wavAsset('bgm', 1, 4)
    const videoAssetMedia = wavAsset('vid', 0.01, 2)
    const video: VideoClip = {
      id: 'v1',
      type: 'video',
      trackId: 't1',
      mediaId: 'vid',
      startTime: 1,
      duration: 2,
      sourceStart: 0,
      sourceDuration: 2,
      transform: { ...DEFAULT_TRANSFORM },
      audio: { ...DEFAULT_AUDIO, volume: 1 },
      speed: 1,
      color: { ...DEFAULT_COLOR },
      crop: { ...DEFAULT_CROP },
      ...DEFAULT_VISUAL_FADE,
    }
    const audio: AudioClip = {
      id: 'a1',
      type: 'audio',
      trackId: 't2',
      mediaId: 'bgm',
      startTime: 0,
      duration: 4,
      sourceStart: 0,
      sourceDuration: 4,
      audio: { ...DEFAULT_AUDIO, volume: 1 },
      speed: 1,
      ducking: { enabled: true, amount: 0.2, fade: 0.1 },
    }
    const project = makeProject([{ video, audio }], [bgmAsset, videoAssetMedia])
    const { buffer } = await mixAudioOffline(project, 4, 48000)

    const beforeDuck = Math.abs(buffer.getChannelData(0)[24000] ?? 0)
    const duringDuck = Math.abs(buffer.getChannelData(0)[120000] ?? 0)
    expect(beforeDuck).toBeGreaterThan(duringDuck * 2)
  })

  it('startTime 指定時は必要区間のみミックスする', async () => {
    const asset = wavAsset('bgm', 0.5, 8)
    const audio: AudioClip = {
      id: 'a1',
      type: 'audio',
      trackId: 't2',
      mediaId: 'bgm',
      startTime: 0,
      duration: 8,
      sourceStart: 0,
      sourceDuration: 8,
      audio: { ...DEFAULT_AUDIO, volume: 0.5 },
      speed: 1,
      ducking: { ...DEFAULT_DUCKING },
    }
    const project = makeProject([{ audio }], [asset])
    const { buffer: full } = await mixAudioOffline(project, 8, 48000)
    const { buffer: partial } = await mixAudioOffline(project, 3, 48000, { startTime: 5 })
    expect(partial.length).toBe(Math.ceil(3 * 48000))
    expect(full.length).toBe(Math.ceil(8 * 48000))
    expect(partial.length).toBeLessThan(full.length)
  })

  it('decode 失敗クリップを skippedAudio に記録する', async () => {
    const goodAsset = wavAsset('good', 0.5, 1)
    const badBlob = new Blob([new Uint8Array([0, 1, 2])], { type: 'audio/wav' })
    const badAsset = {
      id: 'bad',
      name: 'broken.wav',
      type: 'audio' as const,
      blob: badBlob,
      url: 'blob:bad',
      duration: 1,
    }
    const goodClip: AudioClip = {
      id: 'good-clip',
      type: 'audio',
      trackId: 't2',
      mediaId: 'good',
      startTime: 0,
      duration: 1,
      sourceStart: 0,
      sourceDuration: 1,
      audio: { ...DEFAULT_AUDIO, volume: 0.5 },
      speed: 1,
      ducking: { ...DEFAULT_DUCKING },
    }
    const badClip: AudioClip = {
      id: 'bad-clip',
      type: 'audio',
      trackId: 't2',
      mediaId: 'bad',
      startTime: 1,
      duration: 1,
      sourceStart: 0,
      sourceDuration: 1,
      audio: { ...DEFAULT_AUDIO, volume: 0.5 },
      speed: 1,
      ducking: { ...DEFAULT_DUCKING },
    }
    const project = makeProject([{ audio: goodClip }, { audio: badClip }], [goodAsset, badAsset])
    const { skippedAudio } = await mixAudioOffline(project, 2, 48000)
    expect(skippedAudio).toEqual([{ assetId: 'bad', assetName: 'broken.wav' }])
  })
})
