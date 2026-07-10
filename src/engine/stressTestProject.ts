import type { AudioClip, ImageClip, MediaAsset, Project, TextClip, Track } from '../types/project'
import {
  DEFAULT_AUDIO,
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_DUCKING,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
  normalizeProject,
} from '../types/project'
import { createId } from '../utils/id'
import { getProjectDuration } from '../utils/time'

export const STRESS_TEST_SPEC = {
  imageClipCount: 75,
  textClipCount: 20,
  audioClipCount: 5,
  imageClipDurationSec: 8,
  targetDurationSec: 600,
} as const

export interface StressTestProjectStats {
  totalClips: number
  durationSec: number
  imageClips: number
  textClips: number
  audioClips: number
}

function placeholderAsset(index: number): MediaAsset {
  return {
    id: `stress-img-${index}`,
    name: `photo-${String(index + 1).padStart(3, '0')}.jpg`,
    type: 'image',
    blob: new Blob(),
    url: `blob:stress-${index}`,
    duration: 10,
    width: 1920,
    height: 1080,
  }
}

function placeholderAudioAsset(index: number): MediaAsset {
  return {
    id: `stress-audio-${index}`,
    name: `bgm-${index + 1}.wav`,
    type: 'audio',
    blob: new Blob(),
    url: `blob:stress-audio-${index}`,
    duration: STRESS_TEST_SPEC.targetDurationSec,
  }
}

/**
 * 10 分・約 100 クリップ相当のストレス用プロジェクト（Canvas/IndexedDB 不要）。
 * パフォーマンス計測・回帰テスト専用。
 */
export function createStressTestProject(): Project {
  const assets: MediaAsset[] = []
  for (let i = 0; i < STRESS_TEST_SPEC.imageClipCount; i++) {
    assets.push(placeholderAsset(i))
  }
  for (let i = 0; i < STRESS_TEST_SPEC.audioClipCount; i++) {
    assets.push(placeholderAudioAsset(i))
  }

  const videoTrack: Track = { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false }
  const textTrack: Track = { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false }
  const audioTrack: Track = { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false }

  videoTrack.clips = Array.from({ length: STRESS_TEST_SPEC.imageClipCount }, (_, i): ImageClip => ({
    id: createId(),
    trackId: videoTrack.id,
    type: 'image',
    mediaId: assets[i].id,
    startTime: i * STRESS_TEST_SPEC.imageClipDurationSec,
    duration: STRESS_TEST_SPEC.imageClipDurationSec,
    sourceStart: 0,
    sourceDuration: STRESS_TEST_SPEC.imageClipDurationSec,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { ...DEFAULT_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    ...(i > 0 ? { transition: { type: 'crossfade' as const, duration: 0.5 } } : {}),
  }))

  const textInterval = STRESS_TEST_SPEC.targetDurationSec / STRESS_TEST_SPEC.textClipCount
  textTrack.clips = Array.from({ length: STRESS_TEST_SPEC.textClipCount }, (_, i): TextClip => ({
    id: createId(),
    trackId: textTrack.id,
    type: 'text',
    startTime: i * textInterval,
    duration: 4,
    sourceStart: 0,
    sourceDuration: 4,
    text: {
      content: `Telop ${i + 1}`,
      fontFamily: 'Noto Sans JP',
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 4,
      textAlign: 'center',
      lineHeight: 1.2,
      verticalAlign: 'center',
      backgroundColor: '',
      backgroundPadding: 0,
      backgroundRadius: 0,
    },
    transform: { ...DEFAULT_TRANSFORM, y: 0.85 },
    animation: { type: 'fadeIn', duration: 0.5 },
  }))

  const audioSegment = STRESS_TEST_SPEC.targetDurationSec / STRESS_TEST_SPEC.audioClipCount
  audioTrack.clips = Array.from({ length: STRESS_TEST_SPEC.audioClipCount }, (_, i): AudioClip => ({
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: assets[STRESS_TEST_SPEC.imageClipCount + i].id,
    startTime: i * audioSegment,
    duration: audioSegment,
    sourceStart: 0,
    sourceDuration: audioSegment,
    audio: { ...DEFAULT_AUDIO, volume: 0.6 },
    speed: 1,
    ducking: { ...DEFAULT_DUCKING },
  }))

  return normalizeProject({
    id: createId(),
    name: '長尺ストレステスト',
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [videoTrack, textTrack, audioTrack],
    mediaAssets: assets,
    markers: [],
  })
}

export function getStressTestProjectStats(project: Project): StressTestProjectStats {
  const clips = project.tracks.flatMap((t) => t.clips)
  return {
    totalClips: clips.length,
    durationSec: getProjectDuration(project.tracks),
    imageClips: clips.filter((c) => c.type === 'image').length,
    textClips: clips.filter((c) => c.type === 'text').length,
    audioClips: clips.filter((c) => c.type === 'audio').length,
  }
}
