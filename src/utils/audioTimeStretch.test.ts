import { describe, expect, it, vi } from 'vitest'

class TestAudioBuffer {
  length: number
  numberOfChannels: number
  sampleRate: number
  duration: number
  private channels: Float32Array[]

  constructor(opts: { length: number; numberOfChannels: number; sampleRate: number }) {
    this.length = opts.length
    this.numberOfChannels = opts.numberOfChannels
    this.sampleRate = opts.sampleRate
    this.duration = opts.length / opts.sampleRate
    this.channels = Array.from({ length: opts.numberOfChannels }, () => new Float32Array(opts.length))
  }

  getChannelData(ch: number) {
    return this.channels[ch]
  }
}

vi.stubGlobal('AudioBuffer', TestAudioBuffer)

import { stretchAudioBuffer } from './audioTimeStretch'

function makeToneBuffer(durationSec: number, frequency = 440, sampleRate = 48000): AudioBuffer {
  const length = Math.ceil(durationSec * sampleRate)
  const buffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate })
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate)
  }
  return buffer
}

describe('audioTimeStretch', () => {
  it('stretches buffer duration while keeping sample rate', () => {
    const source = makeToneBuffer(1)
    const stretched = stretchAudioBuffer(source, 0, 1, 2)
    expect(stretched.sampleRate).toBe(48000)
    expect(stretched.duration).toBeCloseTo(2, 2)
  })
})
