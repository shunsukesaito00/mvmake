import type { TransitionType } from '../types/project'

export type TransitionCategory = 'dissolve' | 'wedding' | 'motion'

export interface TransitionDefinition {
  type: TransitionType
  label: string
  previewAnim: string
  category: TransitionCategory
}

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  { type: 'crossfade', label: 'クロスフェード', previewAnim: 'tp-in-fade', category: 'dissolve' },
  { type: 'dissolve', label: 'ディゾルブ', previewAnim: 'tp-in-dissolve', category: 'dissolve' },
  { type: 'blur', label: 'ブラーディゾルブ', previewAnim: 'tp-in-blur', category: 'dissolve' },
  { type: 'fadeBlack', label: 'フェード to 黒', previewAnim: 'tp-in-cut', category: 'dissolve' },
  { type: 'fadeWhite', label: 'フェード to 白', previewAnim: 'tp-in-cut', category: 'dissolve' },
  { type: 'fadeWarm', label: 'フェード to 暖色', previewAnim: 'tp-in-cut', category: 'dissolve' },
  { type: 'lightLeak', label: 'ライトリーク', previewAnim: 'tp-in-light-leak', category: 'wedding' },
  { type: 'softFocus', label: 'ソフトフォーカス', previewAnim: 'tp-in-soft-focus', category: 'dissolve' },
  { type: 'crossDissolveWarm', label: '暖色ディゾルブ', previewAnim: 'tp-in-warm-dissolve', category: 'dissolve' },
  { type: 'filmBurn', label: 'フィルムバーン', previewAnim: 'tp-in-film-burn', category: 'wedding' },
  { type: 'gentleZoom', label: 'ジェントルズーム', previewAnim: 'tp-in-gentle-zoom', category: 'motion' },
  { type: 'petalFall', label: '花びら舞', previewAnim: 'tp-in-petal-fall', category: 'wedding' },
  { type: 'goldenShimmer', label: 'ゴールドシマー', previewAnim: 'tp-in-golden-shimmer', category: 'wedding' },
  { type: 'softWipe', label: 'ソフトワイプ', previewAnim: 'tp-in-soft-wipe', category: 'motion' },
  { type: 'candleGlow', label: 'キャンドルグロー', previewAnim: 'tp-in-candle-glow', category: 'wedding' },
  { type: 'dreamyBlur', label: 'ドリーミーブラー', previewAnim: 'tp-in-dreamy-blur', category: 'dissolve' },
  { type: 'paperConfetti', label: '紙吹雪', previewAnim: 'tp-in-paper-confetti', category: 'wedding' },
  { type: 'silkFade', label: 'シルクフェード', previewAnim: 'tp-in-silk-fade', category: 'dissolve' },
  { type: 'starlight', label: 'スターライト', previewAnim: 'tp-in-starlight', category: 'wedding' },
  { type: 'laceReveal', label: 'レースリビール', previewAnim: 'tp-in-lace-reveal', category: 'wedding' },
  { type: 'pearlShimmer', label: 'パールシマー', previewAnim: 'tp-in-pearl-shimmer', category: 'wedding' },
  { type: 'mistFade', label: 'ミストフェード', previewAnim: 'tp-in-mist-fade', category: 'dissolve' },
  { type: 'ribbonCut', label: 'リボンカット', previewAnim: 'tp-in-ribbon-cut', category: 'wedding' },
  { type: 'wipe', label: 'ワイプ', previewAnim: 'tp-in-wipe', category: 'motion' },
  { type: 'slideLeft', label: 'スライド左', previewAnim: 'tp-in-slide-left', category: 'motion' },
  { type: 'slideRight', label: 'スライド右', previewAnim: 'tp-in-slide-right', category: 'motion' },
  { type: 'slideUp', label: 'スライド上', previewAnim: 'tp-in-slide-up', category: 'motion' },
  { type: 'zoom', label: 'ズーム', previewAnim: 'tp-in-zoom', category: 'motion' },
  { type: 'iris', label: 'アイリス', previewAnim: 'tp-in-iris', category: 'motion' },
]

export function easeSmoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}
