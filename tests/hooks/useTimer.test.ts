import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTimer } from '@/app/hooks/useTimer'
import { createMockAudioService } from '@/lib/__tests__/mocks'
import type { TimeService } from '@/lib/services/timeService'

function createTestTimeService(startNowMs = 100_000): {
  timeService: TimeService
  setNow: (nextNowMs: number) => void
  advanceBySeconds: (seconds: number) => void
  setIntervalSpy: ReturnType<typeof vi.fn>
  clearIntervalSpy: ReturnType<typeof vi.fn>
} {
  let nowMs = startNowMs

  const setIntervalSpy = vi.fn((handler: () => void, ms: number) => globalThis.setInterval(handler, ms))
  const clearIntervalSpy = vi.fn((id: ReturnType<typeof globalThis.setInterval>) => {
    globalThis.clearInterval(id)
  })

  const timeService: TimeService = {
    now: () => nowMs,
    setInterval: setIntervalSpy,
    clearInterval: clearIntervalSpy,
    computeRemainingSeconds: (slotEndsAt: number | null) => {
      if (slotEndsAt === null) {
        return 0
      }
      return Math.ceil((slotEndsAt - nowMs) / 1000)
    }
  }

  return {
    timeService,
    setNow(nextNowMs) {
      nowMs = nextNowMs
    },
    advanceBySeconds(seconds) {
      for (let index = 0; index < seconds; index += 1) {
        nowMs += 1000
        act(() => {
          vi.advanceTimersByTime(1000)
        })
      }
    },
    setIntervalSpy,
    clearIntervalSpy
  }
}

describe('useTimer', () => {
  it('computes remaining seconds from slotEndsAt', () => {
    const { timeService } = createTestTimeService(1_000)

    const { result } = renderHook(() =>
      useTimer(31_000, 120, {
        timeService
      })
    )

    expect(result.current.remaining).toBe(30)
    expect(result.current.isActive).toBe(true)
  })

  it('sets isExpired=true when remaining is zero or below', () => {
    const { timeService } = createTestTimeService(10_000)

    const { result } = renderHook(() =>
      useTimer(10_000, 120, {
        timeService
      })
    )

    expect(result.current.remaining).toBe(0)
    expect(result.current.isExpired).toBe(true)
  })

  it('sets isOverTime=true when remaining is below zero', () => {
    const { timeService } = createTestTimeService(10_000)

    const { result } = renderHook(() =>
      useTimer(7_000, 120, {
        timeService
      })
    )

    expect(result.current.remaining).toBe(-3)
    expect(result.current.isExpired).toBe(true)
    expect(result.current.isOverTime).toBe(true)
    expect(result.current.overTimeSeconds).toBe(3)
  })

  it('applies warning threshold at 25% of duration', () => {
    const { timeService } = createTestTimeService(0)

    const { result, rerender } = renderHook(
      ({ slotEndsAt }) =>
        useTimer(slotEndsAt, 120, {
          timeService
        }),
      {
        initialProps: { slotEndsAt: 31_000 }
      }
    )

    expect(result.current.remaining).toBe(31)
    expect(result.current.isWarning).toBe(false)

    rerender({ slotEndsAt: 30_000 })

    expect(result.current.remaining).toBe(30)
    expect(result.current.isWarning).toBe(true)
  })

  it('applies critical threshold at 12.5% for long slots', () => {
    const { timeService } = createTestTimeService(0)

    const { result, rerender } = renderHook(
      ({ slotEndsAt }) =>
        useTimer(slotEndsAt, 120, {
          timeService
        }),
      {
        initialProps: { slotEndsAt: 16_000 }
      }
    )

    expect(result.current.remaining).toBe(16)
    expect(result.current.isCritical).toBe(false)

    rerender({ slotEndsAt: 15_000 })

    expect(result.current.remaining).toBe(15)
    expect(result.current.isCritical).toBe(true)
  })

  it('applies critical threshold minimum of 5 seconds for short slots', () => {
    const { timeService } = createTestTimeService(0)

    const { result, rerender } = renderHook(
      ({ slotEndsAt }) =>
        useTimer(slotEndsAt, 20, {
          timeService
        }),
      {
        initialProps: { slotEndsAt: 6_000 }
      }
    )

    expect(result.current.remaining).toBe(6)
    expect(result.current.isCritical).toBe(false)

    rerender({ slotEndsAt: 5_000 })

    expect(result.current.remaining).toBe(5)
    expect(result.current.isCritical).toBe(true)
  })

  it('plays expiration sound exactly once when timer reaches zero', () => {
    const { timeService, advanceBySeconds } = createTestTimeService(0)
    const audioService = createMockAudioService()

    const { result } = renderHook(() =>
      useTimer(2_000, 120, {
        timeService,
        audioService
      })
    )

    expect(result.current.remaining).toBe(2)
    expect(audioService.playTimerExpiredSound).not.toHaveBeenCalled()

    advanceBySeconds(1)
    expect(result.current.remaining).toBe(1)
    expect(audioService.playTimerExpiredSound).not.toHaveBeenCalled()

    advanceBySeconds(1)
    expect(result.current.remaining).toBe(0)
    expect(audioService.playTimerExpiredSound).toHaveBeenCalledTimes(1)

    advanceBySeconds(3)
    expect(result.current.remaining).toBe(-3)
    expect(audioService.playTimerExpiredSound).toHaveBeenCalledTimes(1)
  })

  it('resets sound flag when timer restarts, allowing sound to play again', () => {
    const { timeService } = createTestTimeService(10_000)
    const audioService = createMockAudioService()

    const { rerender } = renderHook(
      ({ slotEndsAt }) =>
        useTimer(slotEndsAt, 120, {
          timeService,
          audioService
        }),
      {
        initialProps: { slotEndsAt: 10_000 }
      }
    )

    expect(audioService.playTimerExpiredSound).toHaveBeenCalledTimes(1)

    rerender({ slotEndsAt: 30_000 })
    rerender({ slotEndsAt: 10_000 })

    expect(audioService.playTimerExpiredSound).toHaveBeenCalledTimes(2)
  })

  it('returns idle state when slotEndsAt is null and does not start interval', () => {
    const { timeService, setIntervalSpy } = createTestTimeService(0)

    const { result } = renderHook(() =>
      useTimer(null, 120, {
        timeService
      })
    )

    expect(result.current.isActive).toBe(false)
    expect(result.current.isExpired).toBe(false)
    expect(result.current.remaining).toBe(0)
    expect(setIntervalSpy).not.toHaveBeenCalled()
  })

  it('clears interval on unmount', () => {
    const { timeService, clearIntervalSpy } = createTestTimeService(0)

    const { unmount } = renderHook(() =>
      useTimer(15_000, 120, {
        timeService
      })
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('syncs remaining state with slotEndsAt prop changes', () => {
    const { timeService } = createTestTimeService(0)

    const { result, rerender } = renderHook(
      ({ slotEndsAt }) =>
        useTimer(slotEndsAt, 120, {
          timeService
        }),
      {
        initialProps: { slotEndsAt: 10_000 }
      }
    )

    expect(result.current.remaining).toBe(10)

    rerender({ slotEndsAt: 25_000 })

    expect(result.current.remaining).toBe(25)
  })
})
