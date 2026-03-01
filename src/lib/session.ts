import { sessionService } from '@/lib/services/sessionService'
import type {
  CreateSessionInput,
  Participant,
  Session,
  SessionService,
  SessionStatus,
  SessionSummary,
  SpeakingHistoryEntry
} from '@/lib/services/sessionService'

export type {
  CreateSessionInput,
  Participant,
  Session,
  SessionService,
  SessionStatus,
  SessionSummary,
  SpeakingHistoryEntry
}

export async function createSession(input: CreateSessionInput): Promise<string> {
  return sessionService.createSession(input)
}

export async function joinSession(
  sessionId: string,
  userId: string,
  userName: string
): Promise<void> {
  return sessionService.joinSession(sessionId, userId, userName)
}

export async function listSessions(): Promise<SessionSummary[]> {
  return sessionService.listSessions()
}

export async function getSession(sessionId: string): Promise<Session | null> {
  return sessionService.getSession(sessionId)
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Session>
): Promise<void> {
  return sessionService.updateSession(sessionId, updates)
}

export async function startMeeting(sessionId: string): Promise<void> {
  return sessionService.startMeeting(sessionId)
}

export async function endMeeting(sessionId: string): Promise<void> {
  return sessionService.endMeeting(sessionId)
}

export async function selectNextSpeaker(
  sessionId: string,
  nextSpeakerId: string
): Promise<void> {
  return sessionService.selectNextSpeaker(sessionId, nextSpeakerId)
}

export async function endLastSlot(sessionId: string): Promise<void> {
  return sessionService.endLastSlot(sessionId)
}

export async function toggleHandRaise(
  sessionId: string,
  userId: string
): Promise<void> {
  return sessionService.toggleHandRaise(sessionId, userId)
}

export async function removeParticipant(
  sessionId: string,
  userId: string
): Promise<void> {
  return sessionService.removeParticipant(sessionId, userId)
}

export async function promoteToHost(
  sessionId: string,
  userId: string
): Promise<void> {
  return sessionService.promoteToHost(sessionId, userId)
}

export function monitorPresence(sessionId: string, userId: string): () => void {
  return sessionService.monitorPresence(sessionId, userId)
}

export async function promoteHostOnDisconnect(
  sessionId: string,
  currentHostId: string
): Promise<void> {
  return sessionService.promoteHostOnDisconnect(sessionId, currentHostId)
}
