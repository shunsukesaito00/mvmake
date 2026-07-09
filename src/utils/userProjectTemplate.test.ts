import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Project, TextClip } from '../types/project'
import {
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  DEFAULT_TEXT_LINE_HEIGHT,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
} from '../types/project'
import {
  applyUserProjectTemplateToTracks,
  buildUserProjectTemplate,
  formatUserProjectTemplateSummary,
  summarizeUserProjectTemplate,
} from './userProjectTemplate'
import {
  deleteUserProjectTemplate,
  loadUserProjectTemplates,
  replaceUserProjectTemplates,
  saveUserProjectTemplate,
} from '../persistence/userProjectTemplates'

const TRACK_V1 = 'track-v1'
const TRACK_V2 = 'track-v2'
const TRACK_TEXT = 'track-text'
const TRACK_BGM = 'track-bgm'

function textClip(id: string, startTime: number, content: string): TextClip {
  return {
    id,
    trackId: TRACK_TEXT,
    type: 'text',
    startTime,
    duration: 3,
    sourceStart: 0,
    sourceDuration: 3,
    text: {
      content,
      fontSize: 48,
      fontFamily: 'sans-serif',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 4,
      textAlign: 'center',
      verticalAlign: 'center',
      lineHeight: DEFAULT_TEXT_LINE_HEIGHT,
      backgroundColor: 'rgba(0,0,0,0.5)',
      backgroundPadding: DEFAULT_TEXT_BACKGROUND_PADDING,
      backgroundRadius: DEFAULT_TEXT_BACKGROUND_RADIUS,
    },
    transform: { ...DEFAULT_TRANSFORM },
    animation: { type: 'fadeIn', duration: 0.5 },
    ...DEFAULT_VISUAL_FADE,
  }
}

function sampleProject(): Project {
  return {
    id: 'proj-1',
    name: 'テスト',
    width: 1080,
    height: 1920,
    fps: 24,
    mediaAssets: [],
    markers: [{ id: 'm1', time: 5, label: '章1' }],
    tracks: [
      { id: TRACK_V1, name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
      { id: TRACK_V2, name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
      {
        id: TRACK_TEXT,
        name: 'テキスト',
        type: 'text',
        clips: [textClip('t1', 0, 'Hello'), textClip('t2', 4, 'World')],
        muted: false,
        locked: false,
      },
      { id: TRACK_BGM, name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  }
}

describe('userProjectTemplate utils', () => {
  it('buildUserProjectTemplate でプロジェクト構成を保存する', () => {
    const template = buildUserProjectTemplate(sampleProject(), '縦型オープニング', '9:16用')
    expect(template.label).toBe('縦型オープニング')
    expect(template.description).toBe('9:16用')
    expect(template.width).toBe(1080)
    expect(template.height).toBe(1920)
    expect(template.fps).toBe(24)
    expect(template.markers).toHaveLength(1)
    expect(template.markers[0].label).toBe('章1')
    expect(template.clipEntries).toHaveLength(2)
    const firstEntry = template.clipEntries[0]!
    expect(firstEntry.trackType).toBe('text')
    expect(firstEntry.clip.type).toBe('text')
    expect((firstEntry.clip as TextClip).text.content).toBe('Hello')
    expect(template.clipEntries[0].clip).not.toHaveProperty('id')
    expect(template.clipEntries[0].clip).not.toHaveProperty('trackId')
  })

  it('空のテンプレート名は拒否する', () => {
    expect(() => buildUserProjectTemplate(sampleProject(), '  ')).toThrow('テンプレート名')
  })

  it('applyUserProjectTemplateToTracks は新しい ID でクリップとマーカーを復元する', () => {
    const template = buildUserProjectTemplate(sampleProject(), '復元テスト')
    const baseTracks = sampleProject().tracks.map((t) => ({ ...t, clips: [] }))
    const { tracks, markers } = applyUserProjectTemplateToTracks(template, baseTracks)

    const textTrack = tracks.find((t) => t.id === TRACK_TEXT)
    expect(textTrack?.clips).toHaveLength(2)
    expect(textTrack?.clips[0].id).not.toBe('t1')
    const firstClip = textTrack?.clips[0]
    expect(firstClip?.type).toBe('text')
    if (firstClip?.type === 'text') {
      expect(firstClip.text.content).toBe('Hello')
    }
    const appliedMarkers = markers ?? []
    expect(appliedMarkers).toHaveLength(1)
    expect(appliedMarkers[0]!.id).not.toBe('m1')
    expect(appliedMarkers[0]!.label).toBe('章1')
  })

  it('summarize と format で概要を表示する', () => {
    const template = buildUserProjectTemplate(sampleProject(), '概要')
    const summary = summarizeUserProjectTemplate(template)
    expect(summary.clipCount).toBe(2)
    expect(summary.markerCount).toBe(1)
    expect(formatUserProjectTemplateSummary(summary)).toContain('1080×1920')
    expect(formatUserProjectTemplateSummary(summary)).toContain('クリップ2件')
  })
})

describe('userProjectTemplates persistence', () => {
  const store: Record<string, string> = {}

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key])
      },
    })
  })

  it('保存・読み込み・削除ができる', () => {
    expect(loadUserProjectTemplates()).toEqual([])
    const template = buildUserProjectTemplate(sampleProject(), '保存テスト')
    saveUserProjectTemplate(template)
    expect(loadUserProjectTemplates()).toHaveLength(1)
    expect(loadUserProjectTemplates()[0].label).toBe('保存テスト')

    deleteUserProjectTemplate(template.id)
    expect(loadUserProjectTemplates()).toEqual([])
  })

  it('replaceUserProjectTemplates で一覧を置き換える', () => {
    const template = buildUserProjectTemplate(sampleProject(), '置換')
    replaceUserProjectTemplates([template])
    expect(loadUserProjectTemplates()).toHaveLength(1)
  })
})
