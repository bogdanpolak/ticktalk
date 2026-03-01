import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateAgo, formatDuration } from '@/utils'

describe('app/utils formatDuration', () => {
  it('formats expected values', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(125)).toBe('2:05')
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('returns 0:00 for invalid input', () => {
    expect(formatDuration(-1)).toBe('0:00')
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00')
  })
})

describe('app/utils calculateAgo', () => {
  const NOW = new Date('2026-03-01T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns deterministic relative labels across ranges', () => {
    const nowMs = NOW.getTime()

    expect(calculateAgo(nowMs)).toBe('just now')
    expect(calculateAgo(nowMs - 5_000)).toBe('5 seconds ago')
    expect(calculateAgo(nowMs - 120_000)).toBe('2 minutes ago')
    expect(calculateAgo(nowMs - 7_200_000)).toBe('2 hours ago')
    expect(calculateAgo(nowMs - 172_800_000)).toBe('2 days ago')
  })
})
