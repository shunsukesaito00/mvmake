import { describe, expect, it } from 'vitest'
import { formatTimelineTextLabel, wrapLineByCanvasWidth, wrapSubtitleLine, wrapSubtitleText, wrapTextLinesToCanvasWidth } from './textWrap'

function mockCanvasContext(charWidth = 12): CanvasRenderingContext2D {
  return {
    measureText(text: string) {
      return { width: text.length * charWidth }
    },
  } as CanvasRenderingContext2D
}

describe('textWrap', () => {
  it('長い1行を句読点付近で折り返す', () => {
    const line = '本日はお越しいただき、誠にありがとうございます。心より感謝申し上げます。'
    const wrapped = wrapSubtitleLine(line, 18)
    expect(wrapped.length).toBeGreaterThan(1)
    expect(wrapped.every((part) => part.length <= 18)).toBe(true)
    expect(wrapped.join('')).toBe(line)
  })

  it('wrapSubtitleText が改行を保持する', () => {
    const text = '新郎の挨拶です。長い文章をここに続けます。\n新婦の挨拶です。'
    const wrapped = wrapSubtitleText(text, 12)
    expect(wrapped).toContain('\n')
  })

  it('formatTimelineTextLabel が改行を平坦化して省略する', () => {
    expect(formatTimelineTextLabel('A\nB', 10)).toBe('A / B')
    expect(formatTimelineTextLabel('あ'.repeat(50), 10)).toBe(`${'あ'.repeat(9)}…`)
  })

  it('wrapLineByCanvasWidth が幅超過行を分割する', () => {
    const ctx = mockCanvasContext(10)
    const wrapped = wrapLineByCanvasWidth(ctx, 'あいうえおかきくけこ', 50)
    expect(wrapped.length).toBeGreaterThan(1)
    expect(wrapped.join('')).toBe('あいうえおかきくけこ')
  })

  it('wrapTextLinesToCanvasWidth が複数行を個別に折り返す', () => {
    const ctx = mockCanvasContext(8)
    const wrapped = wrapTextLinesToCanvasWidth(ctx, ['短い', 'あ'.repeat(30)], 80)
    expect(wrapped.length).toBeGreaterThan(2)
  })
})
