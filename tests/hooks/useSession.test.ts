import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

import { useSession } from '@/hooks/useSession'
import { createMockSession, createMockSessionService } from '@/lib/__tests__/mocks'
import type { Session } from '@/lib/services/sessionService'

function createTestSessionService() {
  let onDataCb: ((session: Session | null) => void) | null = null
  let onErrorCb: ((error: Error) => void) | null = null
  const unsubscribe = vi.fn()
  const presenceCleanup = vi.fn()

  const service = createMockSessionService({
    subscribeSession: vi.fn((_sessionId, onData, onError) => {
      onDataCb = onData
      onErrorCb = onError ?? null
      return unsubscribe
    }),
    monitorPresence: vi.fn(() => presenceCleanup),
  })

  return {
    service,
    fireData: (session: Session | null) => {
      act(() => {
        onDataCb?.(session)
      })
    },
    fireError: (error: Error) => {
      act(() => {
        onErrorCb?.(error)
      })
    },
    unsubscribe,
    presenceCleanup,
  }
}

describe('useSession', () => {
  it('returns initial loading state', () => {
    const { service } = createTestSessionService()

    const { result } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeUndefined()
    expect(result.current.speakerDisconnected).toBe(false)
  })

  it('calls monitorPresence when sessionId and userId provided', () => {
    const { service } = createTestSessionService()

    renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    expect(service.monitorPresence).toHaveBeenCalledWith('session-1', 'user-1')
  })

  it('returns session data after subscribeSession onData fires', () => {
    const { service, fireData } = createTestSessionService()
    const mockSession = createMockSession({ status: 'active' })

    const { result } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    fireData(mockSession)

    expect(result.current.session).toBe(mockSession)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('updates state when session changes', () => {
    const { service, fireData } = createTestSessionService()
    const firstSession = createMockSession({ status: 'lobby' })
    const secondSession = createMockSession({ status: 'active', slotEndsAt: 999_999 })

    const { result } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    fireData(firstSession)
    expect(result.current.session?.status).toBe('lobby')

    fireData(secondSession)
    expect(result.current.session?.status).toBe('active')
    expect(result.current.session?.slotEndsAt).toBe(999_999)
  })

  it('detects speakerDisconnected when active speaker has no presence or offline presence', () => {
    const { service, fireData } = createTestSessionService()

    const { result } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    // Active speaker with missing presence entry
    fireData(
      createMockSession({
        status: 'active',
        activeSpeakerId: 'speaker-1',
        presence: {},
      })
    )
    expect(result.current.speakerDisconnected).toBe(true)

    // Active speaker with offline presence
    fireData(
      createMockSession({
        status: 'active',
        activeSpeakerId: 'speaker-1',
        presence: {
          'speaker-1': { lastSeen: Date.now(), status: 'offline' },
        },
      })
    )
    expect(result.current.speakerDisconnected).toBe(true)

    // Active speaker with online presence → not disconnected
    fireData(
      createMockSession({
        status: 'active',
        activeSpeakerId: 'speaker-1',
        presence: {
          'speaker-1': { lastSeen: Date.now(), status: 'online' },
        },
      })
    )
    expect(result.current.speakerDisconnected).toBe(false)
  })

  it('sets error "Session not found" when onData receives null', () => {
    const { service, fireData } = createTestSessionService()

    const { result } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    fireData(null)

    expect(result.current.error).toBe('Session not found')
    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('sets error from onError callback', () => {
    const { service, fireError } = createTestSessionService()

    const { result } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    fireError(new Error('Permission denied'))

    expect(result.current.error).toBe('Permission denied')
    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('calls unsubscribe on unmount', () => {
    const { service, unsubscribe, presenceCleanup } = createTestSessionService()

    const { unmount } = renderHook(() =>
      useSession('session-1', 'user-1', { sessionService: service })
    )

    expect(unsubscribe).not.toHaveBeenCalled()
    expect(presenceCleanup).not.toHaveBeenCalled()

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(presenceCleanup).toHaveBeenCalledTimes(1)
  })

  it('resubscribes when sessionId changes', () => {
    const { service, unsubscribe } = createTestSessionService()

    const { rerender } = renderHook(
      ({ sessionId }) =>
        useSession(sessionId, 'user-1', { sessionService: service }),
      { initialProps: { sessionId: 'session-1' as string | null } }
    )

    expect(service.subscribeSession).toHaveBeenCalledTimes(1)
    expect((service.subscribeSession as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
      'session-1'
    )

    rerender({ sessionId: 'session-2' })

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(service.subscribeSession).toHaveBeenCalledTimes(2)
    expect((service.subscribeSession as ReturnType<typeof vi.fn>).mock.calls[1][0]).toBe(
      'session-2'
    )
  })

  it('skips subscription when sessionId is null', () => {
    const { service } = createTestSessionService()

    renderHook(() =>
      useSession(null, 'user-1', { sessionService: service })
    )

    expect(service.subscribeSession).not.toHaveBeenCalled()
    expect(service.monitorPresence).not.toHaveBeenCalled()
  })
})
