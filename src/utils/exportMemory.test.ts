import { describe, expect, it } from 'vitest'
import { estimateExportMemoryPressure } from './exportMemory'

describe('estimateExportMemoryPressure', () => {
  it('通常の 1080p 短尺では警告なし', () => {
    const result = estimateExportMemoryPressure({
      width: 1920,
      height: 1080,
      durationSec: 120,
      quality: 'standard',
    })
    expect(result.level).toBe('none')
    expect(result.message).toBeNull()
  })

  it('4K 長尺では high 警告', () => {
    const result = estimateExportMemoryPressure({
      width: 3840,
      height: 2160,
      durationSec: 600,
      quality: 'standard',
    })
    expect(result.level).toBe('high')
    expect(result.message).toContain('4K')
  })

  it('章一括 4 章以上では caution', () => {
    const result = estimateExportMemoryPressure({
      width: 1920,
      height: 1080,
      durationSec: 60,
      quality: 'standard',
      chapterCount: 5,
    })
    expect(result.level).toBe('caution')
    expect(result.message).toContain('章')
  })
})
