import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TRANSITION_DEFINITIONS } from './transitions'
import {
  COMPOSITOR_BLUR_TRANSITION_TYPES,
  COMPOSITOR_CANVAS_OVERLAY_TRANSITION_TYPES,
  COMPOSITOR_LAYER_TRANSITION_TYPES,
  COMPOSITOR_TRANSFORM_TRANSITION_TYPES,
  FRAME_RENDER_PATHS,
  findMissingCompositorTransitions,
  findUnknownCompositorTransitions,
} from './renderPathAudit'

const compositorPath = resolve(import.meta.dirname, '../engine/compositor.ts')
const exporterPath = resolve(import.meta.dirname, '../engine/exporter.ts')
const previewPath = resolve(import.meta.dirname, '../panels/PreviewPanel.tsx')

describe('renderPathAudit', () => {
  it('プレビューと書き出しは compositor.renderFrame を共有する', () => {
    const exporterSource = readFileSync(exporterPath, 'utf8')
    const previewSource = readFileSync(previewPath, 'utf8')

    expect(exporterSource).toContain("from './compositor'")
    expect(exporterSource).toContain('renderFrame(ctx, project, time)')
    expect(exporterSource).not.toMatch(/function renderFrame/)

    expect(previewSource).toContain("from '../engine/compositor'")
    expect(previewSource).toContain('renderFrame(ctx, project, time')
    expect(FRAME_RENDER_PATHS.preview.engine).toBe(FRAME_RENDER_PATHS.export.engine)
  })

  it('定義済みトランジション 29 種が compositor switch にすべて存在する', () => {
    const compositorSource = readFileSync(compositorPath, 'utf8')
    expect(findMissingCompositorTransitions(compositorSource)).toEqual([])
    expect(findUnknownCompositorTransitions(compositorSource)).toEqual([])
    expect(COMPOSITOR_LAYER_TRANSITION_TYPES).toHaveLength(29)
    expect(COMPOSITOR_LAYER_TRANSITION_TYPES).toEqual(TRANSITION_DEFINITIONS.map((d) => d.type))
  })

  it('オーバーレイ・変形・ブラー分類が定義済みトランジションの部分集合', () => {
    const all = new Set(COMPOSITOR_LAYER_TRANSITION_TYPES)
    for (const t of COMPOSITOR_CANVAS_OVERLAY_TRANSITION_TYPES) expect(all.has(t)).toBe(true)
    for (const t of COMPOSITOR_TRANSFORM_TRANSITION_TYPES) expect(all.has(t)).toBe(true)
    for (const t of COMPOSITOR_BLUR_TRANSITION_TYPES) expect(all.has(t)).toBe(true)
  })

  it('compositor に未知トランジション用のクロスフェードフォールバックがある', () => {
    const compositorSource = readFileSync(compositorPath, 'utf8')
    expect(compositorSource).toContain('default:')
    expect(compositorSource).toContain("transitionType: 'crossfade'")
  })
})
