import { createId } from './id'
import {
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  DEFAULT_TEXT_LINE_HEIGHT,
  DEFAULT_TRANSFORM,
  SUBTITLE_BAND_COLOR,
  type TextClip,
  type TextStyle,
} from '../types/project'

export interface SrtCue {
  index: number
  startTime: number
  endTime: number
  text: string
}

const MIN_SUBTITLE_DURATION = 0.2

export const DEFAULT_SRT_TEXT_STYLE: Omit<TextStyle, 'content'> = {
  fontFamily: 'Noto Sans JP',
  fontSize: 42,
  color: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowBlur: 2,
  textAlign: 'center',
  lineHeight: DEFAULT_TEXT_LINE_HEIGHT,
  verticalAlign: 'bottom',
  backgroundColor: SUBTITLE_BAND_COLOR,
  backgroundPadding: DEFAULT_TEXT_BACKGROUND_PADDING,
  backgroundRadius: DEFAULT_TEXT_BACKGROUND_RADIUS,
}

const SRT_TIME_ARROW = /\s*-->\s*/

export function parseSrtTimestamp(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  const millis = Number(match[4])
  if ([hours, minutes, seconds, millis].some((n) => Number.isNaN(n))) return null
  if (minutes >= 60 || seconds >= 60) return null

  return hours * 3600 + minutes * 60 + seconds + millis / 1000
}

export function parseSrt(content: string): SrtCue[] {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const blocks = normalized.split(/\n{2,}/)
  const cues: SrtCue[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trimEnd())
    if (lines.length < 2) continue

    let timeLineIndex = 0
    const firstLine = lines[0]?.trim() ?? ''
    if (/^\d+$/.test(firstLine)) timeLineIndex = 1

    const timeLine = lines[timeLineIndex]?.trim() ?? ''
    const [startRaw, endRaw] = timeLine.split(SRT_TIME_ARROW)
    const startTime = parseSrtTimestamp(startRaw ?? '')
    const endTime = parseSrtTimestamp(endRaw ?? '')
    if (startTime === null || endTime === null || endTime <= startTime) continue

    const text = lines.slice(timeLineIndex + 1).join('\n').trim()
    if (!text) continue

    const index = /^\d+$/.test(firstLine) ? Number(firstLine) : cues.length + 1
    cues.push({ index, startTime, endTime, text })
  }

  return cues
}

export function buildTextClipsFromSrtCues(cues: SrtCue[], textTrackId: string): TextClip[] {
  return cues.map((cue) => {
    const duration = Math.max(MIN_SUBTITLE_DURATION, cue.endTime - cue.startTime)
    return {
      id: createId(),
      trackId: textTrackId,
      startTime: cue.startTime,
      duration,
      sourceStart: 0,
      sourceDuration: duration,
      type: 'text' as const,
      text: {
        ...DEFAULT_SRT_TEXT_STYLE,
        content: cue.text,
      },
      transform: { ...DEFAULT_TRANSFORM, y: 0.88 },
      animation: { type: 'fadeIn', duration: Math.min(0.3, duration) },
    }
  })
}

export function formatSrtImportSummary(count: number): string {
  return `${count}件の字幕クリップをインポートしました`
}
