import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_DUCKING,
  DEFAULT_KEN_BURNS,
  DEFAULT_VISUAL_FADE,
  DEFAULT_TRANSFORM,
  DEFAULT_TEXT_LINE_HEIGHT,
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  DEFAULT_AUDIO,
  type AudioClip,
  type ImageClip,
  type MediaAsset,
  normalizeProject,
  type Project,
  TEXT_PRESETS,
  type TextClip,
  type TimelineMarker,
  type Track,
} from '../types/project'
import { createId } from '../utils/id'
import { makeSilentWav } from '../utils/wavFixtures'

export const DEMO_PROJECT_NAME = 'サンプルプロジェクト'
export const DEMO_CLIP_DURATION = 5.5
export const DEMO_IMAGE_COUNT = 6
export const DEMO_CHAPTER_MARKER_COUNT = 3

const IMAGE_W = 1280
const IMAGE_H = 720
const TRANSITION_DURATION = 0.8

interface PlaceholderSpec {
  label: string
  sub: string
  from: string
  to: string
}

/** ウェディングムービーらしい配色のプレースホルダー画像 */
const PLACEHOLDER_SPECS: PlaceholderSpec[] = [
  { label: 'Our Story', sub: 'Chapter 01', from: '#3d2b1f', to: '#8a5a3b' },
  { label: 'First Met', sub: 'Chapter 02', from: '#1f2d3d', to: '#4f6d8a' },
  { label: 'Proposal', sub: 'Chapter 03', from: '#3d1f33', to: '#8a4f6d' },
  { label: 'Wedding Day', sub: 'Chapter 04', from: '#2b3d1f', to: '#6d8a4f' },
  { label: 'Ceremony', sub: 'Chapter 05', from: '#2d1f3d', to: '#6d4f8a' },
  { label: 'Celebration', sub: 'Chapter 06', from: '#3d2f1f', to: '#8a7a4f' },
]

function drawPlaceholder(ctx: CanvasRenderingContext2D, spec: PlaceholderSpec, w: number, h: number) {
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, spec.from)
  gradient.addColorStop(1, spec.to)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#ffffff'
  for (const [cx, cy, r] of [
    [w * 0.2, h * 0.3, h * 0.35],
    [w * 0.8, h * 0.7, h * 0.45],
    [w * 0.65, h * 0.2, h * 0.2],
  ] as const) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `500 ${Math.round(h * 0.045)}px Georgia, serif`
  ctx.fillText(spec.sub, w / 2, h * 0.42)
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${Math.round(h * 0.11)}px Georgia, serif`
  ctx.fillText(spec.label, w / 2, h * 0.54)

  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.42, h * 0.65)
  ctx.lineTo(w * 0.58, h * 0.65)
  ctx.stroke()
}

async function createPlaceholderAsset(spec: PlaceholderSpec): Promise<MediaAsset> {
  const canvas = document.createElement('canvas')
  canvas.width = IMAGE_W
  canvas.height = IMAGE_H
  const ctx = canvas.getContext('2d')!
  drawPlaceholder(ctx, spec, IMAGE_W, IMAGE_H)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました'))), 'image/jpeg', 0.85)
  })

  const thumb = document.createElement('canvas')
  thumb.width = 160
  thumb.height = 90
  drawPlaceholder(thumb.getContext('2d')!, spec, 160, 90)

  return {
    id: createId(),
    name: `${spec.label}.jpg`,
    type: 'image',
    blob,
    url: URL.createObjectURL(blob),
    duration: 5,
    width: IMAGE_W,
    height: IMAGE_H,
    thumbnail: thumb.toDataURL('image/jpeg', 0.7),
  }
}

function createSilentBgmAsset(duration: number): MediaAsset {
  const wav = makeSilentWav(duration)
  const blob = new Blob([new Uint8Array(wav)], { type: 'audio/wav' })
  return {
    id: createId(),
    name: 'sample-bgm.wav',
    type: 'audio',
    blob,
    url: URL.createObjectURL(blob),
    duration,
  }
}

function textClipFromPreset(presetId: string, trackId: string, startTime: number): TextClip {
  const preset = TEXT_PRESETS.find((p) => p.id === presetId)!
  return {
    id: createId(),
    trackId,
    startTime,
    duration: preset.duration,
    sourceStart: 0,
    sourceDuration: preset.duration,
    type: 'text',
    text: {
      content: preset.text.content ?? 'テキスト',
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
    transform: { ...DEFAULT_TRANSFORM, y: 0.8 },
    animation: { type: 'fadeIn', duration: 0.8 },
  }
}

function buildDemoChapterMarkers(totalDuration: number): TimelineMarker[] {
  const third = totalDuration / 3
  return [
    { id: createId(), time: 0, label: 'オープニング', type: 'chapter' },
    { id: createId(), time: third, label: '二人の歩み', type: 'chapter' },
    { id: createId(), time: third * 2, label: 'エンディング', type: 'chapter' },
  ]
}

export function getDemoProjectTimelineDuration(imageCount = DEMO_IMAGE_COUNT, clipDuration = DEMO_CLIP_DURATION): number {
  return imageCount * clipDuration
}

/**
 * メディアを持っていなくても編集・プレビュー・書き出しを体験できる
 * サンプルプロジェクトを生成する(画像は Canvas で動的生成)
 */
export async function createDemoProject(): Promise<Project> {
  const imageAssets = await Promise.all(PLACEHOLDER_SPECS.map(createPlaceholderAsset))
  const totalDuration = getDemoProjectTimelineDuration(imageAssets.length, DEMO_CLIP_DURATION)
  const bgmAsset = createSilentBgmAsset(totalDuration)

  const videoTrack: Track = { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false }
  const videoTrack2: Track = { id: createId(), name: '映像 2', type: 'video', clips: [], muted: false, locked: false }
  const textTrack: Track = { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false }
  const audioTrack: Track = { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false }

  videoTrack.clips = imageAssets.map((asset, i): ImageClip => ({
    id: createId(),
    trackId: videoTrack.id,
    startTime: i * DEMO_CLIP_DURATION,
    duration: DEMO_CLIP_DURATION,
    sourceStart: 0,
    sourceDuration: DEMO_CLIP_DURATION,
    type: 'image',
    mediaId: asset.id,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { ...DEFAULT_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...DEFAULT_VISUAL_FADE,
    ...(i > 0 ? { transition: { type: 'crossfade' as const, duration: TRANSITION_DURATION } } : {}),
  }))

  textTrack.clips = [
    textClipFromPreset('opening', textTrack.id, 0.8),
    textClipFromPreset('profile', textTrack.id, DEMO_CLIP_DURATION + 0.5),
    textClipFromPreset('thankyou', textTrack.id, totalDuration - 5.5),
  ]

  const bgmClip: AudioClip = {
    id: createId(),
    trackId: audioTrack.id,
    startTime: 0,
    duration: totalDuration,
    sourceStart: 0,
    sourceDuration: totalDuration,
    type: 'audio',
    mediaId: bgmAsset.id,
    audio: { ...DEFAULT_AUDIO, volume: 0.35 },
    speed: 1,
    ducking: { ...DEFAULT_DUCKING },
  }
  audioTrack.clips = [bgmClip]

  return normalizeProject({
    id: createId(),
    name: DEMO_PROJECT_NAME,
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [videoTrack, videoTrack2, textTrack, audioTrack],
    mediaAssets: [...imageAssets, bgmAsset],
    markers: buildDemoChapterMarkers(totalDuration),
  })
}
