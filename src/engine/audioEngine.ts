import type { AudioClip, MediaAsset, Project, VideoClip } from '../types/project'
import { getAudioClipsFromProject, getDuckingIntervals } from '../utils/clipUtils'

interface DuckingSchedule {
  intervals: Array<{ start: number; end: number }>
  amount: number
  fade: number
}

/**
 * ダッキング用ゲインノードに音量オートメーションを設定する。
 * toContextTime はプロジェクト時間 → AudioContext 時間の変換。
 */
function applyDucking(
  gain: GainNode,
  ducking: DuckingSchedule,
  clipStart: number,
  clipEnd: number,
  playbackStart: number,
  toContextTime: (projectTime: number) => number,
): void {
  gain.gain.value = 1
  for (const iv of ducking.intervals) {
    const s = Math.max(iv.start, clipStart, playbackStart)
    const e = Math.min(iv.end, clipEnd)
    if (e <= s) continue

    if (s <= playbackStart + 0.01) {
      // 再生開始時点で既にダッキング区間内
      gain.gain.setValueAtTime(ducking.amount, toContextTime(playbackStart))
    } else {
      gain.gain.setValueAtTime(1, toContextTime(s))
      gain.gain.linearRampToValueAtTime(ducking.amount, toContextTime(s) + ducking.fade)
    }
    gain.gain.setValueAtTime(ducking.amount, toContextTime(e))
    gain.gain.linearRampToValueAtTime(1, toContextTime(e) + ducking.fade)
  }
}

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
    volume: number,
    fadeIn: number,
    fadeOut: number,
    speed: number,
    ducking?: DuckingSchedule,
  ): void {
    const clipEnd = clip.startTime + clip.duration
    if (fromTime >= clipEnd) return

    const source = this.context!.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = speed

    const clipGain = this.context!.createGain()
    clipGain.gain.value = volume

    const localOffset = Math.max(0, fromTime - clip.startTime)
    const offset = clip.sourceStart + localOffset * speed
    const when = this.context!.currentTime + Math.max(0, clip.startTime - fromTime)
    const duration = clip.duration - localOffset

    if (fadeIn > 0) {
      clipGain.gain.setValueAtTime(0, when)
      clipGain.gain.linearRampToValueAtTime(volume, when + fadeIn)
    }
    if (fadeOut > 0) {
      const fadeStart = when + duration - fadeOut
      clipGain.gain.setValueAtTime(volume, fadeStart)
      clipGain.gain.linearRampToValueAtTime(0, when + duration)
    }

    source.connect(clipGain)

    if (ducking && ducking.intervals.length > 0) {
      const duckGain = this.context!.createGain()
      const base = this.context!.currentTime
      applyDucking(duckGain, ducking, clip.startTime, clipEnd, fromTime, (pt) => base + Math.max(0, pt - fromTime))
      clipGain.connect(duckGain)
      duckGain.connect(this.gainNode!)
    } else {
      clipGain.connect(this.gainNode!)
    }

    source.start(when, offset, duration / speed)
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
        this.scheduleClip(v, buffer, fromTime, v.audio?.volume ?? 1, v.audio?.fadeIn ?? 0, v.audio?.fadeOut ?? 0, v.speed ?? 1)
      } else {
        const a = clip as AudioClip
        const { volume, fadeIn, fadeOut } = a.audio
        const ducking = a.ducking?.enabled
          ? { intervals: duckingIntervals, amount: a.ducking.amount, fade: a.ducking.fade }
          : undefined
        this.scheduleClip(a, buffer, fromTime, volume, fadeIn, fadeOut, a.speed ?? 1, ducking)
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

      const speed = isVideo ? (clip as VideoClip).speed ?? 1 : (clip as AudioClip).speed ?? 1
      source.playbackRate.value = speed

      const gain = offline.createGain()
      const volume = isVideo ? (clip as VideoClip).audio?.volume ?? 1 : (clip as AudioClip).audio.volume
      const fadeIn = isVideo ? (clip as VideoClip).audio?.fadeIn ?? 0 : (clip as AudioClip).audio.fadeIn
      const fadeOut = isVideo ? (clip as VideoClip).audio?.fadeOut ?? 0 : (clip as AudioClip).audio.fadeOut
      gain.gain.value = volume

      const when = clip.startTime
      if (fadeIn > 0) {
        gain.gain.setValueAtTime(0, when)
        gain.gain.linearRampToValueAtTime(volume, when + fadeIn)
      }
      if (fadeOut > 0) {
        const fadeStart = when + clip.duration - fadeOut
        gain.gain.setValueAtTime(volume, fadeStart)
        gain.gain.linearRampToValueAtTime(0, when + clip.duration)
      }

      source.connect(gain)

      const audioClip = !isVideo ? (clip as AudioClip) : null
      if (audioClip?.ducking?.enabled && duckingIntervals.length > 0) {
        const duckGain = offline.createGain()
        applyDucking(
          duckGain,
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

      source.start(when, clip.sourceStart, clip.duration / speed)
    } catch {
      // skip
    }
  }

  return offline.startRendering()
}
