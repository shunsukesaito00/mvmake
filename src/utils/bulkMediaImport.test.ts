import { describe, expect, it } from 'vitest'
import {
  BULK_IMPORT_FILE_THRESHOLD,
  isBulkMediaImport,
  mapWithConcurrency,
} from './bulkMediaImport'

describe('bulkMediaImport', () => {
  it('detects bulk import threshold', () => {
    expect(isBulkMediaImport(BULK_IMPORT_FILE_THRESHOLD - 1)).toBe(false)
    expect(isBulkMediaImport(BULK_IMPORT_FILE_THRESHOLD)).toBe(true)
    expect(isBulkMediaImport(20)).toBe(true)
  })

  it('mapWithConcurrency preserves order', async () => {
    const items = [1, 2, 3, 4, 5]
    const results = await mapWithConcurrency(items, 2, async (value) => value * 2)
    expect(results).toEqual([2, 4, 6, 8, 10])
  })

  it('mapWithConcurrency limits active workers', async () => {
    let active = 0
    let maxActive = 0
    const items = Array.from({ length: 6 }, (_, i) => i)
    await mapWithConcurrency(items, 2, async (value) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active -= 1
      return value
    })
    expect(maxActive).toBeLessThanOrEqual(2)
  })
})
