import { vi } from 'vitest'

import type { AuthService } from '@/lib/services/authService'
import type { AudioService } from '@/lib/services/audioService'
import type { StorageService, StoredSettings } from '@/lib/services/storageService'
import type {
  Participant,
  Session,
  SessionService,
  SessionSummary
} from '@/lib/services/sessionService'

const MOCK_TIMESTAMP = 1_700_000_000_000
const MOCK_HOST_ID = 'host-1'
const MOCK_PARTICIPANT_ID = 'participant-1'
const MOCK_SESSION_ID = 'session-1'

const MOCK_STORAGE_KEYS = {
  userName: 'ticktalk_userName',
  slotDuration: 'ticktalk_slotDuration',
  isCustomDuration: 'ticktalk_isCustomDuration'
} as const

export const DEFAULT_LOADED_SETTINGS: StoredSettings = {
  userName: 'Test User',
  slotDuration: 120,
  isCustomDuration: false
}

let previousLocalStorage: Storage | undefined
let previousAudioConstructor: typeof Audio | undefined

export function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    name: 'Participant',
    role: 'participant',
    isHandRaised: false,
    totalSpokeDurationSeconds: 0,
    speakingHistory: [],
    ...overrides
  }
}

export function createMockSession(overrides: Partial<Session> = {}): Session {
  const defaultParticipants: Session['participants'] = {
    [MOCK_HOST_ID]: createMockParticipant({ name: 'Host', role: 'host' }),
    [MOCK_PARTICIPANT_ID]: createMockParticipant({ name: 'Participant 1' })
  }
  const spokenUserIds = overrides.spokenUserIds ?? []
  const participants = overrides.participants ?? defaultParticipants

  return {
    hostId: MOCK_HOST_ID,
    createdAt: MOCK_TIMESTAMP,
    slotDurationSeconds: 120,
    status: 'lobby',
    activeSpeakerId: null,
    slotEndsAt: null,
    slotStartedAt: null,
    ...overrides,
    spokenUserIds,
    participants
  }
}

export function createMockSessionService(
  overrides: Partial<SessionService> = {}
): SessionService {
  const defaultSummary: SessionSummary = {
    sessionId: MOCK_SESSION_ID,
    hostId: MOCK_HOST_ID,
    createdAt: MOCK_TIMESTAMP
  }

  const service: SessionService = {
    createSession: vi.fn(async () => MOCK_SESSION_ID),
    joinSession: vi.fn(async () => undefined),
    listSessions: vi.fn(async () => [defaultSummary]),
    getSession: vi.fn(async () => createMockSession()),
    updateSession: vi.fn(async () => undefined),
    startMeeting: vi.fn(async () => undefined),
    endMeeting: vi.fn(async () => undefined),
    selectNextSpeaker: vi.fn(async () => undefined),
    endLastSlot: vi.fn(async () => undefined),
    toggleHandRaise: vi.fn(async () => undefined),
    removeParticipant: vi.fn(async () => undefined),
    promoteToHost: vi.fn(async () => undefined),
    monitorPresence: vi.fn(() => vi.fn()),
    subscribeSession: vi.fn(() => vi.fn()),
    promoteHostOnDisconnect: vi.fn(async () => undefined)
  }

  return {
    ...service,
    ...overrides
  }
}

export function createMockAuthService(overrides: Partial<AuthService> = {}): AuthService {
  const service: AuthService = {
    getCurrentUser: vi.fn(() => null),
    getCurrentUserId: vi.fn(async () => 'user-1'),
    onAuthStateChange: vi.fn(() => vi.fn())
  }

  return {
    ...service,
    ...overrides
  }
}

export function createMockStorageService(
  overrides: Partial<StorageService> = {}
): StorageService {
  const service: StorageService = {
    saveSettings: vi.fn(() => undefined),
    loadSettings: vi.fn(() => ({ ...DEFAULT_LOADED_SETTINGS }))
  }

  return {
    ...service,
    ...overrides
  }
}

export function createMockAudioService(overrides: Partial<AudioService> = {}): AudioService {
  const service: AudioService = {
    playTimerExpiredSound: vi.fn(() => undefined),
    stopTimerExpiredSound: vi.fn(() => undefined),
    setEnabled: vi.fn(() => undefined)
  }

  return {
    ...service,
    ...overrides
  }
}

export function createLocalStorageMock(
  initialStore: Record<string, string> = {}
): { storage: Storage; store: Map<string, string> } {
  const store = new Map<string, string>(Object.entries(initialStore))

  const storage: Storage = {
    get length() {
      return store.size
    },
    clear: vi.fn(() => {
      store.clear()
    }),
    getItem: vi.fn((key: string) => {
      return store.has(key) ? store.get(key)! : null
    }),
    key: vi.fn((index: number) => {
      return Array.from(store.keys())[index] ?? null
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value)
    })
  }

  return {
    storage,
    store
  }
}

export function installLocalStorageMock(settings: StoredSettings = DEFAULT_LOADED_SETTINGS): Storage {
  if (!previousLocalStorage && typeof globalThis.localStorage !== 'undefined') {
    previousLocalStorage = globalThis.localStorage
  }

  const { storage } = createLocalStorageMock({
    [MOCK_STORAGE_KEYS.userName]: settings.userName,
    [MOCK_STORAGE_KEYS.slotDuration]: String(settings.slotDuration),
    [MOCK_STORAGE_KEYS.isCustomDuration]: String(settings.isCustomDuration)
  })

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: storage
  })

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: storage
    })
  }

  return storage
}

export function resetLocalStorageMock(): void {
  if (typeof previousLocalStorage === 'undefined') {
    return
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: previousLocalStorage
  })

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: previousLocalStorage
    })
  }
}

export type MockAudioElement = Pick<
  HTMLAudioElement,
  'currentTime' | 'volume' | 'play' | 'pause'
>

export function createAudioElementMock(
  overrides: Partial<MockAudioElement> = {}
): MockAudioElement {
  return {
    currentTime: 0,
    volume: 1,
    play: vi.fn(async () => undefined),
    pause: vi.fn(() => undefined),
    ...overrides
  }
}

export function installAudioConstructorMock(
  audioElement: MockAudioElement = createAudioElementMock()
): MockAudioElement {
  if (!previousAudioConstructor && typeof globalThis.Audio !== 'undefined') {
    previousAudioConstructor = globalThis.Audio
  }

  const AudioMock = vi.fn(() => audioElement as unknown as HTMLAudioElement) as unknown as typeof Audio

  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    writable: true,
    value: AudioMock
  })

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: AudioMock
    })
  }

  return audioElement
}

export function resetAudioConstructorMock(): void {
  if (typeof previousAudioConstructor === 'undefined') {
    return
  }

  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    writable: true,
    value: previousAudioConstructor
  })

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: previousAudioConstructor
    })
  }
}
