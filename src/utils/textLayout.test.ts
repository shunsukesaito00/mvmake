import { describe, expect, it } from 'vitest'
import {
  getLongestLineLength,
  getTextBlockHeight,
  getTextLineYPositions,
  splitTextLines,
  TEXT_LINE_HEIGHT_RATIO,
} from './textLayout'

describe('textLayout', () => {
  it('splitTextLines が改行で分割する', () => {
    expect(splitTextLines('A\nB')).toEqual(['A', 'B'])
    expect(splitTextLines('')).toEqual([''])
  })

  it('getTextBlockHeight が行数に比例する', () => {
    expect(getTextBlockHeight(2, 40)).toBe(40 * TEXT_LINE_HEIGHT_RATIO * 2)
  })

  it('getTextLineYPositions が中央揃えの Y を返す', () => {
    const ys = getTextLineYPositions(2, 20, 100)
    expect(ys).toHaveLength(2)
    expect(ys[1] - ys[0]).toBeCloseTo(20 * TEXT_LINE_HEIGHT_RATIO)
  })

  it('getLongestLineLength が最長行を返す', () => {
    expect(getLongestLineLength('短\nもっと長い行')).toBe(6)
  })
})
