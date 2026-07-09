import type { Project, Track } from '../types/project'
import type {
  TemplateClipEntry,
  UserProjectTemplate,
  UserProjectTemplateSummary,
} from '../types/userProjectTemplate'
import { createId } from './id'

export function buildUserProjectTemplate(
  project: Project,
  label: string,
  description = '',
): UserProjectTemplate {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('テンプレート名を入力してください')

  const tracksByType: Record<string, Track[]> = {
    video: project.tracks.filter((t) => t.type === 'video'),
    text: project.tracks.filter((t) => t.type === 'text'),
    audio: project.tracks.filter((t) => t.type === 'audio'),
  }

  const clipEntries: TemplateClipEntry[] = []
  for (const track of project.tracks) {
    const trackIndex = tracksByType[track.type]?.indexOf(track) ?? 0
    for (const clip of track.clips) {
      const { id: _id, trackId: _trackId, ...clipPayload } = clip
      clipEntries.push({
        trackType: track.type,
        trackIndex: Math.max(0, trackIndex),
        clip: clipPayload,
      })
    }
  }

  return {
    id: createId(),
    label: trimmed,
    description: description.trim(),
    createdAt: Date.now(),
    width: project.width,
    height: project.height,
    fps: project.fps,
    markers: (project.markers ?? []).map(({ id: _id, ...marker }) => marker),
    clipEntries,
  }
}

export function summarizeUserProjectTemplate(template: UserProjectTemplate): UserProjectTemplateSummary {
  return {
    id: template.id,
    label: template.label,
    description: template.description,
    createdAt: template.createdAt,
    width: template.width,
    height: template.height,
    fps: template.fps,
    clipCount: template.clipEntries.length,
    markerCount: template.markers.length,
  }
}

export function formatUserProjectTemplateSummary(template: UserProjectTemplateSummary): string {
  return `${template.width}×${template.height} · ${template.fps}fps · クリップ${template.clipCount}件 · マーカー${template.markerCount}件`
}

export function applyUserProjectTemplateToTracks(
  template: UserProjectTemplate,
  tracks: Track[],
): { tracks: Track[]; markers: Project['markers'] } {
  const tracksByType = {
    video: tracks.filter((t) => t.type === 'video'),
    text: tracks.filter((t) => t.type === 'text'),
    audio: tracks.filter((t) => t.type === 'audio'),
  }

  const nextTracks = tracks.map((track) => ({ ...track, clips: [] as Track['clips'] }))
  const trackIdByKey = new Map<string, string>()
  for (const type of ['video', 'text', 'audio'] as const) {
    tracksByType[type].forEach((track, index) => {
      trackIdByKey.set(`${type}:${index}`, track.id)
    })
  }

  for (const entry of template.clipEntries) {
    const trackId =
      trackIdByKey.get(`${entry.trackType}:${entry.trackIndex}`) ??
      trackIdByKey.get(`${entry.trackType}:0`)
    if (!trackId) continue

    const target = nextTracks.find((t) => t.id === trackId)
    if (!target) continue

    target.clips.push({
      ...structuredClone(entry.clip),
      id: createId(),
      trackId,
    } as Track['clips'][number])
  }

  const markers = template.markers.map((marker) => ({
    ...marker,
    id: createId(),
  }))

  return { tracks: nextTracks, markers }
}

export function buildProjectFromUserTemplate(
  template: UserProjectTemplate,
  baseTracks: Track[],
): Pick<Project, 'name' | 'width' | 'height' | 'fps' | 'tracks' | 'markers'> {
  const { tracks, markers } = applyUserProjectTemplateToTracks(template, baseTracks)
  return {
    name: template.label,
    width: template.width,
    height: template.height,
    fps: template.fps,
    tracks,
    markers,
  }
}
