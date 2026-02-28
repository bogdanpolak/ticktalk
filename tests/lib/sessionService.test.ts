import { beforeEach, describe, expect, it, vi } from 'vitest'

type RefLike = {
  database?: unknown
  path: string
  key?: string | null
}

type SnapshotLike = {
  exists: () => boolean
  val: () => unknown
}

const mockDb = vi.hoisted(() => ({}))
const SERVER_TIMESTAMP = { '.sv': 'timestamp' }

const firebaseDatabaseMocks = vi.hoisted(() => ({
  ref: vi.fn<(database: unknown, path: string) => RefLike>(),
  push: vi.fn<(reference: RefLike) => RefLike>(),
  set: vi.fn<(reference: unknown, value: unknown) => Promise<void>>(),
  update: vi.fn<(reference: unknown, value: unknown) => Promise<void>>(),
  get: vi.fn<(reference: unknown) => Promise<SnapshotLike>>(),
  onValue: vi.fn(),
  runTransaction:
    vi.fn<
      (reference: unknown, updater: (value: unknown) => unknown) => Promise<{ committed: boolean }>
    >(),
  onDisconnect: vi.fn(() => ({ remove: vi.fn() })),
  serverTimestamp: vi.fn(() => SERVER_TIMESTAMP)
}))

vi.mock('@/lib/firebase', () => ({
  db: mockDb
}))

vi.mock('firebase/database', () => ({
  ref: firebaseDatabaseMocks.ref,
  push: firebaseDatabaseMocks.push,
  set: firebaseDatabaseMocks.set,
  update: firebaseDatabaseMocks.update,
  get: firebaseDatabaseMocks.get,
  onValue: firebaseDatabaseMocks.onValue,
  runTransaction: firebaseDatabaseMocks.runTransaction,
  onDisconnect: firebaseDatabaseMocks.onDisconnect,
  serverTimestamp: firebaseDatabaseMocks.serverTimestamp
}))

import { sessionService, type Session } from '@/lib/services/sessionService'

const FIXED_NOW = 1_700_000_000_000

function snapshotOf(value: unknown): SnapshotLike {
  return {
    exists: () => value !== null && value !== undefined,
    val: () => value
  }
}

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW)

    firebaseDatabaseMocks.ref.mockImplementation((database: unknown, path: string) => ({
      database,
      path
    }))
    firebaseDatabaseMocks.push.mockImplementation((reference: RefLike) => ({
      ...reference,
      key: 'generated-session-id'
    }))
    firebaseDatabaseMocks.set.mockResolvedValue(undefined)
    firebaseDatabaseMocks.update.mockResolvedValue(undefined)
    firebaseDatabaseMocks.get.mockResolvedValue(snapshotOf(null))
    firebaseDatabaseMocks.runTransaction.mockImplementation(
      async (_reference: unknown, updater: (value: unknown) => unknown) => {
        updater(null)
        return { committed: true }
      }
    )
    firebaseDatabaseMocks.onDisconnect.mockImplementation(() => ({ remove: vi.fn() }))
    firebaseDatabaseMocks.serverTimestamp.mockReturnValue(SERVER_TIMESTAMP)
  })

  describe('createSession', () => {
    it('creates session with generated sessionId', async () => {
      const result = await sessionService.createSession({
        hostId: 'host-1',
        hostName: 'Host User',
        slotDurationSeconds: 120
      })

      expect(result).toBe('generated-session-id')
      expect(firebaseDatabaseMocks.push).toHaveBeenCalledTimes(1)
      expect(firebaseDatabaseMocks.set).toHaveBeenCalledTimes(1)
    })

    it('sets host/participants defaults and empty speaking history', async () => {
      await sessionService.createSession({
        hostId: 'host-1',
        hostName: 'Host User',
        slotDurationSeconds: 90
      })

      expect(firebaseDatabaseMocks.set).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'sessions', key: 'generated-session-id' }),
        {
          hostId: 'host-1',
          createdAt: FIXED_NOW,
          slotDurationSeconds: 90,
          status: 'lobby',
          activeSpeakerId: null,
          slotEndsAt: null,
          slotStartedAt: null,
          spokenUserIds: [],
          participants: {
            'host-1': {
              name: 'Host User',
              role: 'host',
              isHandRaised: false,
              totalSpokeDurationSeconds: 0,
              speakingHistory: []
            }
          }
        }
      )
    })
  })

  describe('joinSession', () => {
    it('trims name and writes participant data', async () => {
      await sessionService.joinSession('session-1', 'participant-1', '  Alice  ')

      expect(firebaseDatabaseMocks.set).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'sessions/session-1/participants/participant-1' }),
        {
          name: 'Alice',
          role: 'participant',
          isHandRaised: false,
          totalSpokeDurationSeconds: 0,
          speakingHistory: []
        }
      )
    })

    it('throws for empty name', async () => {
      await expect(sessionService.joinSession('session-1', 'participant-1', '   ')).rejects.toThrow(
        'Participant name is required'
      )

      expect(firebaseDatabaseMocks.set).not.toHaveBeenCalled()
    })
  })

  describe('selectNextSpeaker', () => {
    it('validates participant existence (indirect via moveToNextSpeaker)', async () => {
      const existingSession: Session = {
        hostId: 'host-1',
        createdAt: FIXED_NOW,
        slotDurationSeconds: 60,
        status: 'active',
        activeSpeakerId: null,
        slotEndsAt: null,
        slotStartedAt: null,
        spokenUserIds: [],
        participants: {
          'host-1': {
            name: 'Host',
            role: 'host',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          }
        }
      }

      firebaseDatabaseMocks.runTransaction.mockImplementationOnce(
        async (_reference: unknown, updater: (value: Session | null) => unknown) => {
          updater(existingSession)
          return { committed: true }
        }
      )

      await expect(sessionService.selectNextSpeaker('session-1', 'missing-user')).rejects.toThrow(
        'Participant missing-user not found in session'
      )
    })

    it('updates active speaker and timestamps via transaction path', async () => {
      const existingSession: Session = {
        hostId: 'host-1',
        createdAt: FIXED_NOW,
        slotDurationSeconds: 60,
        status: 'active',
        activeSpeakerId: null,
        slotEndsAt: null,
        slotStartedAt: null,
        spokenUserIds: [],
        participants: {
          'host-1': {
            name: 'Host',
            role: 'host',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          },
          'participant-1': {
            name: 'Participant 1',
            role: 'participant',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          }
        }
      }

      let transactionResult: Session | undefined
      firebaseDatabaseMocks.runTransaction.mockImplementationOnce(
        async (_reference: unknown, updater: (value: unknown) => unknown) => {
          transactionResult = updater(existingSession) as Session
          return { committed: true }
        }
      )

      await sessionService.selectNextSpeaker('session-1', 'participant-1')

      expect(firebaseDatabaseMocks.runTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'sessions/session-1' }),
        expect.any(Function)
      )
      expect(transactionResult).toMatchObject({
        activeSpeakerId: 'participant-1',
        slotStartedAt: FIXED_NOW,
        slotEndsAt: FIXED_NOW + 60_000,
        spokenUserIds: ['participant-1']
      })
    })
  })

  describe('endLastSlot', () => {
    it('computes duration and clears active speaker fields', async () => {
      const activeSession: Session = {
        hostId: 'host-1',
        createdAt: FIXED_NOW,
        slotDurationSeconds: 60,
        status: 'active',
        activeSpeakerId: 'participant-1',
        slotStartedAt: FIXED_NOW - 4_500,
        slotEndsAt: FIXED_NOW + 55_500,
        spokenUserIds: ['participant-1'],
        participants: {
          'participant-1': {
            name: 'Participant 1',
            role: 'participant',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          }
        }
      }

      let transactionResult: Session | undefined
      firebaseDatabaseMocks.runTransaction.mockImplementationOnce(
        async (_reference: unknown, updater: (value: unknown) => unknown) => {
          transactionResult = updater(activeSession) as Session
          return { committed: true }
        }
      )

      await sessionService.endLastSlot('session-1')

      expect(transactionResult).toBeDefined()
      expect(transactionResult!.activeSpeakerId).toBeNull()
      expect(transactionResult!.slotStartedAt).toBeNull()
      expect(transactionResult!.slotEndsAt).toBeNull()
      expect(transactionResult!.participants['participant-1'].totalSpokeDurationSeconds).toBe(5)
      expect(transactionResult!.participants['participant-1'].speakingHistory).toEqual([
        {
          startTime: FIXED_NOW - 4_500,
          endTime: FIXED_NOW,
          durationSeconds: 5
        }
      ])
    })
  })

  describe('endMeeting', () => {
    it('sets status finished and clears active slot fields', async () => {
      await sessionService.endMeeting('session-1')

      expect(firebaseDatabaseMocks.update).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'sessions/session-1' }),
        {
          status: 'finished',
          activeSpeakerId: null,
          slotEndsAt: null,
          slotStartedAt: null
        }
      )
    })
  })

  describe('toggleHandRaise', () => {
    it('toggles participant hand flag based on existing value', async () => {
      firebaseDatabaseMocks.get.mockResolvedValueOnce(snapshotOf({ isHandRaised: true }))

      await sessionService.toggleHandRaise('session-1', 'participant-1')

      expect(firebaseDatabaseMocks.update).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'sessions/session-1/participants/participant-1' }),
        { isHandRaised: false }
      )
    })
  })

  describe('monitorPresence', () => {
    it('writes online presence, registers onDisconnect removal, and cleanup clears presence', () => {
      const remove = vi.fn()
      firebaseDatabaseMocks.onDisconnect.mockReturnValueOnce({ remove })

      const cleanup = sessionService.monitorPresence('session-1', 'user-1')

      expect(firebaseDatabaseMocks.set).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ path: 'sessions/session-1/presence/user-1' }),
        {
          lastSeen: SERVER_TIMESTAMP,
          status: 'online'
        }
      )
      expect(firebaseDatabaseMocks.onDisconnect).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'sessions/session-1/presence/user-1' })
      )
      expect(remove).toHaveBeenCalledTimes(1)

      cleanup()

      expect(firebaseDatabaseMocks.set).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ path: 'sessions/session-1/presence/user-1' }),
        null
      )
    })
  })

  describe('promoteHostOnDisconnect', () => {
    it('promotes next participant when host missing/offline and candidate exists', async () => {
      const sessionBefore: Session = {
        hostId: 'host-1',
        createdAt: FIXED_NOW,
        slotDurationSeconds: 60,
        status: 'active',
        activeSpeakerId: null,
        slotStartedAt: null,
        slotEndsAt: null,
        spokenUserIds: [],
        participants: {
          'host-1': {
            name: 'Host',
            role: 'host',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          },
          'a-user': {
            name: 'Alice',
            role: 'participant',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          },
          'z-user': {
            name: 'Zoe',
            role: 'participant',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          }
        },
        presence: {
          'host-1': {
            lastSeen: FIXED_NOW - 1_000,
            status: 'offline'
          }
        }
      }

      let transactionResult: Session | undefined
      firebaseDatabaseMocks.runTransaction.mockImplementationOnce(
        async (_reference: unknown, updater: (value: unknown) => unknown) => {
          transactionResult = updater(structuredClone(sessionBefore)) as Session
          return { committed: true }
        }
      )

      await sessionService.promoteHostOnDisconnect('session-1', 'host-1')

      expect(transactionResult).toMatchObject({
        hostId: 'a-user',
        previousHostId: 'host-1',
        hostChangedAt: FIXED_NOW
      })
      expect(transactionResult?.participants['a-user'].role).toBe('host')
    })

    it('keeps session unchanged when no promotion needed', async () => {
      const sessionBefore: Session = {
        hostId: 'host-1',
        createdAt: FIXED_NOW,
        slotDurationSeconds: 60,
        status: 'active',
        activeSpeakerId: null,
        slotStartedAt: null,
        slotEndsAt: null,
        spokenUserIds: [],
        participants: {
          'host-1': {
            name: 'Host',
            role: 'host',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          },
          'a-user': {
            name: 'Alice',
            role: 'participant',
            isHandRaised: false,
            totalSpokeDurationSeconds: 0,
            speakingHistory: []
          }
        },
        presence: {
          'host-1': {
            lastSeen: FIXED_NOW,
            status: 'online'
          }
        }
      }

      let transactionResult: Session | undefined
      firebaseDatabaseMocks.runTransaction.mockImplementationOnce(
        async (_reference: unknown, updater: (value: unknown) => unknown) => {
          transactionResult = updater(structuredClone(sessionBefore)) as Session
          return { committed: true }
        }
      )

      await sessionService.promoteHostOnDisconnect('session-1', 'host-1')

      expect(transactionResult).toEqual(sessionBefore)
    })
  })
})
