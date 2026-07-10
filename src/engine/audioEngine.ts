import type { AudioClip, MediaAsset, Project, VideoClip } from '../types/project'
import { getAudioClipsFromProject, getDuckingIntervals } from '../utils/clipUtils'
import { scheduleVolumeAutomation } from '../utils/volumeKeyframes'
import { getSourceOffsetAtLocalTime, scheduleSpeedAutomation } from '../utils/speedKeyframes'
import { connectEqChain } from '../utils/audioEq'
import { connectNoiseReductionChain } from '../utils/audioNoiseReduction'
import { applyDucking, type DuckingSchedule } from '../utils/audioDucking'

class AudioEngine {
  private context: AudioContext | null = null
  private gainNode: GainNode | null = null
  private sources = new Map<string, AudioBufferSourceNode>()
  private buffers = new Map<string, AudioBuffer>()
  private startTime = 0
  private pausedAt = 0
  private playing = false

  async init(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext()
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
  }

  async loadBuffer(asset: MediaAsset): Promise<AudioBuffer | null> {
    if (this.buffers.has(asset.id)) return this.buffers.get(asset.id)!
    try {
      const arrayBuffer = await asset.blob.arrayBuffer()
      const ctx = this.context ?? new AudioContext()
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
      this.buffers.set(asset.id, buffer)
      return buffer
    } catch {
      return null
    }
  }

  private scheduleClip(
    clip: AudioClip | VideoClip,
    buffer: AudioBuffer,
    fromTime: number,
    audio: AudioClip['audio'],
    speed: number,
    ducking?: DuckingSchedule,
    isVideo = false,
  ): void {
    const clipEnd = clip.startTime + clip.duration
    if (fromTime >= clipEnd) return

    const source = this.context!.createBufferSource()
    source.buffer = buffer

    const clipGain = this.context!.createGain()

    const localOffset = Math.max(0, fromTime - clip.startTime)
    const offset = isVideo
      ? clip.sourceStart + getSourceOffsetAtLocalTime(clip as VideoClip, localOffset)
      : clip.sourceStart + localOffset * speed
    const when = this.context!.currentTime + Math.max(0, clip.startTime - fromTime)
    const timelineDuration = clip.duration - localOffset
    const videoClip = isVideo ? (clip as VideoClip) : null
    const bufferDuration = videoClip
      ? getSourceOffsetAtLocalTime(videoClip, localOffset + timelineDuration) - getSourceOffsetAtLocalTime(videoClip, localOffset)
      : timelineDuration * speed

    if (isVideo) {
      scheduleSpeedAutomation(source.playbackRate, when, localOffset, timelineDuration, clip as VideoClip)
    } else {
      source.playbackRate.value = speed
    }

    scheduleVolumeAutomation(clipGain.gain, when, localOffset, timelineDuration, clip.duration, audio)

    const noiseChain = connectNoiseReductionChain(this.context!, audio.noiseReduction)
    const eqChain = connectEqChain(this.context!, audio.eq)
    source.connect(noiseChain.input)
    noiseChain.output.connect(eqChain.input)
    eqChain.output.connect(clipGain)

    if (ducking && ducking.intervals.length > 0) {
      const duckGain = this.context!.createGain()
      const base = this.context!.currentTime
      applyDucking(duckGain.gain, ducking, clip.startTime, clipEnd, fromTime, (pt) => base + Math.max(0, pt - fromTime))
      clipGain.connect(duckGain)
      duckGain.connect(this.gainNode!)
    } else {
      clipGain.connect(this.gainNode!)
    }

    source.start(when, offset, bufferDuration)
    this.sources.set(clip.id, source)
  }

  async play(project: Project, fromTime: number): Promise<void> {
    await this.init()
    this.stop()
    this.playing = true
    this.pausedAt = fromTime
    this.startTime = this.context!.currentTime - fromTime

    const duckingIntervals = getDuckingIntervals(project)

    for (const { clip, asset, isVideo } of getAudioClipsFromProject(project)) {
      const buffer = await this.loadBuffer(asset)
      if (!buffer) continue

      if (isVideo) {
        const v = clip as VideoClip
        this.scheduleClip(v, buffer, fromTime, v.audio ?? { volume: 1, fadeIn: 0, fadeOut: 0 }, v.speed ?? 1, undefined, true)
      } else {
        const a = clip as AudioClip
        const ducking = a.ducking?.enabled
          ? { intervals: duckingIntervals, amount: a.ducking.amount, fade: a.ducking.fade }
          : undefined
        this.scheduleClip(a, buffer, fromTime, a.audio, a.speed ?? 1, ducking)
      }
    }
  }

  stop(): void {
    for (const source of this.sources.values()) {
      try { source.stop() } catch { /* stopped */ }
    }
    this.sources.clear()
    this.playing = false
  }

  pause(currentTime: number): void {
    this.pausedAt = currentTime
    this.stop()
    this.playing = false
  }

  getCurrentTime(): number {
    if (!this.playing || !this.context) return this.pausedAt
    return this.context.currentTime - this.startTime
  }

  dispose(): void {
    this.stop()
    this.context?.close()
    this.context = null
    this.gainNode = null
    this.buffers.clear()
  }
}

export const audioEngine = new AudioEngine()

export async function mixAudioOffline(project: Project, duration: number, sampleRate = 48000): Promise<AudioBuffer> {
  const offline = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate)
  const duckingIntervals = getDuckingIntervals(project)

  for (const { clip, asset, isVideo } of getAudioClipsFromProject(project)) {
    try {
      const arrayBuffer = await asset.blob.arrayBuffer()
      const buffer = await offline.decodeAudioData(arrayBuffer.slice(0))
      const source = offline.createBufferSource()
      source.buffer = buffer

      const isVideoClip = isVideo
      const videoClip = isVideoClip ? (clip as VideoClip) : null
      const speed = isVideoClip ? videoClip!.speed ?? 1 : (clip as AudioClip).speed ?? 1
      source.playbackRate.value = speed

      const gain = offline.createGain()
      const audio = isVideoClip ? videoClip!.audio ?? { volume: 1, fadeIn: 0, fadeOut: 0 } : (clip as AudioClip).audio

      const when = clip.startTime
      scheduleVolumeAutomation(gain.gain, when, 0, clip.duration, clip.duration, audio)

      if (isVideoClip) {
        scheduleSpeedAutomation(source.playbackRate, when, 0, clip.duration, videoClip!)
      }

      const noiseChain = connectNoiseReductionChain(offline, audio.noiseReduction)
      const eqChain = connectEqChain(offline, audio.eq)
      source.connect(noiseChain.input)
      noiseChain.output.connect(eqChain.input)
      eqChain.output.connect(gain)

      const audioClip = !isVideo ? (clip as AudioClip) : null
      if (audioClip?.ducking?.enabled && duckingIntervals.length > 0) {
        const duckGain = offline.createGain()
        applyDucking(
          duckGain.gain,
          { intervals: duckingIntervals, amount: audioClip.ducking.amount, fade: audioClip.ducking.fade },
          clip.startTime,
          clip.startTime + clip.duration,
          0,
          (pt) => pt,
        )
        gain.connect(duckGain)
        duckGain.connect(offline.destination)
      } else {
        gain.connect(offline.destination)
      }

      const bufferDuration = isVideoClip
        ? getSourceOffsetAtLocalTime(videoClip!, clip.duration)
        : clip.duration * speed

      source.start(when, clip.sourceStart, bufferDuration)
    } catch {
      // skip
    }
  }

  return offline.startRendering()
}
