import { db } from '@/lib/firebase'
import {
  ref,
  push,
  set,
  update,
  get,
  runTransaction,
  onDisconnect as onDisconnectRef,
  serverTimestamp,
  type DatabaseReference
} from 'firebase/database'
import {
  moveToNextSpeaker,
  shouldPromoteNewHost,
  validateSessionTransition
} from '@/lib/sessionLogic'

export type SessionStatus = 'lobby' | 'active' | 'finished'

export interface Participant {
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
  totalSpokeDurationSeconds?: number
  speakingHistory?: SpeakingHistoryEntry[]
}

export interface SpeakingHistoryEntry {
  startTime: number
  endTime: number
  durationSeconds: number
}

export interface Session {
  hostId: string
  createdAt: number
  slotDurationSeconds: number
  status: SessionStatus
  activeSpeakerId: string | null | undefined
  slotEndsAt: number | null | undefined
  slotStartedAt?: number | null
  spokenUserIds: string[]
  participants: {
    [userId: string]: Participant
  }
  presence?: {
    [userId: string]: {
      lastSeen: number
      status: 'online' | 'offline'
    }
  }
  hostChangedAt?: number
  previousHostId?: string
}

export interface SessionSummary {
  sessionId: string
  hostId: string
  createdAt: number
}

export interface CreateSessionInput {
  hostId: string
  hostName: string
  slotDurationSeconds: number
}

export interface SessionService {
  createSession(input: CreateSessionInput): Promise<string>
  joinSession(sessionId: string, userId: string, userName: string): Promise<void>
  listSessions(): Promise<SessionSummary[]>
  getSession(sessionId: string): Promise<Session | null>
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>
  startMeeting(sessionId: string): Promise<void>
  endMeeting(sessionId: string): Promise<void>
  selectNextSpeaker(sessionId: string, nextSpeakerId: string): Promise<void>
  endLastSlot(sessionId: string): Promise<void>
  toggleHandRaise(sessionId: string, userId: string): Promise<void>
  removeParticipant(sessionId: string, userId: string): Promise<void>
  promoteToHost(sessionId: string, userId: string): Promise<void>
  monitorPresence(sessionId: string, userId: string): () => void
  promoteHostOnDisconnect(sessionId: string, currentHostId: string): Promise<void>
}

function endSlot(session: Session): void {
  const activeSpeakerId = session.activeSpeakerId
  if (!activeSpeakerId) {
    throw new Error('No active speaker to end')
  }

  const participant = session.participants?.[activeSpeakerId]
  if (!participant) {
    throw new Error('Active speaker participant not found')
  }

  const now = Date.now()
  const slotStartedAt = session.slotStartedAt

  let durationSeconds = session.slotDurationSeconds
  if (typeof slotStartedAt === 'number') {
    const durationMs = Math.max(0, now - slotStartedAt)
    durationSeconds = Math.round(durationMs / 1000)
  } else {
    console.warn('slotStartedAt missing, using slotDurationSeconds fallback')
  }

  const speakingHistory = participant.speakingHistory ?? []
  const totalSpokeDurationSeconds = participant.totalSpokeDurationSeconds ?? 0

  const entry: SpeakingHistoryEntry = {
    startTime: typeof slotStartedAt === 'number' ? slotStartedAt : now,
    endTime: now,
    durationSeconds
  }

  participant.speakingHistory = [...speakingHistory, entry]
  participant.totalSpokeDurationSeconds = totalSpokeDurationSeconds + durationSeconds

  session.activeSpeakerId = null
  session.slotEndsAt = null
  session.slotStartedAt = null
}

const realSessionService: SessionService = {
  async createSession(input) {
    const sessionRef = push(ref(db, 'sessions'))
    const sessionId = sessionRef.key

    if (!sessionId) {
      throw new Error('Failed to generate session ID')
    }

    const newSession: Session = {
      hostId: input.hostId,
      createdAt: Date.now(),
      slotDurationSeconds: input.slotDurationSeconds,
      status: 'lobby',
      activeSpeakerId: null,
      slotEndsAt: null,
      slotStartedAt: null,
      spokenUserIds: [],
      participants: {
        [input.hostId]: {
          name: input.hostName,
          role: 'host',
          isHandRaised: false,
          totalSpokeDurationSeconds: 0,
          speakingHistory: []
        }
      }
    }

    await set(sessionRef, newSession)
    return sessionId
  },

  async joinSession(sessionId, userId, userName) {
    const trimmedName = userName.trim()

    if (!trimmedName) {
      throw new Error('Participant name is required')
    }

    const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`)

    try {
      await set(participantRef, {
        name: trimmedName,
        role: 'participant',
        isHandRaised: false,
        totalSpokeDurationSeconds: 0,
        speakingHistory: []
      })
    } catch (error) {
      throw new Error(
        `Failed to join session: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  },

  async listSessions() {
    const sessionsRef = ref(db, 'sessions')
    const snapshot = await get(sessionsRef)

    if (!snapshot.exists()) {
      return []
    }

    const sessionsData = snapshot.val() as Record<string, Session>
    return Object.entries(sessionsData).map(([sessionId, session]) => ({
      sessionId,
      hostId: session.hostId,
      createdAt: session.createdAt
    }))
  },

  async getSession(sessionId) {
    const sessionRef = ref(db, `sessions/${sessionId}`)
    const snapshot = await get(sessionRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.val() as Session
  },

  async updateSession(sessionId, updates) {
    const sessionRef = ref(db, `sessions/${sessionId}`)
    await update(sessionRef, updates)
  },

  async startMeeting(sessionId) {
    await realSessionService.updateSession(sessionId, { status: 'active' })
  },

  async endMeeting(sessionId) {
    await realSessionService.updateSession(sessionId, {
      status: 'finished',
      activeSpeakerId: null,
      slotEndsAt: null,
      slotStartedAt: null
    })
  },

  async selectNextSpeaker(sessionId, nextSpeakerId) {
    const sessionRef = ref(db, `sessions/${sessionId}`)

    await runTransaction(sessionRef, (session: Session | null) => {
      if (!session) {
        throw new Error('Session not found')
      }

      const current = { ...session }

      if (current.activeSpeakerId) {
        endSlot(current)
      }

      const next = moveToNextSpeaker(current, nextSpeakerId)

      if (!validateSessionTransition(session, next)) {
        throw new Error('Invalid session transition while selecting next speaker')
      }

      return next
    })
  },

  async endLastSlot(sessionId) {
    const sessionRef: DatabaseReference = ref(db, `sessions/${sessionId}`)

    await runTransaction(sessionRef, (session: Session | null) => {
      if (!session) {
        throw new Error('Session not found')
      }

      endSlot(session)

      return session
    })
  },

  async toggleHandRaise(sessionId, userId) {
    const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`)

    const snapshot = await get(participantRef)
    const currentState = snapshot.val()?.isHandRaised ?? false

    await update(participantRef, {
      isHandRaised: !currentState
    })
  },

  async removeParticipant(sessionId, userId) {
    const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`)
    await set(participantRef, null)
  },

  async promoteToHost(sessionId, userId) {
    const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`)
    await update(participantRef, {
      role: 'host'
    })

    await realSessionService.updateSession(sessionId, { hostId: userId })
  },

  monitorPresence(sessionId, userId) {
    const presenceRef = ref(db, `sessions/${sessionId}/presence/${userId}`)

    set(presenceRef, {
      lastSeen: serverTimestamp(),
      status: 'online'
    })

    onDisconnectRef(presenceRef).remove()

    return () => {
      set(presenceRef, null)
    }
  },

  async promoteHostOnDisconnect(sessionId, currentHostId) {
    const sessionRef = ref(db, `sessions/${sessionId}`)

    await runTransaction(sessionRef, (session: Session | null) => {
      if (!session) {
        return undefined
      }

      if (session.hostId !== currentHostId) {
        return session
      }

      if (!shouldPromoteNewHost(session)) {
        return session
      }

      const participants = session.participants || {}

      const candidateIds = Object.keys(participants)
        .filter(id => id !== currentHostId)
        .sort()

      if (candidateIds.length === 0) {
        return session
      }

      const newHostId = candidateIds[0]

      if (session.participants[newHostId]) {
        session.participants[newHostId].role = 'host'
      }
      session.hostId = newHostId

      session.hostChangedAt = Date.now()
      session.previousHostId = currentHostId

      return session
    })
  }
}

export const sessionService: SessionService = realSessionService
