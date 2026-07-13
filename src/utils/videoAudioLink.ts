import type { Track, VideoClip } from '../types/project'

export function isVideoAudioLinked(clip: VideoClip): boolean {
  return clip.audioLinked !== false
}

/** プレビュー/書き出し/ダッキングで動画内蔵音声を鳴らすか */
export function isVideoAudioAudible(clip: VideoClip): boolean {
  if (!isVideoAudioLinked(clip)) return false
  return (clip.audio?.volume ?? 1) > 0.01
}

export function findPreferredNarrationTrack(tracks: Track[]): Track | undefined {
  return tracks.find((t) => t.type === 'audio' && !t.locked)
}
