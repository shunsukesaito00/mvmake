import type { TextStyle } from '../types/project'
import { getTextLineHeight } from './textLayout'

export function hasTextBackground(text: Pick<TextStyle, 'backgroundColor'>): boolean {
  return Boolean(text.backgroundColor)
}

export function getTextBackgroundRect(
  lineYs: number[],
  lineHeight: number,
  maxLineWidth: number,
  anchorX: number,
  textAlign: TextStyle['textAlign'],
  padding: number,
): { x: number; y: number; width: number; height: number } {
  const topY = lineYs[0] - lineHeight / 2
  const bottomY = lineYs[lineYs.length - 1] + lineHeight / 2
  const innerWidth = Math.max(maxLineWidth, 1)
  const width = innerWidth + padding * 2
  const height = bottomY - topY + padding * 2

  let x: number
  if (textAlign === 'center') x = anchorX - innerWidth / 2 - padding
  else if (textAlign === 'right') x = anchorX - innerWidth - padding
  else x = anchorX - padding

  return { x, y: topY - padding, width, height }
}

export function measureMaxLineWidth(ctx: CanvasRenderingContext2D, lines: string[]): number {
  return lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0)
}

export function drawTextBackground(
  ctx: CanvasRenderingContext2D,
  text: TextStyle,
  lines: string[],
  lineYs: number[],
  anchorX: number,
  fontSize: number,
  canvasW: number,
): void {
  if (!hasTextBackground(text)) return

  const scale = canvasW / 1920
  const padding = text.backgroundPadding * scale
  const radius = text.backgroundRadius * scale
  const lineHeight = getTextLineHeight(fontSize, text.lineHeight)
  const maxLineWidth = measureMaxLineWidth(ctx, lines)
  const rect = getTextBackgroundRect(lineYs, lineHeight, maxLineWidth, anchorX, text.textAlign, padding)

  ctx.save()
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.fillStyle = text.backgroundColor
  ctx.beginPath()
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius)
  ctx.fill()
  ctx.restore()
}
