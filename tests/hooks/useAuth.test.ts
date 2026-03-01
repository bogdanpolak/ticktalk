import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    getCurrentUserId: vi.fn(),
    onAuthStateChange: vi.fn()
  }
}))

import { useAuth } from '@/hooks/useAuth'

type AuthService = {
  getCurrentUser: () => unknown
  getCurrentUserId: () => Promise<string>
  onAuthStateChange: (...args: unknown[]) => unknown
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

async function flushAuthEffect(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useAuth', () => {
  it('starts in loading state and calls getCurrentUserId on mount', async () => {
    const getCurrentUserId = vi.fn<() => Promise<string>>().mockResolvedValue('user-1')
    const authService: AuthService = {
      getCurrentUser: vi.fn().mockReturnValue(null),
      getCurrentUserId,
      onAuthStateChange: vi.fn()
    }

    const { result } = renderHook(() => useAuth({ authService }))

    expect(result.current.userId).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeUndefined()
    expect(getCurrentUserId).toHaveBeenCalledTimes(1)

    await flushAuthEffect()
    expect(result.current.isLoading).toBe(false)
  })

  it('returns userId after auth succeeds', async () => {
    const authService: AuthService = {
      getCurrentUser: vi.fn().mockReturnValue(null),
      getCurrentUserId: vi.fn<() => Promise<string>>().mockResolvedValue('user-123'),
      onAuthStateChange: vi.fn()
    }

    const { result } = renderHook(() => useAuth({ authService }))

    await flushAuthEffect()

    expect(result.current).toEqual({
      userId: 'user-123',
      isLoading: false
    })
  })

  it('returns error state when auth fails', async () => {
    const authService: AuthService = {
      getCurrentUser: vi.fn().mockReturnValue(null),
      getCurrentUserId: vi.fn<() => Promise<string>>().mockRejectedValue(new Error('auth failed')),
      onAuthStateChange: vi.fn()
    }

    const { result } = renderHook(() => useAuth({ authService }))

    await flushAuthEffect()

    expect(result.current).toEqual({
      userId: null,
      isLoading: false,
      error: 'auth failed'
    })
  })

  it('does not re-authenticate on rerender when authService instance is stable', async () => {
    const getCurrentUserId = vi.fn<() => Promise<string>>().mockResolvedValue('stable-user')
    const authService: AuthService = {
      getCurrentUser: vi.fn().mockReturnValue(null),
      getCurrentUserId,
      onAuthStateChange: vi.fn()
    }

    const { result, rerender } = renderHook(() => useAuth({ authService }))

    await flushAuthEffect()

    expect(result.current.userId).toBe('stable-user')
    expect(result.current.isLoading).toBe(false)

    rerender()

    await flushAuthEffect()

    expect(result.current.userId).toBe('stable-user')
    expect(getCurrentUserId).toHaveBeenCalledTimes(1)
  })

  it('does not update state after unmount when auth resolves late', async () => {
    const deferred = createDeferred<string>()
    const getCurrentUserId = vi.fn<() => Promise<string>>().mockImplementation(() => deferred.promise)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const authService: AuthService = {
      getCurrentUser: vi.fn().mockReturnValue(null),
      getCurrentUserId,
      onAuthStateChange: vi.fn()
    }

    const { result, unmount } = renderHook(() => useAuth({ authService }))

    expect(result.current.userId).toBeNull()
    expect(result.current.isLoading).toBe(true)

    unmount()

    await act(async () => {
      deferred.resolve('late-user')
      await Promise.resolve()
    })

    expect(getCurrentUserId).toHaveBeenCalledTimes(1)
    expect(result.current.userId).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
