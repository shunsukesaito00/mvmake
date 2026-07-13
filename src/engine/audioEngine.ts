import type { AudioClip, MediaAsset, Project, VideoClip } from '../types/project'
import { getAudioClipsFromProject, getDuckingIntervals, getTrackPlaybackGain } from '../utils/clipUtils'
import { scheduleVolumeAutomation } from '../utils/volumeKeyframes'
import { scheduleSpeedAutomation } from '../utils/speedKeyframes'
import {
  getConstantVideoAudioPlaybackRate,
  resolveVideoAudioSpeedSchedule,
  shouldScheduleVideoSpeedAutomation,
} from '../utils/speedAudioLink'
import { connectEqChain } from '../utils/audioEq'
import { connectNoiseReductionChain } from '../utils/audioNoiseReduction'
import { applyDucking, type DuckingSchedule } from '../utils/audioDucking'

class AudioEngine {
  private context: AudioContext | null = null
  private gainNode: GainNode | null = null
  private trackGains = new Map<string, GainNode>()
  private trackAnalysers = new Map<string, AnalyserNode>()
  private sources = new Map<string, AudioBufferSourceNode>()
  private buffers = new Map<string, AudioBuffer>()
  private startTime = 0
  private pausedAt = 0
  private playing = false
  private shuttleRate = 1

  async init(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext()
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
  }

  private getTrackBus(trackId: string): GainNode {
    if (!this.trackGains.has(trackId)) {
      const gain = this.context!.createGain()
      const analyser = this.context!.createAnalyser()
      analyser.fftSize = 256
      gain.connect(analyser)
      analyser.connect(this.gainNode!)
      this.trackGains.set(trackId, gain)
      this.trackAnalysers.set(trackId, analyser)
    }
    return this.trackGains.get(trackId)!
  }

  updateTrackGains(project: Project): void {
    if (!this.context || !this.gainNode) return
    for (const track of project.tracks) {
      this.getTrackBus(track.id).gain.value = getTrackPlaybackGain(track, project.tracks)
    }
  }

  getTrackVuLevel(trackId: string): number {
    const analyser = this.trackAnalysers.get(trackId)
    if (!analyser) return 0
    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (const sample of data) {
      const n = (sample - 128) / 128
      sum += n * n
    }
    return Math.min(1, Math.sqrt(sum / data.length) * 2.5)
  }

  getTrackVuLevels(project: Project): Record<string, number> {
    const levels: Record<string, number> = {}
    for (const track of project.tracks) {
      if (track.type === 'video' || track.type === 'audio') {
        levels[track.id] = this.getTrackVuLevel(track.id)
      }
    }
    return levels
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
    trackId: string,
    ducking?: DuckingSchedule,
    isVideo = false,
  ): void {
    const clipEnd = clip.startTime + clip.duration
    if (fromTime >= clipEnd) return

    const source = this.context!.createBufferSource()
    source.buffer = buffer

    const clipGain = this.context!.createGain()
    const destination = this.getTrackBus(trackId)

    const localOffset = Math.max(0, fromTime - clip.startTime)
    const videoClip = isVideo ? (clip as VideoClip) : null
    const schedule = videoClip
      ? resolveVideoAudioSpeedSchedule(videoClip, localOffset, clip.duration)
      : null
    const offset = isVideo
      ? schedule!.sourceStart
      : clip.sourceStart + localOffset * speed
    const when = this.context!.currentTime + Math.max(0, clip.startTime - fromTime)
    const timelineDuration = schedule?.timelineDuration ?? (clip.duration - localOffset)
    const bufferDuration = schedule?.bufferDuration ?? timelineDuration * speed

    if (isVideo && videoClip) {
      if (shouldScheduleVideoSpeedAutomation(videoClip)) {
        scheduleSpeedAutomation(source.playbackRate, when, localOffset, timelineDuration, videoClip, this.shuttleRate)
      } else {
        source.playbackRate.value = getConstantVideoAudioPlaybackRate(videoClip, this.shuttleRate)
      }
    } else {
      source.playbackRate.value = speed * this.shuttleRate
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
      duckGain.connect(destination)
    } else {
      clipGain.connect(destination)
    }

    source.start(when, offset, bufferDuration)
    this.sources.set(clip.id, source)
  }

  async play(project: Project, fromTime: number, shuttleRate = 1): Promise<void> {
    await this.init()
    this.stop()
    this.playing = true
    this.shuttleRate = shuttleRate
    this.pausedAt = fromTime
    this.startTime = this.context!.currentTime - fromTime
    this.updateTrackGains(project)

    const duckingIntervals = getDuckingIntervals(project)

    for (const { clip, asset, isVideo, trackId } of getAudioClipsFromProject(project)) {
      const buffer = await this.loadBuffer(asset)
      if (!buffer) continue

      if (isVideo) {
        const v = clip as VideoClip
        this.scheduleClip(v, buffer, fromTime, v.audio ?? { volume: 1, fadeIn: 0, fadeOut: 0 }, v.speed ?? 1, trackId, undefined, true)
      } else {
        const a = clip as AudioClip
        const ducking = a.ducking?.enabled
          ? { intervals: duckingIntervals, amount: a.ducking.amount, fade: a.ducking.fade }
          : undefined
        this.scheduleClip(a, buffer, fromTime, a.audio, a.speed ?? 1, trackId, ducking)
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
    this.trackGains.clear()
    this.trackAnalysers.clear()
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
  const trackBuses = new Map<string, GainNode>()

  const getOfflineTrackBus = (trackId: string, trackGain: number) => {
    if (!trackBuses.has(trackId)) {
      const bus = offline.createGain()
      bus.gain.value = trackGain
      bus.connect(offline.destination)
      trackBuses.set(trackId, bus)
    }
    return trackBuses.get(trackId)!
  }

  for (const { clip, asset, isVideo, trackId, trackGain } of getAudioClipsFromProject(project)) {
    try {
      const arrayBuffer = await asset.blob.arrayBuffer()
      const buffer = await offline.decodeAudioData(arrayBuffer.slice(0))
      const source = offline.createBufferSource()
      source.buffer = buffer

      const isVideoClip = isVideo
      const videoClip = isVideoClip ? (clip as VideoClip) : null
      const speed = isVideoClip ? videoClip!.speed ?? 1 : (clip as AudioClip).speed ?? 1
      const schedule = videoClip
        ? resolveVideoAudioSpeedSchedule(videoClip, 0, clip.duration)
        : null

      const gain = offline.createGain()
      const audio = isVideoClip ? videoClip!.audio ?? { volume: 1, fadeIn: 0, fadeOut: 0 } : (clip as AudioClip).audio
      const destination = getOfflineTrackBus(trackId, trackGain)

      const when = clip.startTime
      scheduleVolumeAutomation(gain.gain, when, 0, clip.duration, clip.duration, audio)

      if (isVideoClip && videoClip) {
        if (shouldScheduleVideoSpeedAutomation(videoClip)) {
          scheduleSpeedAutomation(source.playbackRate, when, 0, clip.duration, videoClip)
        } else {
          source.playbackRate.value = getConstantVideoAudioPlaybackRate(videoClip)
        }
      } else {
        source.playbackRate.value = speed
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
        duckGain.connect(destination)
      } else {
        gain.connect(destination)
      }

      const bufferDuration = schedule?.bufferDuration ?? clip.duration * speed
      const sourceStart = schedule?.sourceStart ?? clip.sourceStart

      source.start(when, sourceStart, bufferDuration)
    } catch {
      // skip
    }
  }

  return offline.startRendering()
}
