import { describe, expect, it } from 'vitest'
import {
  buildTextClipsFromSrtCues,
  formatSrtImportSummary,
  parseSrt,
  parseSrtTimestamp,
} from './srtParser'

describe('parseSrtTimestamp', () => {
  it('SRT 形式のタイムスタンプを秒に変換する', () => {
    expect(parseSrtTimestamp('00:00:01,000')).toBe(1)
    expect(parseSrtTimestamp('00:01:02,500')).toBe(62.5)
    expect(parseSrtTimestamp('01:00:00.000')).toBe(3600)
  })

  it('不正な形式は null', () => {
    expect(parseSrtTimestamp('invalid')).toBeNull()
    expect(parseSrtTimestamp('00:99:00,000')).toBeNull()
  })
})

describe('parseSrt', () => {
  it('基本的な SRT をパースする', () => {
    const content = `1
00:00:01,000 --> 00:00:03,500
乾杯のご挨拶

2
00:00:05,000 --> 00:00:08,000
ありがとうございました`

    const cues = parseSrt(content)
    expect(cues).toHaveLength(2)
    expect(cues[0]).toMatchObject({
      index: 1,
      startTime: 1,
      endTime: 3.5,
      text: '乾杯のご挨拶',
    })
    expect(cues[1]?.text).toBe('ありがとうございました')
  })

  it('複数行の字幕テキストを結合する', () => {
    const content = `1
00:00:00,000 --> 00:00:02,000
新郎
新婦`

    expect(parseSrt(content)[0]?.text).toBe('新郎\n新婦')
  })

  it('空や不正ブロックをスキップする', () => {
    expect(parseSrt('')).toEqual([])
    expect(parseSrt('not valid srt')).toEqual([])
  })
})

describe('buildTextClipsFromSrtCues', () => {
  it('字幕クリップを生成する', () => {
    const clips = buildTextClipsFromSrtCues(
      [{ index: 1, startTime: 2, endTime: 5, text: '字幕' }],
      'track-text',
    )
    expect(clips).toHaveLength(1)
    expect(clips[0]?.startTime).toBe(2)
    expect(clips[0]?.duration).toBe(3)
    expect(clips[0]?.text.content).toBe('字幕')
    expect(clips[0]?.text.backgroundColor).toBeTruthy()
    expect(clips[0]?.transform.y).toBe(0.88)
  })

  it('長文の字幕はインポート時に折り返す', () => {
    const longText = '本日はお越しいただき、誠にありがとうございます。心より感謝申し上げます。'
    const clips = buildTextClipsFromSrtCues(
      [{ index: 1, startTime: 0, endTime: 3, text: longText }],
      'track-text',
    )
    expect(clips[0]?.text.content).toContain('\n')
  })

  it('短すぎる表示時間は最小値に丸める', () => {
    const clips = buildTextClipsFromSrtCues(
      [{ index: 1, startTime: 0, endTime: 0.05, text: '短い' }],
      'track-text',
    )
    expect(clips[0]?.duration).toBe(0.2)
  })
})

describe('formatSrtImportSummary', () => {
  it('インポート件数メッセージを返す', () => {
    expect(formatSrtImportSummary(3)).toBe('3件の字幕クリップをインポートしました')
    expect(formatSrtImportSummary(2, 'Shift_JIS')).toBe('2件の字幕クリップをインポートしました（Shift_JIS）')
  })
})
