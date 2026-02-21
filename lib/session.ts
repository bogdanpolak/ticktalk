import { db } from './firebase';
import { ref, push, set, update, get, runTransaction, onDisconnect as onDisconnectRef, serverTimestamp } from 'firebase/database';

// Types based on data model from plan
export type SessionStatus = 'lobby' | 'active' | 'finished';

export interface Participant {
  name: string;
  role: 'host' | 'participant';
  isHandRaised: boolean;
}

export interface Session {
  hostId: string;
  createdAt: number;
  slotDurationSeconds: number;
  status: SessionStatus;
  activeSpeakerId: string | null | undefined;
  slotEndsAt: number | null | undefined;
  spokenUserIds: string[];
  participants: {
    [userId: string]: Participant;
  };
  presence?: {
    [userId: string]: {
      lastSeen: number;
      status: 'online' | 'offline';
    };
  };
  hostChangedAt?: number;
  previousHostId?: string;
}

export interface SessionSummary {
  sessionId: string;
  hostId: string;
  createdAt: number;
}

interface CreateSessionInput {
  hostId: string;
  hostName: string;
  slotDurationSeconds: number;
}

/**
 * Create a new session
 * Returns the generated session ID
 */
export async function createSession(input: CreateSessionInput): Promise<string> {
  const sessionRef = push(ref(db, 'sessions'));
  const sessionId = sessionRef.key;
  
  if (!sessionId) {
    throw new Error('Failed to generate session ID');
  }

  const newSession: Session = {
    hostId: input.hostId,
    createdAt: Date.now(),
    slotDurationSeconds: input.slotDurationSeconds,
    status: 'lobby',
    activeSpeakerId: null,
    slotEndsAt: null,
    spokenUserIds: [],
    participants: {
      [input.hostId]: {
        name: input.hostName,
        role: 'host',
        isHandRaised: false
      }
    }
  };

  await set(sessionRef, newSession);
  return sessionId;
}

/**
 * Add a participant to an existing session
 */
export async function joinSession(
  sessionId: string,
  userId: string,
  userName: string
): Promise<void> {
  const trimmedName = userName.trim();

  if (!trimmedName) {
    throw new Error('Participant name is required');
  }

  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`);

  try {
    await set(participantRef, {
      name: trimmedName,
      role: 'participant',
      isHandRaised: false
    });
  } catch (error) {
    throw new Error(
      `Failed to join session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List session summaries for lobby view (could be expanded with pagination/filtering in real app)
 */
export async function listSessions(): Promise<SessionSummary[]> {
  const sessionsRef = ref(db, 'sessions');
  const snapshot = await get(sessionsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const sessionsData = snapshot.val() as Record<string, Session>;
  return Object.entries(sessionsData).map(([sessionId, session]) => ({
    sessionId,
    hostId: session.hostId,
    createdAt: session.createdAt
  }));
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const snapshot = await get(sessionRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const session = snapshot.val() as Session;
  console.log('Fetched session data:', session);
  return session;
}

/**
 * Update session fields
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Session>
): Promise<void> {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  await update(sessionRef, updates);
}

/**
 * Start the meeting (change status to active)
 */
export async function startMeeting(sessionId: string): Promise<void> {
  await updateSession(sessionId, { status: 'active' });
}

/**
 * End the meeting (change status to finished)
 */
export async function endMeeting(sessionId: string): Promise<void> {
  await updateSession(sessionId, {
    status: 'finished',
    activeSpeakerId: null,
    slotEndsAt: null
  });
}

/**
 * Select the next speaker using a transaction to prevent race conditions
 * Tracks who has spoken and resets when all participants have had a turn
 */
export async function selectNextSpeaker(
  sessionId: string,
  nextSpeakerId: string
): Promise<void> {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  
  await runTransaction(sessionRef, (session: Session | null) => {
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Ensure data structures exist
    const spokenUserIds = session.spokenUserIds || [];
    const participants = session.participants || {};
    
    // Validate: nextSpeakerId exists as participant
    if (!participants[nextSpeakerId]) {
      throw new Error(
        `Participant ${nextSpeakerId} not found in session`
      );
    }
    
    // Validate: nextSpeakerId hasn't already spoken in current round
    if (spokenUserIds.includes(nextSpeakerId)) {
      throw new Error(
        `Participant ${nextSpeakerId} has already spoken this round`
      );
    }
    
    // Set new active speaker
    session.activeSpeakerId = nextSpeakerId;
    session.slotEndsAt = Date.now() + session.slotDurationSeconds * 1000;
    
    // Add to spoken list
    const updatedSpokenUserIds = [...spokenUserIds, nextSpeakerId];
    
    // Check if all participants have spoken
    const participantIds = Object.keys(participants);
    const allHaveSpoken = updatedSpokenUserIds.length >= participantIds.length;
    
    // Reset if needed
    const finalSpokenUserIds = allHaveSpoken ? [] : updatedSpokenUserIds;
    
    // Update session
    session.spokenUserIds = finalSpokenUserIds;
    
    return session;
  });
}

/**
 * End the current speaker's slot
 */
export async function endCurrentSlot(sessionId: string): Promise<void> {
  await updateSession(sessionId, {
    activeSpeakerId: null,
    slotEndsAt: null
  });
}

/**
 * Toggle hand raise status for a participant
 */
export async function toggleHandRaise(
  sessionId: string,
  userId: string
): Promise<void> {
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
  
  const snapshot = await get(participantRef);
  const currentState = snapshot.val()?.isHandRaised ?? false;
  
  await update(participantRef, {
    isHandRaised: !currentState
  });
}

/**
 * Remove a participant from a session
 */
export async function removeParticipant(
  sessionId: string,
  userId: string
): Promise<void> {
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
  await set(participantRef, null);
}

/**
 * Promote a participant to host role (for host disconnect scenarios)
 */
export async function promoteToHost(
  sessionId: string,
  userId: string
): Promise<void> {
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
  await update(participantRef, {
    role: 'host'
  });
  
  // Update session hostId
  await updateSession(sessionId, { hostId: userId });
}

/**
 * Monitor presence and set up disconnect cleanup
 * Returns an unsubscribe function
 */
export function monitorPresence(
  sessionId: string,
  userId: string
): () => void {
  const presenceRef = ref(db, `sessions/${sessionId}/presence/${userId}`);
  
  // Set presence on connect
  set(presenceRef, {
    lastSeen: serverTimestamp(),
    status: 'online'
  });
  
  // On disconnect, remove presence
  onDisconnectRef(presenceRef).remove();
  
  // Return cleanup function
  return () => {
    // Remove presence on manual cleanup
    set(presenceRef, null);
  };
}

/**
 * Promote host automatically when current host disconnects
 * Call this when host presence is lost
 */
export async function promoteHostOnDisconnect(
  sessionId: string,
  currentHostId: string
): Promise<void> {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  
  await runTransaction(sessionRef, (session: Session | null) => {
    if (!session) {
      return undefined;
    }
    
    // Verify host is still the one we think disconnected
    if (session.hostId !== currentHostId) {
      // Host already changed, do nothing
      return session;
    }
    
    const participants = session.participants || {};
    
    // Find first non-host participant (deterministic order)
    const candidateIds = Object.keys(participants)
      .filter(id => id !== currentHostId)
      .sort(); // Alphabetical order for determinism
    
    if (candidateIds.length === 0) {
      // No other participants, keep current host
      return session;
    }
    
    const newHostId = candidateIds[0];
    
    // Update participant role
    if (session.participants[newHostId]) {
      session.participants[newHostId].role = 'host';
    }
    session.hostId = newHostId;
    
    // Add log entry for debugging
    session.hostChangedAt = Date.now();
    session.previousHostId = currentHostId;
    
    return session;
  });
}
