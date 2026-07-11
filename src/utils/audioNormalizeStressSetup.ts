import type { AudioClip, MediaAsset, Project, Track } from '../types/project'
import { DEFAULT_AUDIO, normalizeProject } from '../types/project'
import { createId } from './id'
import { useProjectStore } from '../store/projectStore'
import { makeWavWithPeak } from './wavFixtures'

/** ストレス検証用オーディオクリップ数（BGM / ナレーション / キーフレーム付き BGM） */
export const AUDIO_NORMALIZE_STRESS_CLIP_COUNT = 3

export const AUDIO_NORMALIZE_STRESS_PEAKS = {
  bgm: 0.1,
  narration: 0.05,
  keyframed: 0.2,
} as const

function createStressWavAsset(name: string, peak: number): MediaAsset {
  const bytes = makeWavWithPeak(peak, 0.5)
  const blob = new Blob([bytes], { type: 'audio/wav' })
  return {
    id: createId(),
    name,
    type: 'audio',
    blob,
    url: URL.createObjectURL(blob),
    duration: 0.5,
  }
}

export interface AudioNormalizeStressStats {
  bgmClipId: string
  narrationClipId: string
  keyframedClipId: string
  bgmClipName: string
  narrationClipName: string
  keyframedClipName: string
  clipCount: number
  bgmPeak: number
  narrationPeak: number
  keyframedPeak: number
}

export function createAudioNormalizeStressProject(): Project {
  const bgmAsset = createStressWavAsset('stress-bgm.wav', AUDIO_NORMALIZE_STRESS_PEAKS.bgm)
  const narrationAsset = createStressWavAsset('stress-narration.wav', AUDIO_NORMALIZE_STRESS_PEAKS.narration)
  const keyframedAsset = createStressWavAsset('stress-bgm-kf.wav', AUDIO_NORMALIZE_STRESS_PEAKS.keyframed)

  const audioTrack: Track = {
    id: createId(),
    name: 'BGM',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
  }

  const bgmClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: bgmAsset.id,
    startTime: 0,
    duration: 0.5,
    sourceStart: 0,
    sourceDuration: 0.5,
    audio: { ...DEFAULT_AUDIO, volume: 1 },
  }

  const narrationClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: narrationAsset.id,
    startTime: 1,
    duration: 0.5,
    sourceStart: 0,
    sourceDuration: 0.5,
    audio: { ...DEFAULT_AUDIO, volume: 0.75 },
  }

  const keyframedClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: keyframedAsset.id,
    startTime: 2,
    duration: 0.5,
    sourceStart: 0,
    sourceDuration: 0.5,
    audio: {
      ...DEFAULT_AUDIO,
      volume: 0.5,
      volumeKeyframes: [
        { id: createId(), time: 0.1, volume: 0.3 },
        { id: createId(), time: 0.3, volume: 0.8 },
      ],
    },
  }

  audioTrack.clips = [bgmClip, narrationClip, keyframedClip]

  return normalizeProject({
    id: createId(),
    name: 'ストレス音量正規化検証',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [bgmAsset, narrationAsset, keyframedAsset],
    markers: [],
    tracks: [
      { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
      audioTrack,
    ],
  })
}

export function getAudioNormalizeStressStats(project: Project): AudioNormalizeStressStats {
  const audioTrack = project.tracks.find((t) => t.type === 'audio')
  if (!audioTrack) throw new Error('audio normalize stress: missing audio track')

  const bgmClip = audioTrack.clips.find((c) => c.type === 'audio' && project.mediaAssets.find((a) => a.id === c.mediaId)?.name === 'stress-bgm.wav')
  const narrationClip = audioTrack.clips.find((c) => c.type === 'audio' && project.mediaAssets.find((a) => a.id === c.mediaId)?.name === 'stress-narration.wav')
  const keyframedClip = audioTrack.clips.find((c) => c.type === 'audio' && project.mediaAssets.find((a) => a.id === c.mediaId)?.name === 'stress-bgm-kf.wav')

  if (!bgmClip || bgmClip.type !== 'audio' || !narrationClip || narrationClip.type !== 'audio' || !keyframedClip || keyframedClip.type !== 'audio') {
    throw new Error('audio normalize stress: missing clips')
  }

  return {
    bgmClipId: bgmClip.id,
    narrationClipId: narrationClip.id,
    keyframedClipId: keyframedClip.id,
    bgmClipName: 'stress-bgm.wav',
    narrationClipName: 'stress-narration.wav',
    keyframedClipName: 'stress-bgm-kf.wav',
    clipCount: audioTrack.clips.length,
    bgmPeak: AUDIO_NORMALIZE_STRESS_PEAKS.bgm,
    narrationPeak: AUDIO_NORMALIZE_STRESS_PEAKS.narration,
    keyframedPeak: AUDIO_NORMALIZE_STRESS_PEAKS.keyframed,
  }
}

export function seedAudioNormalizeStress(): AudioNormalizeStressStats {
  const project = createAudioNormalizeStressProject()
  useProjectStore.getState().loadProject(project)
  return getAudioNormalizeStressStats(project)
}
