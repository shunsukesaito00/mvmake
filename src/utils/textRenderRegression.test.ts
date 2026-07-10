import { describe, expect, it } from 'vitest'
import { SUBTITLE_BAND_COLOR } from '../types/project'
import { buildCanvasFontString } from './googleFonts'
import { getTextBackgroundRect, measureMaxLineWidth } from './textBackground'
import {
  getTextBlockHeight,
  getTextLineHeight,
  getTextLineYPositions,
  splitTextLines,
} from './textLayout'
import { wrapTextLinesToCanvasWidth } from './textWrap'

const CANVAS_W = 1920
const CANVAS_H = 1080
const MAX_TEXT_WIDTH = CANVAS_W * 0.88

function mockCanvasContext(charWidth = 14): CanvasRenderingContext2D {
  return {
    measureText(text: string) {
      return { width: text.length * charWidth }
    },
  } as CanvasRenderingContext2D
}

function assertFiniteRect(rect: { x: number; y: number; width: number; height: number }): void {
  for (const value of [rect.x, rect.y, rect.width, rect.height]) {
    expect(Number.isFinite(value)).toBe(true)
  }
  expect(rect.width).toBeGreaterThan(0)
  expect(rect.height).toBeGreaterThan(0)
}

describe('text render pipeline regression', () => {
  it('長文をキャンバス幅で複数行に折り返す', () => {
    const longLine = '本日はお越しいただき、誠にありがとうございます。'.repeat(4)
    const ctx = mockCanvasContext(16)
    const wrapped = wrapTextLinesToCanvasWidth(ctx, splitTextLines(longLine), 400)
    expect(wrapped.length).toBeGreaterThan(1)
    expect(wrapped.every((line) => line.length > 0)).toBe(true)
  })

  it('明示改行とキャンバス折り返しを併用する', () => {
    const content = `${'あ'.repeat(30)}\n${'い'.repeat(30)}`
    const ctx = mockCanvasContext(12)
    const wrapped = wrapTextLinesToCanvasWidth(ctx, splitTextLines(content), 200)
    expect(wrapped.length).toBeGreaterThan(2)
  })

  it.each([
    { padding: 0, radius: 0, fontSize: 120 },
    { padding: 40, radius: 24, fontSize: 42 },
  ])('字幕帯極端値でも背景矩形が有限 (padding=$padding radius=$radius)', ({ padding, radius, fontSize }) => {
    const ctx = mockCanvasContext()
    const scaledFontSize = fontSize * (CANVAS_W / 1920)
    const lines = ['新郎新婦のご挨拶', '心より感謝申し上げます']
    const lineHeight = getTextLineHeight(scaledFontSize, 1.2)
    const anchorY = CANVAS_H * 0.88
    const lineYs = getTextLineYPositions(lines.length, scaledFontSize, anchorY, {
      lineHeight: 1.2,
      verticalAlign: 'bottom',
    })
    const maxLineWidth = measureMaxLineWidth(ctx, lines)
    const scale = CANVAS_W / 1920
    const rect = getTextBackgroundRect(
      lineYs,
      lineHeight,
      maxLineWidth,
      CANVAS_W / 2,
      'center',
      padding * scale,
    )
    assertFiniteRect(rect)
    expect(rect.x + rect.width).toBeLessThanOrEqual(CANVAS_W + padding * scale + 1)
    expect(rect.y + rect.height).toBeLessThanOrEqual(CANVAS_H + padding * scale + lineHeight)
    expect(radius).toBeGreaterThanOrEqual(0)
    expect(SUBTITLE_BAND_COLOR).toContain('rgba')
  })

  it('大フォント長文ブロックの行配置が有限', () => {
    const fontSize = 120 * (CANVAS_W / 1920)
    const ctx = mockCanvasContext(10)
    const wrapped = wrapTextLinesToCanvasWidth(ctx, splitTextLines('あ'.repeat(100)), MAX_TEXT_WIDTH)
    const lineYs = getTextLineYPositions(wrapped.length, fontSize, CANVAS_H * 0.5, {
      verticalAlign: 'center',
    })
    expect(lineYs.every((y) => Number.isFinite(y))).toBe(true)
    expect(getTextBlockHeight(wrapped.length, fontSize)).toBeGreaterThan(fontSize)
    expect(buildCanvasFontString('Noto Sans JP', fontSize)).toContain('Noto Sans JP')
  })
})
