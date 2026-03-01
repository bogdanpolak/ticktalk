import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  buildParticipantRows,
  computeTimerState,
  moveToNextSpeaker,
  shouldPromoteNewHost,
  validateSessionTransition
} from '@/lib/sessionLogic'
import { createMockParticipant, createMockSession } from '@/lib/__tests__/mocks'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('moveToNextSpeaker', () => {
  it('updates activeSpeakerId, spokenUserIds, and slot timing boundaries on success', () => {
    const now = 1_700_123_456_789
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const session = createMockSession({
      slotDurationSeconds: 90,
      spokenUserIds: ['host-1']
    })

    const next = moveToNextSpeaker(session, 'participant-1')

    expect(next.activeSpeakerId).toBe('participant-1')
    expect(next.spokenUserIds).toEqual(['host-1', 'participant-1'])
    expect(next.slotStartedAt).toBe(now)
    expect(next.slotEndsAt).toBe(now + 90_000)
  })

  it('throws when speaker is not found', () => {
    const session = createMockSession()

    expect(() => moveToNextSpeaker(session, 'missing-user')).toThrow(
      'Participant missing-user not found in session'
    )
  })

  it('throws when speaker has already spoken', () => {
    const session = createMockSession({
      spokenUserIds: ['participant-1']
    })

    expect(() => moveToNextSpeaker(session, 'participant-1')).toThrow(
      'Participant participant-1 has already spoken in this session'
    )
  })
})

describe('computeTimerState', () => {
  it('returns not expired and not overtime for positive remaining', () => {
    expect(computeTimerState(5, 60)).toEqual({
      isExpired: false,
      isOvertime: false
    })
  })

  it('returns expired and not overtime for zero remaining', () => {
    expect(computeTimerState(0, 60)).toEqual({
      isExpired: true,
      isOvertime: false
    })
  })

  it('returns expired and overtime for negative remaining', () => {
    expect(computeTimerState(-3, 60)).toEqual({
      isExpired: true,
      isOvertime: true
    })
  })
})

describe('buildParticipantRows', () => {
  it('sorts active speaker first, then hand-raised, then by name', () => {
    const session = createMockSession({
      hostId: 'host-1',
      activeSpeakerId: 'participant-2',
      spokenUserIds: ['participant-3'],
      participants: {
        'host-1': createMockParticipant({
          name: 'Host',
          role: 'host',
          isHandRaised: false
        }),
        'participant-1': createMockParticipant({
          name: 'Charlie',
          isHandRaised: false
        }),
        'participant-2': createMockParticipant({
          name: 'Zed',
          isHandRaised: false
        }),
        'participant-3': createMockParticipant({
          name: 'Amy',
          isHandRaised: true
        }),
        'participant-4': createMockParticipant({
          name: 'Bob',
          isHandRaised: true
        })
      }
    })

    const rows = buildParticipantRows(session)

    expect(rows.map(row => row.userId)).toEqual([
      'participant-2',
      'participant-3',
      'participant-4',
      'participant-1',
      'host-1'
    ])
    expect(rows.find(row => row.userId === 'participant-3')?.hasSpoken).toBe(true)
    expect(rows.find(row => row.userId === 'participant-2')?.isActiveSpeaker).toBe(true)
  })
})

describe('validateSessionTransition', () => {
  it('blocks status downgrade', () => {
    const current = createMockSession({ status: 'active' })
    const next = createMockSession({ status: 'lobby' })

    expect(validateSessionTransition(current, next)).toBe(false)
  })

  it('blocks invalid finished state when activeSpeakerId is set', () => {
    const current = createMockSession({ status: 'active' })
    const next = createMockSession({
      status: 'finished',
      activeSpeakerId: 'participant-1',
      slotStartedAt: null,
      slotEndsAt: null
    })

    expect(validateSessionTransition(current, next)).toBe(false)
  })
})

describe('shouldPromoteNewHost', () => {
  it('returns true when host is present but marked online=false and another candidate exists', () => {
    const session = createMockSession({
      hostId: 'host-1',
      participants: {
        'host-1': createMockParticipant({ name: 'Host', role: 'host' }),
        'participant-1': createMockParticipant({ name: 'Participant 1' })
      },
      presence: {
        'host-1': {
          lastSeen: 1_700_000_000_000,
          status: 'offline'
        }
      }
    })

    expect(shouldPromoteNewHost(session)).toBe(true)
  })

  it('returns true when host is missing and there is a candidate', () => {
    const session = createMockSession({
      hostId: 'host-1',
      participants: {
        'participant-1': createMockParticipant({ name: 'Participant 1' })
      }
    })

    expect(shouldPromoteNewHost(session)).toBe(true)
  })

  it('returns false when host is missing and there are no candidates', () => {
    const session = createMockSession({
      hostId: 'host-1',
      participants: {}
    })

    expect(shouldPromoteNewHost(session)).toBe(false)
  })
})
