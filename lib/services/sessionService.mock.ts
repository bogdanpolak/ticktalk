import type {
  Session,
  SessionService,
  SessionSummary,
  CreateSessionInput
} from './sessionService'

function notImplemented(name: string): never {
  throw new Error(`Mock session service method not implemented: ${name}`)
}

function consumeArgs(args: unknown[]): void {
  void args
}

export function createMockSessionService(
  overrides: Partial<SessionService> = {}
): SessionService {
  return {
    async createSession(...args: [CreateSessionInput]): Promise<string> {
      consumeArgs(args)
      return notImplemented('createSession')
    },
    async joinSession(...args: [string, string, string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('joinSession')
    },
    async listSessions(): Promise<SessionSummary[]> {
      return []
    },
    async getSession(...args: [string]): Promise<Session | null> {
      consumeArgs(args)
      return null
    },
    async updateSession(...args: [string, Partial<Session>]): Promise<void> {
      consumeArgs(args)
      return notImplemented('updateSession')
    },
    async startMeeting(...args: [string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('startMeeting')
    },
    async endMeeting(...args: [string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('endMeeting')
    },
    async selectNextSpeaker(...args: [string, string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('selectNextSpeaker')
    },
    async endLastSlot(...args: [string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('endLastSlot')
    },
    async toggleHandRaise(...args: [string, string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('toggleHandRaise')
    },
    async removeParticipant(...args: [string, string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('removeParticipant')
    },
    async promoteToHost(...args: [string, string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('promoteToHost')
    },
    monitorPresence(...args: [string, string]): () => void {
      consumeArgs(args)
      return () => undefined
    },
    subscribeSession(...args: [string, (session: Session | null) => void, ((error: Error) => void)?]): () => void {
      consumeArgs(args)
      return () => undefined
    },
    async promoteHostOnDisconnect(...args: [string, string]): Promise<void> {
      consumeArgs(args)
      return notImplemented('promoteHostOnDisconnect')
    },
    ...overrides
  }
}
