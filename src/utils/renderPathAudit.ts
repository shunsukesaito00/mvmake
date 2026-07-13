import type { TransitionType } from '../types/project'
import { TRANSITION_DEFINITIONS } from './transitions'

/** プレビュー・書き出しの映像フレーム描画経路 */
export const FRAME_RENDER_PATHS = {
  preview: {
    entry: 'PreviewPanel.drawAtTime',
    engine: 'compositor.renderFrame',
    videoSync: 'seekVideosToTime（停止時）/ syncVideosForPlayback（再生時・前面クリップは video.play + rVFC）',
    options: 'showSafeAreas, playing, cssColorFallback（再生中）',
  },
  export: {
    entry: 'exporter.exportProject',
    engine: 'compositor.renderFrame',
    videoSync: 'seekVideosToTime（毎フレーム）',
    options: 'なし（playing=false 相当）',
  },
} as const

/** getTrackLayersAtTime の switch でレイヤー合成するトランジション（29 種） */
export const COMPOSITOR_LAYER_TRANSITION_TYPES: TransitionType[] = TRANSITION_DEFINITIONS.map((d) => d.type)

/**
 * renderFrame 内でクリップ描画後にフルキャンバスオーバーレイを重ねるトランジション。
 * drawWithTransform / drawMediaClip のブラー・変形と併用する種別は含まない。
 */
export const COMPOSITOR_CANVAS_OVERLAY_TRANSITION_TYPES = [
  'wipe',
  'fadeWhite',
  'fadeWarm',
  'lightLeak',
  'crossDissolveWarm',
  'filmBurn',
  'petalFall',
  'goldenShimmer',
  'softWipe',
  'candleGlow',
  'paperConfetti',
  'silkFade',
  'starlight',
  'laceReveal',
  'pearlShimmer',
  'mistFade',
  'ribbonCut',
  'iris',
] as const satisfies readonly TransitionType[]

/** drawWithTransform で変形するトランジション */
export const COMPOSITOR_TRANSFORM_TRANSITION_TYPES = [
  'zoom',
  'softFocus',
  'gentleZoom',
  'silkFade',
  'pearlShimmer',
  'petalFall',
  'slideLeft',
  'slideRight',
  'slideUp',
] as const satisfies readonly TransitionType[]

/** drawMediaClip でブラーをかけるトランジション */
export const COMPOSITOR_BLUR_TRANSITION_TYPES = [
  'blur',
  'softFocus',
  'dreamyBlur',
  'mistFade',
] as const satisfies readonly TransitionType[]

export const COLOR_GRADE_RENDER_PATHS = {
  compositor: 'drawMediaClip → applyCompositorColorStackToImageData(LUT → tone → RGB → temp/tint) → applyColorFilter(ctx.filter)',
  colorLookMiniPreview: 'renderColorGradePreviewCanvas → applyColorGradeToImageData → buildColorFilterCss（CSS filter）',
  lutMiniPreview: 'lutPreview（.cube 適用・Canvas）',
  note: '本編プレビューと書き出しは compositor 経路のみ。インスペクター/LUT ミニプレビューは参照用 UI',
} as const

/** compositor.drawMediaClip の色調適用順（本編プレビュー・書き出し共通） */
export const COMPOSITOR_COLOR_STACK_STEPS = [
  'getAdjustmentColorForVisualTrack + mergeClipColorWithAdjustment',
  'getAdjustmentLutForVisualTrack + resolveClipLut',
  'applyCompositorColorStackToImageData（LUT → トーン → RGB → 色温度/ティント）',
  'applyColorFilter（hue / brightness / contrast / saturate）',
] as const

export const VISUAL_FADE_PATH = {
  compositor: 'getLayerOpacityAtTime → getMediaVisualOpacityAtTime（visualFade.ts）',
  colorLookPreview: 'getColorLookPreviewOpacity → getVisualFadeMultiplier（同一関数）',
} as const

/** UI のみ（CSS アニメ）。compositor / 書き出し非経路 */
export const UI_ONLY_PREVIEW_PATHS = [
  'MediaPanel.TransitionPreview（効果タブ CSS ミニプレビュー）',
] as const

export function getCompositorSwitchCasesFromSource(compositorSource: string): string[] {
  const switchStart = compositorSource.indexOf('switch (clip.transition.type)')
  if (switchStart < 0) return []
  const switchBody = compositorSource.slice(switchStart, switchStart + 12_000)
  return [...switchBody.matchAll(/case '(\w+)':/g)].map((m) => m[1])
}

export function findMissingCompositorTransitions(compositorSource: string): TransitionType[] {
  const handled = new Set(getCompositorSwitchCasesFromSource(compositorSource))
  return COMPOSITOR_LAYER_TRANSITION_TYPES.filter((t) => !handled.has(t))
}

export function findUnknownCompositorTransitions(compositorSource: string): string[] {
  const defined = new Set(COMPOSITOR_LAYER_TRANSITION_TYPES)
  return getCompositorSwitchCasesFromSource(compositorSource).filter((t) => !defined.has(t as TransitionType))
}
