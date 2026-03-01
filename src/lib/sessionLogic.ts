import type { Session } from '@/lib/services/sessionService'

export interface ParticipantRow {
  userId: string
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
  isActiveSpeaker: boolean
  hasSpoken: boolean
  totalSpokeDurationSeconds: number
}

export function moveToNextSpeaker(session: Session, nextSpeakerId: string): Session {
  const spokenUserIds = session.spokenUserIds || []
  const participants = session.participants || {}

  if (!participants[nextSpeakerId]) {
    throw new Error(`Participant ${nextSpeakerId} not found in session`)
  }

  if (spokenUserIds.includes(nextSpeakerId)) {
    throw new Error(`Participant ${nextSpeakerId} has already spoken in this session`)
  }

  const now = Date.now()

  return {
    ...session,
    activeSpeakerId: nextSpeakerId,
    slotStartedAt: now,
    slotEndsAt: now + session.slotDurationSeconds * 1000,
    spokenUserIds: [...spokenUserIds, nextSpeakerId]
  }
}

export function computeRemainingSeconds(slotEndsAt: number | null, now: number = Date.now()): number {
  if (slotEndsAt === null) {
    return 0
  }

  return Math.ceil((slotEndsAt - now) / 1000)
}

export function computeTimerState(
  remaining: number,
  duration: number
): { isExpired: boolean; isOvertime: boolean } {
  void duration

  return {
    isExpired: remaining <= 0,
    isOvertime: remaining < 0
  }
}

export function buildParticipantRows(session: Session): ParticipantRow[] {
  const rows: ParticipantRow[] = Object.entries(session.participants || {}).map(
    ([userId, participant]) => ({
      userId,
      name: participant.name,
      role: userId === session.hostId ? 'host' : 'participant',
      isHandRaised: participant.isHandRaised,
      isActiveSpeaker: session.activeSpeakerId === userId,
      hasSpoken: (session.spokenUserIds || []).includes(userId),
      totalSpokeDurationSeconds: participant.totalSpokeDurationSeconds ?? 0
    })
  )

  return rows.sort((a, b) => {
    if (a.isActiveSpeaker !== b.isActiveSpeaker) {
      return a.isActiveSpeaker ? -1 : 1
    }
    if (a.isHandRaised !== b.isHandRaised) {
      return a.isHandRaised ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

export function validateSessionTransition(current: Session, next: Session): boolean {
  const rank: Record<Session['status'], number> = {
    lobby: 0,
    active: 1,
    finished: 2
  }

  if (rank[next.status] < rank[current.status]) {
    return false
  }

  if (next.status === 'finished') {
    if (next.activeSpeakerId !== null) {
      return false
    }
    if (next.slotEndsAt !== null) {
      return false
    }
    if (next.slotStartedAt !== null) {
      return false
    }
  }

  if (next.activeSpeakerId && !next.participants[next.activeSpeakerId]) {
    return false
  }

  return true
}

export function shouldPromoteNewHost(session: Session): boolean {
  const hostPresence = session.presence?.[session.hostId]
  const isHostMissing = !session.participants?.[session.hostId]
  const isHostOffline = hostPresence?.status === 'offline'

  if (!isHostMissing && !isHostOffline) {
    return false
  }

  const candidates = Object.keys(session.participants || {}).filter(id => id !== session.hostId)
  return candidates.length > 0
}
