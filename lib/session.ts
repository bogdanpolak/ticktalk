import { db } from './firebase';
import { ref, push, set, update, get, runTransaction } from 'firebase/database';

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
  activeSpeakerId: string | null;
  slotEndsAt: number | null;
  spokenUserIds: string[];
  participants: {
    [userId: string]: Participant;
  };
}

export interface SessionSummary {
  sessionId: string;
  hostId: string;
  createdAt: number;
}

/**
 * Create a new session
 * Returns the generated session ID
 */
export async function createSession(
  hostId: string,
  hostName: string,
  createdAt: number,
  slotDurationSeconds: number
): Promise<string> {
  const sessionRef = push(ref(db, 'sessions'));
  const sessionId = sessionRef.key;
  
  if (!sessionId) {
    throw new Error('Failed to generate session ID');
  }

  const newSession: Session = {
    hostId,
    createdAt,
    slotDurationSeconds,
    status: 'lobby',
    activeSpeakerId: null,
    slotEndsAt: null,
    spokenUserIds: [],
    participants: {
      [hostId]: {
        name: hostName,
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
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
  
  await set(participantRef, {
    name: userName,
    role: 'participant',
    isHandRaised: false
  });
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
  
  return snapshot.val() as Session;
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
    if (!session) return session;
    
    // Validate: nextSpeakerId hasn't already spoken in current round
    if (session.spokenUserIds?.includes(nextSpeakerId)) {
      // Return session unchanged - transaction will abort
      return;
    }
    
    // Set new active speaker
    session.activeSpeakerId = nextSpeakerId;
    session.slotEndsAt = Date.now() + session.slotDurationSeconds * 1000;
    
    // Add to spoken list
    const updatedSpokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId];
    
    // Check if all participants have spoken
    const participantIds = Object.keys(session.participants);
    if (updatedSpokenUserIds.length >= participantIds.length) {
      // Reset for next round
      session.spokenUserIds = [];
    } else {
      session.spokenUserIds = updatedSpokenUserIds;
    }
    
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
  userId: string,
  currentState: boolean
): Promise<void> {
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`);
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
