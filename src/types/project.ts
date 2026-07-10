export type MediaType = 'video' | 'image' | 'audio'
export type TrackType = 'video' | 'text' | 'audio'
export type ClipType = 'video' | 'image' | 'audio' | 'text' | 'adjustment'
export type TransitionType =
  | 'crossfade'
  | 'dissolve'
  | 'blur'
  | 'fadeBlack'
  | 'fadeWhite'
  | 'fadeWarm'
  | 'lightLeak'
  | 'softFocus'
  | 'wipe'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'zoom'
  | 'iris'
export type TextAnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideUp'
  | 'typewriter'
  | 'scaleIn'
  | 'motionReveal'
  | 'motionSlideLeft'
  | 'motionPop'
  | 'motionDrift'
  | 'motionElegant'
  | 'motionCurtain'
  | 'motionGlow'
  | 'keyframes'
  | 'none'

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
  /** 色相シフト (-1〜1 → -180°〜180°) */
  hue: number
  /** 色温度 (-1=寒色 〜 1=暖色) */
  temperature: number
  /** ティント (-1=緑 〜 1=マゼンタ) */
  tint: number
  /** シャドウ (-1〜1) */
  shadows: number
  /** ミッドトーン (-1〜1) */
  midtones: number
  /** ハイライト (-1〜1) */
  highlights: number
  /** RGB 各チャンネルのトーンカーブ（可変制御点・単調スプライン補間） */
  rgbCurves: RgbCurves
}

export interface RgbCurvePoint {
  x: number
  y: number
}

export type RgbCurveChannelPoints = RgbCurvePoint[]

/** @deprecated 旧形式（固定 X ノットに対する Y 値タプル）。normalizeRgbCurves でマイグレーション */
export type RgbCurvePoints = [number, number, number, number, number]

export const RGB_CURVE_INPUTS: RgbCurvePoints = [0, 0.25, 0.5, 0.75, 1]

export const RGB_CURVE_MAX_POINTS = 16
export const RGB_CURVE_MIN_POINT_GAP = 0.02

export const DEFAULT_RGB_CURVE_CHANNEL: RgbCurveChannelPoints = [
  { x: 0, y: 0 },
  { x: 0.25, y: 0.25 },
  { x: 0.5, y: 0.5 },
  { x: 0.75, y: 0.75 },
  { x: 1, y: 1 },
]

export interface RgbCurves {
  r: RgbCurveChannelPoints
  g: RgbCurveChannelPoints
  b: RgbCurveChannelPoints
}

export type RgbCurveChannel = keyof RgbCurves

export interface LutAsset {
  id: string
  name: string
  blob: Blob
  size: number
  title?: string
}

export interface ClipLutSettings {
  lutId?: string
  /** 0〜1。未設定時は 1 */
  lutIntensity?: number
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

export interface AudioEqSettings {
  enabled: boolean
  /** 低域ゲイン (dB) */
  lowGain: number
  /** 中域ゲイン (dB) */
  midGain: number
  /** 高域ゲイン (dB) */
  highGain: number
}

export interface AudioSettings {
  volume: number
  fadeIn: number
  fadeOut: number
  /** クリップ先頭からの秒数と音量(0〜2)。未設定時は volume を一定値として使用 */
  volumeKeyframes?: VolumeKeyframe[]
  /** 3バンド EQ（低域/中域/高域）。未設定時は無効 */
  eq?: AudioEqSettings
}

/** クリップ内ローカル時間(秒)での音量キーフレーム */
export interface VolumeKeyframe {
  id: string
  time: number
  volume: number
}

/** クリップ内ローカル時間(秒)での速度キーフレーム */
export type SpeedKeyframeEasing = 'linear' | 'bezier'

export const SPEED_KEYFRAME_EASING_OPTIONS: { value: SpeedKeyframeEasing; label: string }[] = [
  { value: 'linear', label: '線形' },
  { value: 'bezier', label: 'ベジェ（カスタム）' },
]

export interface SpeedKeyframeBezierHandles {
  handleIn?: TransformBezierHandle
  handleOut?: TransformBezierHandle
}

export interface SpeedKeyframe {
  id: string
  time: number
  speed: number
  /** 直前のキーフレームからこの点への補間。省略時は linear */
  easing?: SpeedKeyframeEasing
  bezierHandles?: SpeedKeyframeBezierHandles
}

/** クリップ内ローカル時間(秒)での transform キーフレーム（不透明度キーフレームを含む） */
export type TransformKeyframeEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bezier'

export const TRANSFORM_KEYFRAME_EASING_OPTIONS: { value: TransformKeyframeEasing; label: string }[] = [
  { value: 'linear', label: '線形' },
  { value: 'easeIn', label: 'イーズイン' },
  { value: 'easeOut', label: 'イーズアウト' },
  { value: 'easeInOut', label: 'イーズインアウト' },
  { value: 'bezier', label: 'ベジェ（カスタム）' },
]

/** キーフレームからの時間・値オフセット（ベジェ制御点） */
export interface TransformBezierHandle {
  timeOffset: number
  valueOffset: number
}

export type TransformKeyframeProperty = 'opacity' | 'x' | 'y' | 'scale' | 'rotation'

export type TransformKeyframeBezierHandles = Partial<Record<
  TransformKeyframeProperty,
  {
    handleIn?: TransformBezierHandle
    handleOut?: TransformBezierHandle
  }
>>

export interface TransformKeyframe {
  id: string
  time: number
  x: number
  y: number
  scale: number
  rotation: number
  /** 不透明度(0〜1)。省略時はベース transform.opacity を使用 */
  opacity?: number
  /** 直前のキーフレームからこの点への補間。省略時は linear */
  easing?: TransformKeyframeEasing
  /** 属性ごとのベジェハンドル（タイムライン上で編集） */
  bezierHandles?: TransformKeyframeBezierHandles
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

export interface VideoClip extends BaseClip, ClipLutSettings {
  type: 'video'
  mediaId: string
  transform: Transform
  transformKeyframes?: TransformKeyframe[]
  transition?: Transition
  audio: AudioSettings
  speed: number
  /** クリップ先頭からの秒数と速度(0.25〜4)。未設定時は speed を一定値として使用 */
  speedKeyframes?: SpeedKeyframe[]
  color: ColorAdjustments
  crop: CropSettings
  fadeIn: number
  fadeOut: number
}

export interface ImageClip extends BaseClip, ClipLutSettings {
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

/** 下位トラックへ色調を一括適用する調整レイヤー（映像トラック専用） */
export interface AdjustmentClip extends BaseClip, ClipLutSettings {
  type: 'adjustment'
  color: ColorAdjustments
}

export type Clip = VideoClip | ImageClip | AudioClip | TextClip | AdjustmentClip

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
  /** 章マーカー（書き出し区間）または BGM ビート用。省略時は chapter */
  type?: 'chapter' | 'beat'
}

export interface Project {
  id: string
  name: string
  width: number
  height: number
  fps: number
  tracks: Track[]
  mediaAssets: MediaAsset[]
  lutAssets?: LutAsset[]
  markers?: TimelineMarker[]
}

export interface TextPreset {
  id: string
  label: string
  /** タイトル / ロワーサード / テロップ */
  category?: 'title' | 'lowerThird' | 'subtitle'
  text: Partial<TextStyle>
  duration: number
  transform?: Partial<Transform>
  animation?: Partial<ClipAnimation>
}

export const TEXT_PRESET_CATEGORY_LABELS: Record<NonNullable<TextPreset['category']>, string> = {
  title: 'タイトル',
  lowerThird: 'ロワーサード',
  subtitle: 'テロップ',
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

export const DEFAULT_LUT_INTENSITY = 1

export const DEFAULT_RGB_CURVES: RgbCurves = {
  r: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
  g: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
  b: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
}

export const DEFAULT_COLOR: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  shadows: 0,
  midtones: 0,
  highlights: 0,
  rgbCurves: {
    r: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
    g: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
    b: DEFAULT_RGB_CURVE_CHANNEL.map((p) => ({ ...p })),
  },
}

function clampRgb01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function isLegacyRgbCurveChannel(channel: unknown): channel is Partial<RgbCurvePoints> {
  return Array.isArray(channel) && channel.length > 0 && typeof channel[0] === 'number'
}

function isRgbCurvePointChannel(channel: unknown): channel is Partial<RgbCurvePoint>[] {
  return Array.isArray(channel) && channel.length > 0 && typeof channel[0] === 'object' && channel[0] !== null && 'x' in channel[0]
}

export function sortRgbCurveChannel(points: RgbCurveChannelPoints): RgbCurveChannelPoints {
  return [...points]
    .map((p) => ({ x: clampRgb01(p.x), y: clampRgb01(p.y) }))
    .sort((a, b) => a.x - b.x)
}

export function normalizeRgbCurveChannel(channel?: unknown, fallback: RgbCurveChannelPoints = DEFAULT_RGB_CURVE_CHANNEL): RgbCurveChannelPoints {
  if (!channel) return fallback.map((p) => ({ ...p }))

  if (isLegacyRgbCurveChannel(channel)) {
    return RGB_CURVE_INPUTS.map((x, index) => ({
      x,
      y: clampRgb01(channel[index] ?? x),
    }))
  }

  if (isRgbCurvePointChannel(channel)) {
    const sorted = sortRgbCurveChannel(
      channel.map((p) => ({ x: p.x ?? 0, y: p.y ?? 0 })),
    )
    if (sorted.length < 2) return fallback.map((p) => ({ ...p }))
    sorted[0] = { x: 0, y: clampRgb01(sorted[0].y) }
    sorted[sorted.length - 1] = { x: 1, y: clampRgb01(sorted[sorted.length - 1].y) }
    return sorted
  }

  return fallback.map((p) => ({ ...p }))
}

export function normalizeRgbCurves(curves?: Partial<RgbCurves>): RgbCurves {
  return {
    r: normalizeRgbCurveChannel(curves?.r, DEFAULT_RGB_CURVES.r),
    g: normalizeRgbCurveChannel(curves?.g, DEFAULT_RGB_CURVES.g),
    b: normalizeRgbCurveChannel(curves?.b, DEFAULT_RGB_CURVES.b),
  }
}

export function normalizeColorAdjustments(color?: Partial<ColorAdjustments>): ColorAdjustments {
  return {
    brightness: color?.brightness ?? DEFAULT_COLOR.brightness,
    contrast: color?.contrast ?? DEFAULT_COLOR.contrast,
    saturation: color?.saturation ?? DEFAULT_COLOR.saturation,
    hue: color?.hue ?? DEFAULT_COLOR.hue,
    temperature: color?.temperature ?? DEFAULT_COLOR.temperature,
    tint: color?.tint ?? DEFAULT_COLOR.tint,
    shadows: color?.shadows ?? DEFAULT_COLOR.shadows,
    midtones: color?.midtones ?? DEFAULT_COLOR.midtones,
    highlights: color?.highlights ?? DEFAULT_COLOR.highlights,
    rgbCurves: normalizeRgbCurves(color?.rgbCurves),
  }
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

export const DEFAULT_AUDIO_EQ: AudioEqSettings = {
  enabled: false,
  lowGain: 0,
  midGain: 0,
  highGain: 0,
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
    category: 'title',
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
    category: 'title',
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
    category: 'title',
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
    category: 'title',
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
  {
    id: 'lower-third-names',
    label: 'ロワーサード（名前）',
    category: 'lowerThird',
    text: {
      content: 'Taro & Hanako',
      fontFamily: 'Noto Serif JP',
      fontSize: 42,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowBlur: 6,
      textAlign: 'left',
      verticalAlign: 'bottom',
      backgroundColor: SUBTITLE_BAND_COLOR,
      backgroundPadding: 20,
      backgroundRadius: 4,
      lineHeight: 1.2,
    },
    transform: { x: 0.28, y: 0.88 },
    duration: 5,
    animation: { type: 'slideUp', duration: 0.6 },
  },
  {
    id: 'lower-third-date',
    label: 'ロワーサード（日付・会場）',
    category: 'lowerThird',
    text: {
      content: '2026.12.24  /  Tokyo Garden',
      fontFamily: 'Noto Sans JP',
      fontSize: 28,
      color: '#f5e6d3',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.35)',
      shadowBlur: 4,
      textAlign: 'left',
      verticalAlign: 'bottom',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      backgroundPadding: 16,
      backgroundRadius: 4,
      lineHeight: 1.2,
    },
    transform: { x: 0.32, y: 0.93 },
    duration: 4,
    animation: { type: 'fadeIn', duration: 0.5 },
  },
  {
    id: 'section-heading',
    label: 'セクション見出し',
    category: 'subtitle',
    text: {
      content: 'Chapter 1',
      fontFamily: 'Shippori Mincho',
      fontSize: 52,
      color: '#e8d5b7',
      strokeColor: '#2c2c2c',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowBlur: 8,
      textAlign: 'center',
      verticalAlign: 'center',
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.38 },
    duration: 3,
    animation: { type: 'fadeIn', duration: 0.5 },
  },
  {
    id: 'catch-copy',
    label: 'キャッチコピー',
    category: 'subtitle',
    text: {
      content: 'Happily Ever After',
      fontFamily: 'Shippori Mincho',
      fontSize: 58,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 10,
      textAlign: 'center',
      verticalAlign: 'center',
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.45 },
    duration: 4,
    animation: { type: 'fadeIn', duration: 0.8 },
  },
  {
    id: 'guest-message',
    label: 'ゲストへのメッセージ',
    category: 'subtitle',
    text: {
      content: '本日はお越し頂き\nありがとうございます',
      fontFamily: 'Noto Serif JP',
      fontSize: 36,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowBlur: 6,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: SUBTITLE_BAND_COLOR,
      backgroundPadding: 24,
      backgroundRadius: 8,
      lineHeight: 1.4,
    },
    transform: { x: 0.5, y: 0.78 },
    duration: 5,
    animation: { type: 'slideUp', duration: 0.6 },
  },
  {
    id: 'congratulations',
    label: 'お祝いメッセージ',
    category: 'title',
    text: {
      content: 'Congratulations',
      fontFamily: 'Shippori Mincho',
      fontSize: 68,
      color: '#ffffff',
      strokeColor: '#2c2c2c',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 12,
      textAlign: 'center',
      verticalAlign: 'center',
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.5 },
    duration: 4,
    animation: { type: 'scaleIn', duration: 0.8 },
  },
  {
    id: 'lower-third-role',
    label: 'ロワーサード（肩書き）',
    category: 'lowerThird',
    text: {
      content: '新郎のご友人',
      fontFamily: 'Noto Sans JP',
      fontSize: 26,
      color: '#d4af37',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowBlur: 4,
      textAlign: 'right',
      verticalAlign: 'bottom',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      backgroundPadding: 14,
      backgroundRadius: 2,
      lineHeight: 1.2,
    },
    transform: { x: 0.82, y: 0.84 },
    duration: 4,
    animation: { type: 'fadeIn', duration: 0.4 },
  },
  {
    id: 'lower-third-speech',
    label: 'ロワーサード（スピーチ）',
    category: 'lowerThird',
    text: {
      content: 'Speech by\nTanaka Taro',
      fontFamily: 'Noto Serif JP',
      fontSize: 34,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowBlur: 6,
      textAlign: 'left',
      verticalAlign: 'bottom',
      backgroundColor: SUBTITLE_BAND_COLOR,
      backgroundPadding: 22,
      backgroundRadius: 6,
      lineHeight: 1.35,
    },
    transform: { x: 0.3, y: 0.9 },
    duration: 5,
    animation: { type: 'slideUp', duration: 0.55 },
  },
  {
    id: 'lower-third-parents',
    label: 'ロワーサード（ご両親）',
    category: 'lowerThird',
    text: {
      content: '新郎ご両親\n〇〇 様 ・ 〇〇 様',
      fontFamily: 'Shippori Mincho',
      fontSize: 30,
      color: '#f5e6d3',
      strokeColor: '#2c2c2c',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.35)',
      shadowBlur: 5,
      textAlign: 'center',
      verticalAlign: 'bottom',
      backgroundColor: 'rgba(40, 30, 20, 0.65)',
      backgroundPadding: 20,
      backgroundRadius: 8,
      lineHeight: 1.45,
    },
    transform: { x: 0.5, y: 0.86 },
    duration: 5,
    animation: { type: 'fadeIn', duration: 0.6 },
  },
  {
    id: 'lower-third-hashtag',
    label: 'ロワーサード（ハッシュタグ）',
    category: 'lowerThird',
    text: {
      content: '#Wedding2026',
      fontFamily: 'Noto Sans JP',
      fontSize: 22,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 3,
      textAlign: 'right',
      verticalAlign: 'bottom',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      backgroundPadding: 12,
      backgroundRadius: 12,
      lineHeight: 1.2,
    },
    transform: { x: 0.92, y: 0.95 },
    duration: 6,
    animation: { type: 'fadeIn', duration: 0.5 },
  },
  {
    id: 'subtitle-quote',
    label: 'テロップ（格言）',
    category: 'subtitle',
    text: {
      content: '"今日という日を\n永遠に忘れない"',
      fontFamily: 'Shippori Mincho',
      fontSize: 40,
      color: '#e8d5b7',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 8,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: '',
      backgroundPadding: 16,
      backgroundRadius: 8,
      lineHeight: 1.5,
    },
    transform: { x: 0.5, y: 0.32 },
    duration: 5,
    animation: { type: 'fadeIn', duration: 0.9 },
  },
  {
    id: 'subtitle-bride-entry',
    label: 'テロップ（入場）',
    category: 'subtitle',
    text: {
      content: '入場',
      fontFamily: 'Noto Serif JP',
      fontSize: 64,
      color: '#ffffff',
      strokeColor: '#2c2c2c',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.55)',
      shadowBlur: 12,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      backgroundPadding: 28,
      backgroundRadius: 4,
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.42 },
    duration: 3,
    animation: { type: 'scaleIn', duration: 0.7 },
  },
  {
    id: 'motion-title-reveal',
    label: 'MG: タイトルリビール',
    category: 'subtitle',
    text: {
      content: 'Our Wedding Story',
      fontFamily: 'Shippori Mincho',
      fontSize: 56,
      color: '#ffffff',
      strokeColor: '#1a1a1a',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 10,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: '',
      backgroundPadding: 16,
      backgroundRadius: 8,
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.4 },
    duration: 4,
    animation: { type: 'motionReveal', duration: 0.9 },
  },
  {
    id: 'motion-lower-slide',
    label: 'MG: ロワーサードスライド',
    category: 'lowerThird',
    text: {
      content: 'Reception Hall  /  18:00',
      fontFamily: 'Noto Sans JP',
      fontSize: 30,
      color: '#f5e6d3',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowBlur: 5,
      textAlign: 'left',
      verticalAlign: 'bottom',
      backgroundColor: SUBTITLE_BAND_COLOR,
      backgroundPadding: 18,
      backgroundRadius: 4,
      lineHeight: 1.2,
    },
    transform: { x: 0.3, y: 0.9 },
    duration: 5,
    animation: { type: 'motionSlideLeft', duration: 0.75 },
  },
  {
    id: 'motion-impact-pop',
    label: 'MG: インパクトポップ',
    category: 'subtitle',
    text: {
      content: 'Just Married!',
      fontFamily: 'Noto Serif JP',
      fontSize: 72,
      color: '#ffffff',
      strokeColor: '#2c2c2c',
      strokeWidth: 2,
      shadowColor: 'rgba(0,0,0,0.55)',
      shadowBlur: 14,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: 'rgba(212, 175, 55, 0.25)',
      backgroundPadding: 24,
      backgroundRadius: 12,
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.48 },
    duration: 3,
    animation: { type: 'motionPop', duration: 0.65 },
  },
  {
    id: 'motion-elegant-drift',
    label: 'MG: エレガントドリフト',
    category: 'subtitle',
    text: {
      content: 'With Love & Gratitude',
      fontFamily: 'Shippori Mincho',
      fontSize: 44,
      color: '#e8d5b7',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowBlur: 8,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: '',
      backgroundPadding: 16,
      backgroundRadius: 8,
      lineHeight: 1.3,
    },
    transform: { x: 0.5, y: 0.35 },
    duration: 5,
    animation: { type: 'motionDrift', duration: 1 },
  },
  {
    id: 'motion-elegant-names',
    label: 'MG: エレガントネーム',
    category: 'lowerThird',
    text: {
      content: 'Taro & Hanako',
      fontFamily: 'Shippori Mincho',
      fontSize: 36,
      color: '#f5e6d3',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowBlur: 6,
      textAlign: 'center',
      verticalAlign: 'bottom',
      backgroundColor: SUBTITLE_BAND_COLOR,
      backgroundPadding: 20,
      backgroundRadius: 4,
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.9 },
    duration: 5,
    animation: { type: 'motionElegant', duration: 0.85 },
  },
  {
    id: 'motion-curtain-chapter',
    label: 'MG: カーテン章題',
    category: 'title',
    text: {
      content: 'Chapter II',
      fontFamily: 'Noto Serif JP',
      fontSize: 52,
      color: '#ffffff',
      strokeColor: '#2c2c2c',
      strokeWidth: 1,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 12,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: '',
      backgroundPadding: 16,
      backgroundRadius: 8,
      lineHeight: 1.2,
    },
    transform: { x: 0.5, y: 0.38 },
    duration: 4,
    animation: { type: 'motionCurtain', duration: 0.8 },
  },
  {
    id: 'motion-glow-vows',
    label: 'MG: グローメッセージ',
    category: 'subtitle',
    text: {
      content: 'Forever & Always',
      fontFamily: 'Shippori Mincho',
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      shadowColor: 'rgba(255, 220, 180, 0.65)',
      shadowBlur: 18,
      textAlign: 'center',
      verticalAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      backgroundPadding: 22,
      backgroundRadius: 10,
      lineHeight: 1.25,
    },
    transform: { x: 0.5, y: 0.45 },
    duration: 4,
    animation: { type: 'motionGlow', duration: 0.75 },
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
      color: normalizeColorAdjustments(clip.color),
      crop: clip.crop ?? { ...DEFAULT_CROP },
      fadeIn: clip.fadeIn ?? DEFAULT_VISUAL_FADE.fadeIn,
      fadeOut: clip.fadeOut ?? DEFAULT_VISUAL_FADE.fadeOut,
    }
  }
  if (clip.type === 'image') {
    return {
      ...clip,
      color: normalizeColorAdjustments(clip.color),
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
  if (clip.type === 'adjustment') {
    return { ...clip, color: normalizeColorAdjustments(clip.color) }
  }
  return clip
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    markers: project.markers ?? [],
    lutAssets: project.lutAssets ?? [],
    tracks: project.tracks.map((t) => ({
      ...t,
      muted: t.muted ?? false,
      locked: t.locked ?? false,
      clips: t.clips.map(normalizeClip),
    })),
  }
}
