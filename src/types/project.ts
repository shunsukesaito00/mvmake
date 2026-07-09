export type MediaType = 'video' | 'image' | 'audio'
export type TrackType = 'video' | 'text' | 'audio'
export type ClipType = 'video' | 'image' | 'audio' | 'text'
export type TransitionType =
  | 'crossfade'
  | 'fadeBlack'
  | 'fadeWhite'
  | 'wipe'
  | 'slideLeft'
  | 'slideRight'
  | 'zoom'
export type TextAnimationType = 'fadeIn' | 'fadeOut' | 'slideUp' | 'typewriter' | 'scaleIn' | 'none'

export interface MediaAsset {
  id: string
  name: string
  type: MediaType
  blob: Blob
  url: string
  duration: number
  width?: number
  height?: number
  thumbnail?: string
  waveform?: number[]
}

export interface Transform {
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
}

export interface ColorAdjustments {
  brightness: number
  contrast: number
  saturation: number
}

export interface CropSettings {
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
}

export interface KenBurns {
  enabled: boolean
  startScale: number
  endScale: number
  startX: number
  startY: number
  endX: number
  endY: number
}

export type TextVerticalAlign = 'top' | 'center' | 'bottom'

export interface TextStyle {
  content: string
  fontFamily: string
  fontSize: number
  color: string
  strokeColor: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
  textAlign: 'left' | 'center' | 'right'
  /** 行の高さ倍率(フォントサイズに対する比率) */
  lineHeight: number
  /** transform.y を基準としたテキストブロックの縦配置 */
  verticalAlign: TextVerticalAlign
  /** 空文字のとき背景なし */
  backgroundColor: string
  /** 背景の内側余白(px、1920 基準) */
  backgroundPadding: number
  /** 背景の角丸(px、1920 基準) */
  backgroundRadius: number
}

export interface ClipAnimation {
  type: TextAnimationType
  duration: number
}

export interface AudioSettings {
  volume: number
  fadeIn: number
  fadeOut: number
  /** クリップ先頭からの秒数と音量(0〜2)。未設定時は volume を一定値として使用 */
  volumeKeyframes?: VolumeKeyframe[]
}

/** クリップ内ローカル時間(秒)での音量キーフレーム */
export interface VolumeKeyframe {
  id: string
  time: number
  volume: number
}

/** クリップ内ローカル時間(秒)での transform キーフレーム（opacity はベース transform を使用） */
export type TransformKeyframeEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

export const TRANSFORM_KEYFRAME_EASING_OPTIONS: { value: TransformKeyframeEasing; label: string }[] = [
  { value: 'linear', label: '線形' },
  { value: 'easeIn', label: 'イーズイン' },
  { value: 'easeOut', label: 'イーズアウト' },
  { value: 'easeInOut', label: 'イーズインアウト' },
]

export interface TransformKeyframe {
  id: string
  time: number
  x: number
  y: number
  scale: number
  rotation: number
  /** 直前のキーフレームからこの点への補間。省略時は linear */
  easing?: TransformKeyframeEasing
}

/** BGMダッキング: 動画クリップの音声がある区間で自動的に音量を下げる */
export interface DuckingSettings {
  enabled: boolean
  /** ダッキング中の音量倍率 (0〜1) */
  amount: number
  /** 減衰・復帰にかける秒数 */
  fade: number
}

export interface Transition {
  type: TransitionType
  duration: number
}

export interface BaseClip {
  id: string
  trackId: string
  startTime: number
  duration: number
  sourceStart: number
  sourceDuration: number
}

export interface VideoClip extends BaseClip {
  type: 'video'
  mediaId: string
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  transition?: Transition
  audio: AudioSettings
  speed: number
  color: ColorAdjustments
  crop: CropSettings
  fadeIn: number
  fadeOut: number
}

export interface ImageClip extends BaseClip {
  type: 'image'
  mediaId: string
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  kenBurns: KenBurns
  transition?: Transition
  color: ColorAdjustments
  crop: CropSettings
  fadeIn: number
  fadeOut: number
}

export interface AudioClip extends BaseClip {
  type: 'audio'
  mediaId: string
  audio: AudioSettings
  speed: number
  ducking: DuckingSettings
}

export interface TextClip extends BaseClip {
  type: 'text'
  text: TextStyle
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  animation: ClipAnimation
}

export type Clip = VideoClip | ImageClip | AudioClip | TextClip

export interface Track {
  id: string
  name: string
  type: TrackType
  clips: Clip[]
  muted?: boolean
  locked?: boolean
}

export interface TimelineMarker {
  id: string
  time: number
  label: string
}

export interface Project {
  id: string
  name: string
  width: number
  height: number
  fps: number
  tracks: Track[]
  mediaAssets: MediaAsset[]
  markers?: TimelineMarker[]
}

export interface TextPreset {
  id: string
  label: string
  text: Partial<TextStyle>
  duration: number
}

export interface TemplateChapterMarker {
  time: number
  label: string
}

export interface TemplatePhotoGuide {
  label: string
  startTime: number
  duration: number
}

export interface ProjectTemplate {
  id: string
  label: string
  description: string
  name: string
  textClips: Array<{ presetId: string; startTime: number }>
  markers?: TemplateChapterMarker[]
  photoGuides?: TemplatePhotoGuide[]
}

export const DEFAULT_TRANSFORM: Transform = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  opacity: 1,
}

export const DEFAULT_TEXT_LINE_HEIGHT = 1.2
export const DEFAULT_TEXT_BACKGROUND_PADDING = 16
export const DEFAULT_TEXT_BACKGROUND_RADIUS = 8
export const SUBTITLE_BAND_COLOR = 'rgba(0, 0, 0, 0.6)'

export const DEFAULT_COLOR: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
}

export const DEFAULT_CROP: CropSettings = {
  enabled: false,
  x: 0,
  y: 0,
  width: 1,
  height: 1,
}

export const DEFAULT_KEN_BURNS: KenBurns = {
  enabled: true,
  startScale: 1,
  endScale: 1.15,
  startX: 0.5,
  startY: 0.5,
  endX: 0.5,
  endY: 0.45,
}

export const DEFAULT_AUDIO: AudioSettings = {
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
}

export const DEFAULT_DUCKING: DuckingSettings = {
  enabled: false,
  amount: 0.3,
  fade: 0.5,
}

export const DEFAULT_VISUAL_FADE = {
  fadeIn: 0,
  fadeOut: 0,
} as const

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'opening',
    label: 'Opening',
    text: {
      content: 'Opening',
      fontFamily: 'Shippori Mincho',
      fontSize: 72,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 8,
      textAlign: 'center',
    },
    duration: 4,
  },
  {
    id: 'profile',
    label: '新郎新婦紹介',
    text: {
      content: '新郎新婦紹介',
      fontFamily: 'Noto Serif JP',
      fontSize: 56,
      color: '#f5e6d3',
      strokeColor: '#4a3728',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowBlur: 6,
      textAlign: 'center',
    },
    duration: 5,
  },
  {
    id: 'thankyou',
    label: 'Thank you',
    text: {
      content: 'Thank you',
      fontFamily: 'Shippori Mincho',
      fontSize: 64,
      color: '#ffffff',
      strokeColor: '#2c2c2c',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 10,
      textAlign: 'center',
    },
    duration: 5,
  },
  {
    id: 'ending',
    label: 'エンディング',
    text: {
      content: 'エンディング',
      fontFamily: 'Noto Sans JP',
      fontSize: 48,
      color: '#e8d5b7',
      strokeColor: '#1a1a1a',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 4,
      textAlign: 'center',
    },
    duration: 4,
  },
]

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'opening-movie',
    label: 'オープニングムービー',
    description: 'Opening テキスト付きの基本構成',
    name: 'オープニングムービー',
    textClips: [{ presetId: 'opening', startTime: 2 }],
  },
  {
    id: 'profile-movie',
    label: 'プロフィールムービー',
    description: '新郎新婦紹介テキスト付き',
    name: 'プロフィールムービー',
    textClips: [{ presetId: 'profile', startTime: 1 }],
  },
  {
    id: 'ending-movie',
    label: 'エンディングムービー',
    description: 'Thank you + エンディングテキスト',
    name: 'エンディングムービー',
    textClips: [
      { presetId: 'thankyou', startTime: 0 },
      { presetId: 'ending', startTime: 6 },
    ],
  },
  {
    id: 'structured-wedding',
    label: '結婚式フル構成',
    description: '章マーカーと写真ガイド付きの標準構成',
    name: '結婚式ムービー',
    textClips: [
      { presetId: 'opening', startTime: 2 },
      { presetId: 'thankyou', startTime: 120 },
      { presetId: 'ending', startTime: 126 },
    ],
    markers: [
      { time: 0, label: 'オープニング' },
      { time: 20, label: '新郎プロフィール' },
      { time: 50, label: '新婦プロフィール' },
      { time: 80, label: '二人の歩み' },
      { time: 110, label: 'エンディング' },
    ],
    photoGuides: [
      { label: '新郎 幼少期', startTime: 22, duration: 7 },
      { label: '新郎 学生時代', startTime: 32, duration: 7 },
      { label: '新郎 趣味・仕事', startTime: 42, duration: 6 },
      { label: '新婦 幼少期', startTime: 52, duration: 7 },
      { label: '新婦 学生時代', startTime: 62, duration: 7 },
      { label: '新婦 趣味・仕事', startTime: 72, duration: 6 },
      { label: '出会い〜交際', startTime: 82, duration: 10 },
      { label: '思い出の写真', startTime: 94, duration: 14 },
    ],
  },
]

export const RESOLUTION_PRESETS = [
  { id: '1080p', label: '1080p (1920×1080)', width: 1920, height: 1080 },
  { id: '720p', label: '720p (1280×720)', width: 1280, height: 720 },
  { id: '4k', label: '4K (3840×2160)', width: 3840, height: 2160 },
  { id: 'square', label: '正方形 (1080×1080)', width: 1080, height: 1080 },
  { id: 'vertical', label: '縦型 9:16 (1080×1920)', width: 1080, height: 1920 },
] as const

function normalizeClip(clip: Clip): Clip {
  if (clip.type === 'video') {
    return {
      ...clip,
      audio: clip.audio ?? { ...DEFAULT_AUDIO },
      speed: clip.speed ?? 1,
      color: clip.color ?? { ...DEFAULT_COLOR },
      crop: clip.crop ?? { ...DEFAULT_CROP },
      fadeIn: clip.fadeIn ?? DEFAULT_VISUAL_FADE.fadeIn,
      fadeOut: clip.fadeOut ?? DEFAULT_VISUAL_FADE.fadeOut,
    }
  }
  if (clip.type === 'image') {
    return {
      ...clip,
      color: clip.color ?? { ...DEFAULT_COLOR },
      crop: clip.crop ?? { ...DEFAULT_CROP },
      kenBurns: clip.kenBurns ?? { ...DEFAULT_KEN_BURNS },
      fadeIn: clip.fadeIn ?? DEFAULT_VISUAL_FADE.fadeIn,
      fadeOut: clip.fadeOut ?? DEFAULT_VISUAL_FADE.fadeOut,
    }
  }
  if (clip.type === 'audio') {
    return { ...clip, speed: clip.speed ?? 1, ducking: clip.ducking ?? { ...DEFAULT_DUCKING } }
  }
  if (clip.type === 'text') {
    return {
      ...clip,
      text: {
        ...clip.text,
        lineHeight: clip.text.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT,
        verticalAlign: clip.text.verticalAlign ?? 'center',
        backgroundColor: clip.text.backgroundColor ?? '',
        backgroundPadding: clip.text.backgroundPadding ?? DEFAULT_TEXT_BACKGROUND_PADDING,
        backgroundRadius: clip.text.backgroundRadius ?? DEFAULT_TEXT_BACKGROUND_RADIUS,
      },
    }
  }
  return clip
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    markers: project.markers ?? [],
    tracks: project.tracks.map((t) => ({
      ...t,
      muted: t.muted ?? false,
      locked: t.locked ?? false,
      clips: t.clips.map(normalizeClip),
    })),
  }
}
