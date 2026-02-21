# REQ-0031: Firebase Security Rules (Basic)

**Status**: 🟨 Requirements created  
**Priority**: High (Security & Data Protection)  
**Dependencies**: REQ-0002, REQ-0003

---

## Overview

Implement basic Firebase Realtime Database security rules to protect session data while allowing proper read/write access for participants and hosts. The rules must prevent unauthorized access, ensure data integrity, and enforce role-based permissions without compromising the real-time collaborative nature of the application.

This foundational security layer is essential before any production deployment. The rules balance security with usability, preventing malicious actions while supporting the core meeting flow.

---

## Acceptance Criteria

### Authentication Requirements

- [ ] All database operations require authentication (no anonymous public access)
- [ ] Only authenticated users can read or write session data
- [ ] Anonymous authentication sufficient for MVP (Firebase Anonymous Auth)
- [ ] Unauthenticated requests are rejected with permission denied

### Session Read Access

- [ ] Any authenticated user can read a session if they are a participant in that session
- [ ] Users cannot read sessions they haven't joined
- [ ] Session data includes: status, participants, active speaker, timer state, etc.
- [ ] Real-time listeners work correctly with security rules

### Session Write Access

- [ ] Only the session host can modify session-level fields:
  - `status` (lobby → active → finished)
  - `slotDurationSeconds` (immutable after creation)
- [ ] Both host and active speaker can modify speaker-related fields:
  - `activeSpeakerId`
  - `slotEndsAt`
  - `slotStartedAt`
  - `spokenUserIds`
- [ ] Any participant can modify their own participant data:
  - `name` (their own only)
  - `isHandRaised` (their own only)

### Participant Data Protection

- [ ] Users can only update their own participant entry
- [ ] Users cannot modify other participants' data
- [ ] Users cannot change their own `role` field (host vs. participant)
- [ ] Users cannot modify their own `totalSpokeDurationSeconds` or `speakingHistory` directly (only via transaction)

### Session Creation

- [ ] Any authenticated user can create a new session
- [ ] Session creator is automatically set as host
- [ ] Host ID matches authenticated user ID
- [ ] Initial session structure must be valid

### Session Joining

- [ ] Any authenticated user can add themselves as a participant
- [ ] Users cannot add other users to a session
- [ ] New participants are assigned "participant" role (not "host")
- [ ] Participants cannot join a session that doesn't exist

### Data Integrity

- [ ] Required fields cannot be deleted or set to null:
  - `hostId`
  - `slotDurationSeconds`
  - `status`
- [ ] Slot duration cannot be negative or zero
- [ ] Status must be one of: "lobby", "active", "finished"
- [ ] `spokenUserIds` must be an array (not null)

---

## Implementation Details

### Firebase Realtime Database Rules

Create or update `database.rules.json`:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        // Session-level read access: any participant in this session
        ".read": "auth != null && data.child('participants').child(auth.uid).exists()",
        
        // Session-level write access restrictions
        ".write": "auth != null && (
          // Allow session creation (data doesn't exist yet)
          !data.exists() ||
          // Allow updates from host or participants (specific field rules below)
          data.child('participants').child(auth.uid).exists()
        )",
        
        // Session structure validation
        ".validate": "
          newData.hasChildren(['hostId', 'slotDurationSeconds', 'status', 'participants']) &&
          newData.child('slotDurationSeconds').val() > 0 &&
          ['lobby', 'active', 'finished'].indexOf(newData.child('status').val()) >= 0
        ",
        
        // Host ID cannot be changed
        "hostId": {
          ".validate": "
            !data.exists() ||
            newData.val() === data.val()
          "
        },
        
        // Slot duration cannot be changed after creation
        "slotDurationSeconds": {
          ".validate": "
            newData.isNumber() &&
            newData.val() > 0 &&
            (!data.exists() || newData.val() === data.val())
          "
        },
        
        // Status can only be changed by host
        "status": {
          ".validate": "
            newData.isString() &&
            (
              !data.exists() ||
              root.child('sessions/' + $sessionId + '/hostId').val() === auth.uid
            )
          "
        },
        
        // Active speaker fields can be changed by host or current active speaker
        "activeSpeakerId": {
          ".validate": "
            newData.isString() ||
            newData.val() === null ||
            root.child('sessions/' + $sessionId + '/hostId').val() === auth.uid ||
            root.child('sessions/' + $sessionId + '/activeSpeakerId').val() === auth.uid
          "
        },
        
        "slotEndsAt": {
          ".validate": "
            newData.val() === null ||
            (newData.isNumber() && newData.val() > 0)
          "
        },
        
        "slotStartedAt": {
          ".validate": "
            newData.val() === null ||
            (newData.isNumber() && newData.val() > 0)
          "
        },
        
        // SpokenUserIds array can be modified during speaker selection
        "spokenUserIds": {
          ".validate": "newData.val() === null || newData.hasChildren()"
        },
        
        // Participant data
        "participants": {
          "$userId": {
            // Users can read their own participant data if they're in the session
            ".read": "auth != null && auth.uid === $userId",
            
            // Users can write their own participant data when joining or updating
            ".write": "auth != null && (
              // Joining: data doesn't exist yet
              !data.exists() && auth.uid === $userId ||
              // Updating: user is modifying their own data
              auth.uid === $userId ||
              // Host can modify status or kick users (future feature)
              root.child('sessions/' + $sessionId + '/hostId').val() === auth.uid
            )",
            
            // Participant structure validation
            ".validate": "
              newData.hasChildren(['name', 'role', 'isHandRaised']) &&
              newData.child('name').isString() &&
              ['host', 'participant'].indexOf(newData.child('role').val()) >= 0 &&
              newData.child('isHandRaised').isBoolean()
            ",
            
            // Name must be non-empty string
            "name": {
              ".validate": "
                newData.isString() &&
                newData.val().length > 0 &&
                newData.val().length <= 50
              "
            },
            
            // Role cannot be changed by participant (only set at creation)
            "role": {
              ".validate": "
                !data.exists() ||
                newData.val() === data.val() ||
                root.child('sessions/' + $sessionId + '/hostId').val() === auth.uid
              "
            },
            
            // Hand raise can be toggled by participant
            "isHandRaised": {
              ".validate": "newData.isBoolean()"
            },
            
            // Speaking time tracking (read-only for participants, written by transactions)
            "totalSpokeDurationSeconds": {
              ".validate": "
                newData.val() === null ||
                (newData.isNumber() && newData.val() >= 0)
              "
            },
            
            "speakingHistory": {
              ".validate": "newData.val() === null || newData.hasChildren()",
              
              "$historyIndex": {
                ".validate": "
                  newData.hasChildren(['startTime', 'endTime', 'durationSeconds']) &&
                  newData.child('startTime').isNumber() &&
                  newData.child('endTime').isNumber() &&
                  newData.child('durationSeconds').isNumber() &&
                  newData.child('durationSeconds').val() >= 0
                "
              }
            }
          }
        }
      }
    }
  }
}
```

---

### Simplified Rules for MVP (Alternative)

If the detailed rules above are too complex for MVP, use this simplified version:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        // Any authenticated participant can read the session
        ".read": "auth != null && data.child('participants').child(auth.uid).exists()",
        
        // Any authenticated participant can write to session (basic trust model)
        ".write": "auth != null && (
          !data.exists() ||
          data.child('participants').child(auth.uid).exists()
        )",
        
        // Participants can only modify their own participant data
        "participants": {
          "$userId": {
            ".write": "auth != null && (
              auth.uid === $userId ||
              data.parent().parent().child('hostId').val() === auth.uid
            )"
          }
        }
      }
    }
  }
}
```

---

## Deployment Steps

### 1. Create Rules File

Create `database.rules.json` in project root:

```bash
touch database.rules.json
```

Add the security rules (choose detailed or simplified version).

---

### 2. Deploy Rules via Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if not already done)
firebase init database

# Deploy rules
firebase deploy --only database
```

---

### 3. Test Rules in Firebase Console

1. Navigate to Firebase Console → Realtime Database → Rules tab
2. Paste rules into editor
3. Click "Publish" to deploy
4. Use "Rules Playground" to test various access scenarios

---

## Testing Requirements

### Security Rule Tests

Create `database.rules.test.json` for automated rule testing:

```javascript
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

describe('Firebase Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-tick-talk',
      database: {
        rules: fs.readFileSync('database.rules.json', 'utf8')
      }
    });
  });
  
  test('Unauthenticated users cannot read sessions', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().database();
    await assertFails(unauthedDb.ref('sessions/test-session').once('value'));
  });
  
  test('Authenticated users can read sessions they participate in', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').database();
    
    // Set up session with Alice as participant
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.database().ref('sessions/test-session').set({
        hostId: 'alice',
        participants: {
          alice: { name: 'Alice', role: 'host', isHandRaised: false }
        },
        status: 'lobby',
        slotDurationSeconds: 120
      });
    });
    
    await assertSucceeds(aliceDb.ref('sessions/test-session').once('value'));
  });
  
  test('Users cannot read sessions they are not part of', async () => {
    const bobDb = testEnv.authenticatedContext('bob').database();
    await assertFails(bobDb.ref('sessions/test-session').once('value'));
  });
  
  test('Users can only modify their own participant data', async () => {
    const bobDb = testEnv.authenticatedContext('bob').database();
    
    // Bob cannot modify Alice's data
    await assertFails(
      bobDb.ref('sessions/test-session/participants/alice/name').set('Hacked')
    );
    
    // Bob can modify his own data (after joining)
    await assertSucceeds(
      bobDb.ref('sessions/test-session/participants/bob').set({
        name: 'Bob',
        role: 'participant',
        isHandRaised: true
      })
    );
  });
  
  test('Only host can change session status', async () => {
    const hostDb = testEnv.authenticatedContext('alice').database();
    const participantDb = testEnv.authenticatedContext('bob').database();
    
    await assertSucceeds(
      hostDb.ref('sessions/test-session/status').set('active')
    );
    
    await assertFails(
      participantDb.ref('sessions/test-session/status').set('finished')
    );
  });
});
```

---

### Manual Testing Scenarios

- [ ] Create session as authenticated user → Success
- [ ] Join session as authenticated user → Success
- [ ] Read session without authentication → Fail
- [ ] Read session not joined → Fail
- [ ] Modify own participant data → Success
- [ ] Modify another participant's data → Fail
- [ ] Host changes status → Success
- [ ] Non-host changes status → Fail
- [ ] Host selects next speaker → Success
- [ ] Non-host, non-speaker selects speaker → Fail (depends on simplified vs. detailed rules)
- [ ] Active speaker ends their slot → Success

---

## Security Considerations

### Known Limitations (MVP)

- Anonymous auth doesn't prevent determined abuse (users can create unlimited anonymous accounts)
- No rate limiting (Firebase has some built-in limits, but custom rate limiting not implemented)
- No session expiration (old sessions remain in database indefinitely)
- No explicit "kick participant" functionality (host can't remove malicious participants)

### Future Improvements (Post-MVP)

- Add proper authentication (email, Google, GitHub)
- Implement Cloud Functions for complex validations
- Add rate limiting (via Cloud Functions or IP-based)
- Add session expiration (auto-delete after N days)
- Add participant removal (host can kick users)
- Add audit logging (track malicious activity)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `database.rules.json` | Create | Firebase Realtime Database security rules |
| `firebase.json` | Update | Reference database rules file |
| `.firebaserc` | Update | Configure Firebase project |
| `README.md` | Update | Document security rules deployment process |

---

## Success Criteria

At completion:

- Firebase security rules deployed and active
- Unauthenticated access blocked
- Participants can only modify their own data
- Host has appropriate elevated permissions
- Real-time listeners work correctly with rules
- No breaking changes to existing functionality
- Security rules tested and verified
- Documentation updated with deployment instructions

---

## References

- [Firebase Realtime Database Security Rules](https://firebase.google.com/docs/database/security)
- [Firebase Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Plan Section 2: Data Model](/docs/plan.md#data-model)
- [lib/firebase.ts](/lib/firebase.ts)
- [lib/session.ts](/lib/session.ts)
