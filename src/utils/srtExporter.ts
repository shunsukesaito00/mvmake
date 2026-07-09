import type { SrtCue } from './srtParser'
import type { TextClip, Track } from '../types/project'

export function formatSrtTimestamp(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const hours = Math.floor(clamped / 3600)
  const minutes = Math.floor((clamped % 3600) / 60)
  const secs = Math.floor(clamped % 60)
  const millis = Math.min(999, Math.round((clamped % 1) * 1000))

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.')
}

export function serializeSrt(cues: SrtCue[]): string {
  if (cues.length === 0) return ''

  const blocks = cues.map(
    (cue) =>
      `${cue.index}\n${formatSrtTimestamp(cue.startTime)} --> ${formatSrtTimestamp(cue.endTime)}\n${cue.text}`,
  )
  return `${blocks.join('\n\n')}\n`
}

export function serializeVtt(cues: SrtCue[]): string {
  if (cues.length === 0) return 'WEBVTT\n'

  const blocks = cues.map(
    (cue) =>
      `${cue.index}\n${formatVttTimestamp(cue.startTime)} --> ${formatVttTimestamp(cue.endTime)}\n${cue.text}`,
  )
  return `WEBVTT\n\n${blocks.join('\n\n')}\n`
}

export function collectTextClipsFromTracks(tracks: Track[]): TextClip[] {
  return tracks
    .filter((track) => track.type === 'text')
    .flatMap((track) => track.clips.filter((clip): clip is TextClip => clip.type === 'text'))
}

export function textClipsToSrtCues(clips: TextClip[]): SrtCue[] {
  return [...clips]
    .filter((clip) => clip.text.content.trim().length > 0)
    .sort((a, b) => a.startTime - b.startTime || a.id.localeCompare(b.id))
    .map((clip, index) => ({
      index: index + 1,
      startTime: clip.startTime,
      endTime: clip.startTime + clip.duration,
      text: clip.text.content,
    }))
}

export function buildSrtFromTextClips(clips: TextClip[]): string {
  return serializeSrt(textClipsToSrtCues(clips))
}

export function buildVttFromTextClips(clips: TextClip[]): string {
  return serializeVtt(textClipsToSrtCues(clips))
}

export function subtitleFileBaseName(projectName: string): string {
  const sanitized = projectName
    .trim()
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9faf-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return sanitized || 'subtitles'
}

export function formatSrtExportSummary(count: number, format: 'srt' | 'vtt'): string {
  const label = format === 'srt' ? 'SRT' : 'VTT'
  return `${count}件の字幕を${label}でエクスポートしました`
}
