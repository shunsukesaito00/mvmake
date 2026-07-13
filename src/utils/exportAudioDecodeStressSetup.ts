import type { AudioClip, MediaAsset, Project, Track } from '../types/project'
import { DEFAULT_AUDIO, DEFAULT_DUCKING, TEXT_PRESETS, normalizeProject } from '../types/project'
import { createId } from './id'
import { useProjectStore } from '../store/projectStore'
import { getProjectDuration } from './time'
import { mixAudioOffline } from '../engine/audioEngine'

export const EXPORT_AUDIO_DECODE_STRESS_CORRUPT_NAME = 'corrupt-bgm.bin'

function createCorruptAudioAsset(): MediaAsset {
  const blob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'audio/wav' })
  return {
    id: createId(),
    name: EXPORT_AUDIO_DECODE_STRESS_CORRUPT_NAME,
    type: 'audio',
    blob,
    url: URL.createObjectURL(blob),
    duration: 2,
  }
}

export interface ExportAudioDecodeStressStats {
  corruptAssetName: string
  corruptAssetId: string
  clipCount: number
  skippedAudioNames: string[]
}

/** 書き出し音声デコード失敗警告の E2E 用ストレスプロジェクト */
export async function seedExportAudioDecodeStress(): Promise<ExportAudioDecodeStressStats> {
  const opening = TEXT_PRESETS.find((p) => p.id === 'opening')
  if (!opening) throw new Error('opening preset missing')

  const corruptAsset = createCorruptAudioAsset()
  const audioTrack: Track = {
    id: createId(),
    name: 'BGM',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
  }

  const corruptClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    type: 'audio',
    mediaId: corruptAsset.id,
    startTime: 0,
    duration: 2,
    sourceStart: 0,
    sourceDuration: 2,
    audio: { ...DEFAULT_AUDIO, volume: 1 },
    speed: 1,
    ducking: { ...DEFAULT_DUCKING },
  }

  audioTrack.clips = [corruptClip]

  const project: Project = normalizeProject({
    id: createId(),
    name: 'export-audio-decode-stress',
    width: 1920,
    height: 1080,
    fps: 30,
    mediaAssets: [corruptAsset],
    tracks: [
      { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
      audioTrack,
      { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false },
    ],
    markers: [],
  })

  useProjectStore.getState().loadProject(project)
  useProjectStore.getState().addTextClip(opening, undefined, 0)

  const clipCount = useProjectStore.getState().project.tracks.reduce((sum, track) => sum + track.clips.length, 0)
  if (clipCount < 2) throw new Error('expected text + audio clips')

  const duration = getProjectDuration(useProjectStore.getState().project.tracks)
  const { skippedAudio } = await mixAudioOffline(useProjectStore.getState().project, duration, 48000)
  if (!skippedAudio.some((skip) => skip.assetName === corruptAsset.name)) {
    throw new Error('expected corrupt audio in skippedAudio')
  }

  return {
    corruptAssetName: corruptAsset.name,
    corruptAssetId: corruptAsset.id,
    clipCount,
    skippedAudioNames: skippedAudio.map((skip) => skip.assetName),
  }
}
