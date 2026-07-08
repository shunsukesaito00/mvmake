import {
  DEFAULT_COLOR,
  DEFAULT_CROP,
  DEFAULT_KEN_BURNS,
  DEFAULT_TRANSFORM,
  type ImageClip,
  type MediaAsset,
  normalizeProject,
  type Project,
  TEXT_PRESETS,
  type TextClip,
  type Track,
} from '../types/project'
import { createId } from '../utils/id'

const IMAGE_W = 1280
const IMAGE_H = 720
const CLIP_DURATION = 4.5
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
]

function drawPlaceholder(ctx: CanvasRenderingContext2D, spec: PlaceholderSpec, w: number, h: number) {
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, spec.from)
  gradient.addColorStop(1, spec.to)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // 柔らかい光の輪で写真っぽい奥行きを出す
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

  // 飾り罫線
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

  // サムネイルは縮小して再描画
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
    },
    transform: { ...DEFAULT_TRANSFORM },
    animation: { type: 'fadeIn', duration: 0.8 },
  }
}

/**
 * メディアを持っていなくても編集・プレビュー・書き出しを体験できる
 * サンプルプロジェクトを生成する(画像は Canvas で動的生成)
 */
export async function createDemoProject(): Promise<Project> {
  const assets = await Promise.all(PLACEHOLDER_SPECS.map(createPlaceholderAsset))

  const videoTrack: Track = { id: createId(), name: '映像 1', type: 'video', clips: [], muted: false, locked: false }
  const videoTrack2: Track = { id: createId(), name: '映像 2', type: 'video', clips: [], muted: false, locked: false }
  const textTrack: Track = { id: createId(), name: 'テキスト', type: 'text', clips: [], muted: false, locked: false }
  const audioTrack: Track = { id: createId(), name: 'BGM', type: 'audio', clips: [], muted: false, locked: false }

  videoTrack.clips = assets.map((asset, i): ImageClip => ({
    id: createId(),
    trackId: videoTrack.id,
    startTime: i * CLIP_DURATION,
    duration: CLIP_DURATION,
    sourceStart: 0,
    sourceDuration: CLIP_DURATION,
    type: 'image',
    mediaId: asset.id,
    transform: { ...DEFAULT_TRANSFORM },
    kenBurns: { ...DEFAULT_KEN_BURNS },
    color: { ...DEFAULT_COLOR },
    crop: { ...DEFAULT_CROP },
    ...(i > 0 ? { transition: { type: 'crossfade' as const, duration: TRANSITION_DURATION } } : {}),
  }))

  const totalDuration = assets.length * CLIP_DURATION
  textTrack.clips = [
    textClipFromPreset('opening', textTrack.id, 0.8),
    textClipFromPreset('profile', textTrack.id, CLIP_DURATION + 0.5),
    textClipFromPreset('thankyou', textTrack.id, totalDuration - 5.5),
  ]

  return normalizeProject({
    id: createId(),
    name: 'サンプルプロジェクト',
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [videoTrack, videoTrack2, textTrack, audioTrack],
    mediaAssets: assets,
    markers: [],
  })
}
