import { describe, expect, it } from 'vitest'
import { formatBytes } from './formatBytes'

describe('formatBytes', () => {
  it('バイト数を読みやすい単位に変換する', () => {
    expect(formatBytes(512)).toBe('512B')
    expect(formatBytes(2048)).toBe('2.0KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0MB')
  })
})
