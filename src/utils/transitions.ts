import type { TransitionType } from '../types/project'

export interface TransitionDefinition {
  type: TransitionType
  label: string
  previewAnim: string
}

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  { type: 'crossfade', label: 'クロスフェード', previewAnim: 'tp-in-fade' },
  { type: 'dissolve', label: 'ディゾルブ', previewAnim: 'tp-in-dissolve' },
  { type: 'blur', label: 'ブラーディゾルブ', previewAnim: 'tp-in-blur' },
  { type: 'fadeBlack', label: 'フェード to 黒', previewAnim: 'tp-in-cut' },
  { type: 'fadeWhite', label: 'フェード to 白', previewAnim: 'tp-in-cut' },
  { type: 'fadeWarm', label: 'フェード to 暖色', previewAnim: 'tp-in-cut' },
  { type: 'lightLeak', label: 'ライトリーク', previewAnim: 'tp-in-light-leak' },
  { type: 'softFocus', label: 'ソフトフォーカス', previewAnim: 'tp-in-soft-focus' },
  { type: 'crossDissolveWarm', label: '暖色ディゾルブ', previewAnim: 'tp-in-warm-dissolve' },
  { type: 'filmBurn', label: 'フィルムバーン', previewAnim: 'tp-in-film-burn' },
  { type: 'gentleZoom', label: 'ジェントルズーム', previewAnim: 'tp-in-gentle-zoom' },
  { type: 'petalFall', label: '花びら舞', previewAnim: 'tp-in-petal-fall' },
  { type: 'goldenShimmer', label: 'ゴールドシマー', previewAnim: 'tp-in-golden-shimmer' },
  { type: 'softWipe', label: 'ソフトワイプ', previewAnim: 'tp-in-soft-wipe' },
  { type: 'candleGlow', label: 'キャンドルグロー', previewAnim: 'tp-in-candle-glow' },
  { type: 'dreamyBlur', label: 'ドリーミーブラー', previewAnim: 'tp-in-dreamy-blur' },
  { type: 'paperConfetti', label: '紙吹雪', previewAnim: 'tp-in-paper-confetti' },
  { type: 'silkFade', label: 'シルクフェード', previewAnim: 'tp-in-silk-fade' },
  { type: 'starlight', label: 'スターライト', previewAnim: 'tp-in-starlight' },
  { type: 'laceReveal', label: 'レースリビール', previewAnim: 'tp-in-lace-reveal' },
  { type: 'wipe', label: 'ワイプ', previewAnim: 'tp-in-wipe' },
  { type: 'slideLeft', label: 'スライド左', previewAnim: 'tp-in-slide-left' },
  { type: 'slideRight', label: 'スライド右', previewAnim: 'tp-in-slide-right' },
  { type: 'slideUp', label: 'スライド上', previewAnim: 'tp-in-slide-up' },
  { type: 'zoom', label: 'ズーム', previewAnim: 'tp-in-zoom' },
  { type: 'iris', label: 'アイリス', previewAnim: 'tp-in-iris' },
]

export function easeSmoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}
