import { describe, expect, it } from 'vitest'
import type { TextClip, Track } from '../types/project'
import { parseSrt } from './srtParser'
import {
  buildSrtFromTextClips,
  buildVttFromTextClips,
  collectTextClipsFromTracks,
  formatSrtExportSummary,
  formatSrtTimestamp,
  formatVttTimestamp,
  serializeSrt,
  serializeVtt,
  subtitleFileBaseName,
  textClipsToSrtCues,
} from './srtExporter'

function textClip(id: string, startTime: number, duration: number, content: string): TextClip {
  return {
    id,
    trackId: 'text-1',
    startTime,
    duration,
    sourceStart: 0,
    sourceDuration: duration,
    type: 'text',
    text: {
      content,
      fontFamily: 'Noto Sans JP',
      fontSize: 42,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowBlur: 2,
      textAlign: 'center',
      lineHeight: 1.2,
      verticalAlign: 'bottom',
      backgroundColor: '#00000080',
      backgroundPadding: 12,
      backgroundRadius: 4,
    },
    transform: { x: 0.5, y: 0.88, scale: 1, rotation: 0, opacity: 1 },
    animation: { type: 'fadeIn', duration: 0.3 },
  }
}

describe('formatSrtTimestamp', () => {
  it('秒を SRT タイムスタンプに変換する', () => {
    expect(formatSrtTimestamp(1)).toBe('00:00:01,000')
    expect(formatSrtTimestamp(62.5)).toBe('00:01:02,500')
    expect(formatSrtTimestamp(3600)).toBe('01:00:00,000')
  })

  it('負の値は 0 にクランプする', () => {
    expect(formatSrtTimestamp(-1)).toBe('00:00:00,000')
  })
})

describe('formatVttTimestamp', () => {
  it('ミリ秒区切りにドットを使う', () => {
    expect(formatVttTimestamp(1)).toBe('00:00:01.000')
  })
})

describe('serializeSrt / serializeVtt', () => {
  const cues = [
    { index: 1, startTime: 1, endTime: 3.5, text: '乾杯のご挨拶' },
    { index: 2, startTime: 5, endTime: 8, text: 'ありがとうございました' },
  ]

  it('SRT 形式の文字列を生成する', () => {
    expect(serializeSrt(cues)).toBe(`1
00:00:01,000 --> 00:00:03,500
乾杯のご挨拶

2
00:00:05,000 --> 00:00:08,000
ありがとうございました
`)
  })

  it('VTT 形式の文字列を生成する', () => {
    expect(serializeVtt(cues)).toBe(`WEBVTT

1
00:00:01.000 --> 00:00:03.500
乾杯のご挨拶

2
00:00:05.000 --> 00:00:08.000
ありがとうございました
`)
  })
})

describe('textClipsToSrtCues', () => {
  it('テキストクリップを開始時刻順に変換する', () => {
    const cues = textClipsToSrtCues([
      textClip('b', 5, 3, '後'),
      textClip('a', 1, 2.5, '先'),
    ])
    expect(cues).toHaveLength(2)
    expect(cues[0]?.text).toBe('先')
    expect(cues[1]?.endTime).toBe(8)
  })

  it('空テキストのクリップは除外する', () => {
    expect(textClipsToSrtCues([textClip('a', 0, 1, '   ')])).toEqual([])
  })
})

describe('buildSrtFromTextClips round-trip', () => {
  it('インポートした SRT と同等のキューを再エクスポートできる', () => {
    const imported = `1
00:00:01,000 --> 00:00:03,500
乾杯のご挨拶

2
00:00:05,000 --> 00:00:08,000
ありがとうございました`

    const cues = parseSrt(imported)
    const clips = cues.map((cue, i) =>
      textClip(`clip-${i}`, cue.startTime, cue.endTime - cue.startTime, cue.text),
    )

    expect(parseSrt(buildSrtFromTextClips(clips))).toEqual(cues)
  })
})

describe('collectTextClipsFromTracks', () => {
  it('全テキストトラックのクリップを集める', () => {
    const tracks: Track[] = [
      { id: 'v1', name: '映像', type: 'video', clips: [], muted: false, locked: false },
      {
        id: 't1',
        name: 'テキスト',
        type: 'text',
        clips: [textClip('a', 0, 2, 'A')],
        muted: false,
        locked: false,
      },
    ]
    expect(collectTextClipsFromTracks(tracks)).toHaveLength(1)
  })
})

describe('subtitleFileBaseName', () => {
  it('プロジェクト名をファイル名に使える形にする', () => {
    expect(subtitleFileBaseName('Wedding / 2026')).toBe('Wedding_2026')
    expect(subtitleFileBaseName('   ')).toBe('subtitles')
  })
})

describe('formatSrtExportSummary', () => {
  it('エクスポート件数メッセージを返す', () => {
    expect(formatSrtExportSummary(2, 'srt')).toBe('2件の字幕をSRTでエクスポートしました')
    expect(formatSrtExportSummary(2, 'vtt')).toBe('2件の字幕をVTTでエクスポートしました')
  })
})

describe('buildVttFromTextClips', () => {
  it('WEBVTT ヘッダーを含む', () => {
    const content = buildVttFromTextClips([textClip('a', 0, 2, '字幕')])
    expect(content.startsWith('WEBVTT')).toBe(true)
    expect(content).toContain('字幕')
  })
})
