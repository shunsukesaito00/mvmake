import { describe, expect, it } from 'vitest'
import { buildSrtFromTextClips, textClipsToSrtCues } from './srtExporter'
import { buildTextClipsFromSrtCues, parseSrt } from './srtParser'

const LONG_SRT_TEXT =
  '本日はお越しいただき、誠にありがとうございます。新郎新婦一同、心より感謝申し上げます。これからも末永くお付き合いください。'

describe('SRT round trip via text clips', () => {
  it('長文 SRT をインポート→エクスポートしてタイムコードと本文を保持する', () => {
    const srt = `1
00:00:01,000 --> 00:00:06,500
${LONG_SRT_TEXT}`

    const cues = parseSrt(srt)
    expect(cues).toHaveLength(1)

    const clips = buildTextClipsFromSrtCues(cues, 'track-text')
    expect(clips[0]?.text.content).toContain('\n')

    const exported = buildSrtFromTextClips(clips)
    const roundTripped = parseSrt(exported)
    expect(roundTripped).toHaveLength(1)
    expect(roundTripped[0]?.startTime).toBe(1)
    expect(roundTripped[0]?.endTime).toBeCloseTo(6.5, 3)
    expect(roundTripped[0]?.text).toBe(clips[0]?.text.content)
  })

  it('複数キュー往復で件数と順序を保持する', () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
乾杯

2
00:00:05,000 --> 00:00:08,000
${LONG_SRT_TEXT}`

    const clips = buildTextClipsFromSrtCues(parseSrt(srt), 'track-text')
    const cues = textClipsToSrtCues(clips)
    expect(cues).toHaveLength(2)
    expect(cues[0]?.text).toBe('乾杯')
    expect(cues[1]?.text).toContain('\n')
    expect(buildSrtFromTextClips(clips)).toContain('00:00:05,000 --> 00:00:08,000')
  })
})
