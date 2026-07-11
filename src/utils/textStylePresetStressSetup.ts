import type { TextStyle } from '../types/project'
import { replaceTextStylePresets } from '../persistence/textStylePresets'
import { buildSavedTextStylePreset } from './textStylePresetUtils'

/** E2E/ストレス用の保存スタイル件数 */
export const TEXT_STYLE_PRESET_STRESS_COUNT = 8

const BASE_STYLE: Omit<TextStyle, 'content'> = {
  fontFamily: 'Noto Sans JP',
  fontSize: 48,
  color: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowColor: 'rgba(0,0,0,0.5)',
  shadowBlur: 4,
  textAlign: 'center',
  lineHeight: 1.2,
  verticalAlign: 'center',
  backgroundColor: '',
  backgroundPadding: 8,
  backgroundRadius: 4,
}

function stressTextStyle(index: number): TextStyle {
  return {
    ...BASE_STYLE,
    content: `Stress ${index}`,
    fontSize: 36 + index * 4,
    color: `#${(0x100000 + index * 0x111111).toString(16).slice(1, 7)}`,
    lineHeight: 1.2 + index * 0.1,
  }
}

export interface TextStylePresetStressStats {
  presetCount: number
  names: string[]
}

export function seedTextStylePresetStress(
  count = TEXT_STYLE_PRESET_STRESS_COUNT,
): TextStylePresetStressStats {
  const presets = Array.from({ length: count }, (_, i) =>
    buildSavedTextStylePreset(`スタイル${i + 1}`, stressTextStyle(i)),
  )
  replaceTextStylePresets(presets)
  return { presetCount: presets.length, names: presets.map((p) => p.name) }
}

export function clearTextStylePresetStress(): void {
  replaceTextStylePresets([])
}
