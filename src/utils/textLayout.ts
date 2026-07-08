export const TEXT_LINE_HEIGHT_RATIO = 1.2

export function splitTextLines(content: string): string[] {
  if (!content) return ['']
  return content.split('\n')
}

export function getTextLineHeight(fontSize: number): number {
  return fontSize * TEXT_LINE_HEIGHT_RATIO
}

export function getTextBlockHeight(lineCount: number, fontSize: number): number {
  const lines = Math.max(lineCount, 1)
  return getTextLineHeight(fontSize) * lines
}

/** ブロック中央を transform.y に揃えた各行の Y 座標(Canvas、textBaseline: middle) */
export function getTextLineYPositions(lineCount: number, fontSize: number, centerY: number): number[] {
  const count = Math.max(lineCount, 1)
  const lineHeight = getTextLineHeight(fontSize)
  const blockHeight = lineHeight * count
  const startY = centerY - (blockHeight - lineHeight) / 2
  return Array.from({ length: count }, (_, i) => startY + i * lineHeight)
}

export function getLongestLineLength(content: string): number {
  return splitTextLines(content).reduce((max, line) => Math.max(max, line.length), 1)
}
