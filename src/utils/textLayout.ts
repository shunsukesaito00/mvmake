import type { TextVerticalAlign } from '../types/project'
import { DEFAULT_TEXT_LINE_HEIGHT } from '../types/project'

export const TEXT_LINE_HEIGHT_RATIO = DEFAULT_TEXT_LINE_HEIGHT

export interface TextLayoutOptions {
  lineHeight?: number
  verticalAlign?: TextVerticalAlign
}

export function splitTextLines(content: string): string[] {
  if (!content) return ['']
  return content.split('\n')
}

export function resolveLineHeightRatio(lineHeight?: number): number {
  return lineHeight ?? TEXT_LINE_HEIGHT_RATIO
}

export function getTextLineHeight(fontSize: number, lineHeight?: number): number {
  return fontSize * resolveLineHeightRatio(lineHeight)
}

export function getTextBlockHeight(lineCount: number, fontSize: number, lineHeight?: number): number {
  const lines = Math.max(lineCount, 1)
  return getTextLineHeight(fontSize, lineHeight) * lines
}

/** ブロックの縦配置基準点(anchorY)に揃えた各行の Y 座標(Canvas、textBaseline: middle) */
export function getTextLineYPositions(
  lineCount: number,
  fontSize: number,
  anchorY: number,
  options?: TextLayoutOptions,
): number[] {
  const count = Math.max(lineCount, 1)
  const lineHeightPx = getTextLineHeight(fontSize, options?.lineHeight)
  const blockHeight = lineHeightPx * count
  const align = options?.verticalAlign ?? 'center'

  let startY: number
  if (align === 'top') {
    startY = anchorY + lineHeightPx / 2
  } else if (align === 'bottom') {
    startY = anchorY - blockHeight + lineHeightPx / 2
  } else {
    startY = anchorY - (blockHeight - lineHeightPx) / 2
  }

  return Array.from({ length: count }, (_, i) => startY + i * lineHeightPx)
}

export function getLongestLineLength(content: string): number {
  return splitTextLines(content).reduce((max, line) => Math.max(max, line.length), 1)
}
