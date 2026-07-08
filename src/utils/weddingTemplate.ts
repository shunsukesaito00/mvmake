import { createId } from './id'
import {
  DEFAULT_TRANSFORM,
  DEFAULT_TEXT_LINE_HEIGHT,
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  TEXT_PRESETS,
  type ProjectTemplate,
  type TextClip,
  type TimelineMarker,
} from '../types/project'

export const PHOTO_GUIDE_PREFIX = '写真: '

export function formatPhotoGuideLabel(label: string): string {
  return `${PHOTO_GUIDE_PREFIX}${label}`
}

export function buildTemplateTextClips(template: ProjectTemplate, textTrackId: string): TextClip[] {
  return template.textClips.map(({ presetId, startTime }) => {
    const preset = TEXT_PRESETS.find((p) => p.id === presetId)
    if (!preset) throw new Error(`Unknown preset: ${presetId}`)
    return {
      id: createId(),
      trackId: textTrackId,
      startTime,
      duration: preset.duration,
      sourceStart: 0,
      sourceDuration: preset.duration,
      type: 'text' as const,
      text: {
        content: preset.text.content ?? '',
        fontFamily: preset.text.fontFamily ?? 'Noto Sans JP',
        fontSize: preset.text.fontSize ?? 48,
        color: preset.text.color ?? '#ffffff',
        strokeColor: preset.text.strokeColor ?? '#000000',
        strokeWidth: preset.text.strokeWidth ?? 0,
        shadowColor: preset.text.shadowColor ?? 'rgba(0,0,0,0.5)',
        shadowBlur: preset.text.shadowBlur ?? 4,
        textAlign: preset.text.textAlign ?? 'center',
        lineHeight: preset.text.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT,
        verticalAlign: preset.text.verticalAlign ?? 'center',
        backgroundColor: preset.text.backgroundColor ?? '',
        backgroundPadding: preset.text.backgroundPadding ?? DEFAULT_TEXT_BACKGROUND_PADDING,
        backgroundRadius: preset.text.backgroundRadius ?? DEFAULT_TEXT_BACKGROUND_RADIUS,
      },
      transform: { ...DEFAULT_TRANSFORM },
      animation: { type: 'fadeIn' as const, duration: 0.8 },
    }
  })
}

export function buildPhotoGuideClips(template: ProjectTemplate, textTrackId: string): TextClip[] {
  return (template.photoGuides ?? []).map((guide) => ({
    id: createId(),
    trackId: textTrackId,
    startTime: guide.startTime,
    duration: guide.duration,
    sourceStart: 0,
    sourceDuration: guide.duration,
    type: 'text' as const,
    text: {
      content: formatPhotoGuideLabel(guide.label),
      fontFamily: 'Noto Sans JP',
      fontSize: 24,
      color: '#9ca3af',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowBlur: 2,
      textAlign: 'center' as const,
      lineHeight: DEFAULT_TEXT_LINE_HEIGHT,
      verticalAlign: 'center' as const,
      backgroundColor: '',
      backgroundPadding: DEFAULT_TEXT_BACKGROUND_PADDING,
      backgroundRadius: DEFAULT_TEXT_BACKGROUND_RADIUS,
    },
    transform: { ...DEFAULT_TRANSFORM, opacity: 0.85 },
    animation: { type: 'none' as const, duration: 0 },
  }))
}

export function buildTemplateMarkers(template: ProjectTemplate): TimelineMarker[] {
  return (template.markers ?? []).map((marker) => ({
    id: createId(),
    time: marker.time,
    label: marker.label,
  }))
}
