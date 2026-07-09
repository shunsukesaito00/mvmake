import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Project, TextClip } from '../types/project'
import {
  DEFAULT_TEXT_BACKGROUND_PADDING,
  DEFAULT_TEXT_BACKGROUND_RADIUS,
  DEFAULT_TEXT_LINE_HEIGHT,
  DEFAULT_TRANSFORM,
  DEFAULT_VISUAL_FADE,
} from '../types/project'
import { buildUserProjectTemplate } from './userProjectTemplate'
import {
  buildExportedUserProjectTemplate,
  buildUserProjectTemplateExportFilename,
  parseExportedUserProjectTemplate,
  resolveImportedTemplateLabel,
  serializeExportedUserProjectTemplate,
  userProjectTemplateFromExport,
} from './userProjectTemplateExport'
import {
  exportUserProjectTemplateFile,
  importUserProjectTemplateFromText,
  loadUserProjectTemplates,
  replaceUserProjectTemplates,
  saveUserProjectTemplate,
} from '../persistence/userProjectTemplates'
import { USER_PROJECT_TEMPLATE_SCHEMA_VERSION } from '../types/userProjectTemplate'

const TRACK_TEXT = 'track-text'

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
      { id: 'v1', name: '映像 1', type: 'video', clips: [], muted: false, locked: false },
      { id: 'v2', name: '映像 2', type: 'video', clips: [], muted: false, locked: false },
      {
        id: TRACK_TEXT,
        name: 'テキスト',
        type: 'text',
        clips: [textClip('t1', 0, 'Hello')],
        muted: false,
        locked: false,
      },
      { id: 'bgm', name: 'BGM', type: 'audio', clips: [], muted: false, locked: false },
    ],
  }
}

describe('userProjectTemplateExport', () => {
  it('buildExportedUserProjectTemplate は schemaVersion 付き JSON 用ペイロードを作る', () => {
    const template = buildUserProjectTemplate(sampleProject(), 'エクスポート用')
    const payload = buildExportedUserProjectTemplate(template)
    expect(payload.schemaVersion).toBe(USER_PROJECT_TEMPLATE_SCHEMA_VERSION)
    expect(payload.label).toBe('エクスポート用')
    expect(payload).not.toHaveProperty('id')
    expect(payload.clipEntries).toHaveLength(1)
  })

  it('JSON ラウンドトリップで復元できる', () => {
    const template = buildUserProjectTemplate(sampleProject(), 'ラウンドトリップ')
    const json = serializeExportedUserProjectTemplate(buildExportedUserProjectTemplate(template))
    const parsed = parseExportedUserProjectTemplate(JSON.parse(json))
    const imported = userProjectTemplateFromExport(parsed, [])
    expect(imported.label).toBe('ラウンドトリップ')
    expect(imported.id).not.toBe(template.id)
    expect(imported.clipEntries).toHaveLength(template.clipEntries.length)
    expect(imported.markers).toHaveLength(1)
  })

  it('label 重複時は (インポート) を付与する', () => {
    expect(resolveImportedTemplateLabel('MyTpl', ['Other'])).toBe('MyTpl')
    expect(resolveImportedTemplateLabel('MyTpl', ['MyTpl'])).toBe('MyTpl (インポート)')
    expect(resolveImportedTemplateLabel('MyTpl', ['MyTpl', 'MyTpl (インポート)'])).toBe('MyTpl (インポート 2)')
  })

  it('不正な schemaVersion は拒否する', () => {
    expect(() =>
      parseExportedUserProjectTemplate({ schemaVersion: 99, label: 'x', width: 1, height: 1, fps: 30, markers: [], clipEntries: [] }),
    ).toThrow('バージョン')
  })

  it('buildUserProjectTemplateExportFilename は安全なファイル名を返す', () => {
    expect(buildUserProjectTemplateExportFilename('縦型/テンプレ')).toBe('縦型_テンプレ.fable-template.json')
  })
})

describe('userProjectTemplates export/import persistence', () => {
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

  it('importUserProjectTemplateFromText で一覧に追加する', () => {
    const template = buildUserProjectTemplate(sampleProject(), '既存')
    saveUserProjectTemplate(template)
    const json = serializeExportedUserProjectTemplate(buildExportedUserProjectTemplate(template))

    const imported = importUserProjectTemplateFromText(json)
    expect(imported.label).toBe('既存 (インポート)')
    expect(loadUserProjectTemplates()).toHaveLength(2)
    expect(imported.id).not.toBe(template.id)
  })

  it('exportUserProjectTemplateFile はダウンロード用リンクを生成する', () => {
    const clicks: string[] = []
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {},
    })
    vi.stubGlobal('document', {
      createElement: () => ({
        href: '',
        download: '',
        click: () => clicks.push('click'),
      }),
    })

    const template = buildUserProjectTemplate(sampleProject(), 'DLテスト')
    exportUserProjectTemplateFile(template)
    expect(clicks).toHaveLength(1)
  })

  it('replaceUserProjectTemplates 後のインポートでも動作する', () => {
    replaceUserProjectTemplates([])
    const template = buildUserProjectTemplate(sampleProject(), '新規')
    const json = serializeExportedUserProjectTemplate(buildExportedUserProjectTemplate(template))
    importUserProjectTemplateFromText(json)
    expect(loadUserProjectTemplates()).toHaveLength(1)
  })
})
