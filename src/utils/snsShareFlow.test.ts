import { describe, expect, it } from 'vitest'
import {
  getSnsExportDefaults,
  isVertical916Project,
  SNS_VERTICAL_HEIGHT,
  SNS_VERTICAL_WIDTH,
} from './snsShareFlow'

describe('snsShareFlow', () => {
  it('detects 9:16 vertical project', () => {
    expect(isVertical916Project(SNS_VERTICAL_WIDTH, SNS_VERTICAL_HEIGHT)).toBe(true)
    expect(isVertical916Project(1920, 1080)).toBe(false)
  })

  it('returns SNS export defaults', () => {
    expect(getSnsExportDefaults()).toEqual({ quality: 'light', resolution: 'project' })
  })
})
