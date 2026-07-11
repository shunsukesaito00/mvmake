import { describe, expect, it } from 'vitest'
import { PROJECT_TEMPLATES } from '../types/project'
import {
  buildPhotoGuideClips,
  buildTemplateMarkers,
  buildTemplateTextClips,
  formatPhotoGuideLabel,
} from './weddingTemplate'
import {
  STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT,
  STRUCTURED_WEDDING_TEXT_CLIP_COUNT,
  STRUCTURED_WEDDING_TOTAL_CLIP_COUNT,
} from './structuredWeddingTemplateStressSetup'

const TEXT_TRACK_ID = 'track-text'

describe('weddingTemplate', () => {
  const structured = PROJECT_TEMPLATES.find((t) => t.id === 'structured-wedding')!

  it('写真ガイドラベルを整形する', () => {
    expect(formatPhotoGuideLabel('新郎 幼少期')).toBe('写真: 新郎 幼少期')
  })

  it('テンプレートのテキストクリップを生成する', () => {
    const clips = buildTemplateTextClips(structured, TEXT_TRACK_ID)
    expect(clips).toHaveLength(structured.textClips.length)
    expect(clips[0].text.content).toBe('Opening')
    expect(clips.every((c) => c.trackId === TEXT_TRACK_ID)).toBe(true)
  })

  it('章マーカーを生成する', () => {
    const markers = buildTemplateMarkers(structured)
    expect(markers).toHaveLength(5)
    expect(markers.map((m) => m.label)).toEqual([
      'オープニング',
      '新郎プロフィール',
      '新婦プロフィール',
      '二人の歩み',
      'エンディング',
    ])
  })

  it('写真ガイドクリップを生成する', () => {
    const guides = buildPhotoGuideClips(structured, TEXT_TRACK_ID)
    expect(guides).toHaveLength(8)
    expect(guides[0].text.content).toBe('写真: 新郎 幼少期')
    expect(guides.every((c) => c.animation.type === 'none')).toBe(true)
  })

  it('構造化テンプレートのクリップ総数が11件である', () => {
    const textClips = buildTemplateTextClips(structured, TEXT_TRACK_ID)
    const guides = buildPhotoGuideClips(structured, TEXT_TRACK_ID)
    expect(textClips).toHaveLength(STRUCTURED_WEDDING_TEXT_CLIP_COUNT)
    expect(guides).toHaveLength(STRUCTURED_WEDDING_PHOTO_GUIDE_COUNT)
    expect(textClips.length + guides.length).toBe(STRUCTURED_WEDDING_TOTAL_CLIP_COUNT)
  })
})
