# REQ-0019: Timer Expired Indicator + Sound Notification

**Status**: 🟨 Requirements Created  
**Priority**: High (MVP UX & Accessibility)  
**Dependencies**: REQ-0009, REQ-0010

---

## Overview

Enhance the timer component to provide clear visual and audio feedback when a speaker's slot time expires.

When the countdown reaches zero, the timer displays a prominent "Time Expired" message and plays an optional sound notification. The speaker remains active—no automatic advancement. The speaker must manually end their slot via "End My Slot" button.

This design maintains speaker autonomy while giving clear, multi-sensory feedback that time has run out.

---

## Acceptance Criteria

### Visual Indicator

- [ ] Timer shows "Time Expired" text when `remaining <= 0`
- [ ] "Time Expired" uses distinct visual styling (large font, high contrast)
- [ ] Timer background transitions to bright red (`bg-red-600` or similar)
- [ ] Timer text color provides high contrast (white/light text on red)
- [ ] Blinking or pulsing animation on expired state (optional, but enhances urgency)
- [ ] "Time Expired" state persists until speaker manually ends slot
- [ ] Mobile layout accommodates "Time Expired" text without truncation
- [ ] Design system colors used (no hardcoded colors outside palette)

### Sound Notification

- [ ] Sound plays once when timer first reaches zero (not on every render)
- [ ] Sound is a short, pleasant notification tone (0.5–1 second duration)
- [ ] Sound volume is reasonable (not jarring, but clearly audible)
- [ ] Browser plays sound without requiring user interaction (autoplay policy permitting)
- [ ] Graceful fallback if sound file fails to load
- [ ] Fallback: show visual indicator even if audio doesn't play
- [ ] Sound does NOT loop or repeat while expired
- [ ] Option to mute sound via browser permissions respected

### Integration with Timer Component

- [ ] `useTimer` hook detects expiry: `remaining <= 0`
- [ ] `Timer` component receives expiry state and renders accordingly
- [ ] Sound plays via HTML5 `<audio>` element or Web Audio API
- [ ] Sound file location: `public/sounds/timer-expired.mp3` (or similar)
- [ ] Sound loading is non-blocking (doesn't delay component render)

### User Experience

- [ ] Speaker clearly understands time has run out
- [ ] Speaker knows they must manually end slot to continue
- [ ] Other participants see "Time Expired" indicator in real-time
- [ ] Host is aware speaker has exceeded time (for potential intervention)
- [ ] No confusion between yellow/red warning states and expired state

---

## Implementation Details

### Timer Component (`components/Timer.tsx`)

Extend component to render expired state:

```tsx
interface TimerProps {
  remaining: number
  duration: number
  isActive: boolean
}

export function Timer({ remaining, duration, isActive }: TimerProps) {
  const isExpired = remaining <= 0
  const isWarningRed = remaining > 0 && remaining <= 5
  const isWarningYellow = remaining > 5 && remaining <= 15
  
  // Determine styling
  const backgroundColor = isExpired
    ? 'bg-red-600'
    : isWarningRed
      ? 'bg-red-500'
      : isWarningYellow
        ? 'bg-yellow-400'
        : 'bg-blue-500'
  
  const textColor = isExpired ? 'text-white' : 'text-gray-900'
  
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center rounded-lg p-6
        text-center transition-all duration-300
        ${backgroundColor} ${textColor}
        ${isExpired ? 'animate-pulse' : ''}
      `}
    >
      {isExpired ? (
        <>
          <div className="text-sm font-semibold uppercase tracking-wide">
            Time Expired
          </div>
          <div className="mt-2 text-xs text-gray-100">
            Please end your slot to continue
          </div>
        </>
      ) : (
        <>
          <div className="text-xs uppercase tracking-widest opacity-75">
            Time Remaining
          </div>
          <div className="mt-2 text-5xl font-bold tabular-nums">
            {formatTime(remaining)}
          </div>
        </>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}
```

---

### Sound Notification

Create `public/sounds/timer-expired.mp3`:

- **Duration**: 0.5–1 second
- **Format**: MP3 (cross-browser compatibility)
- **Frequency**: Single short tone or pleasant chime
- **Volume**: -20dB normalized (reasonable loudness without being jarring)

Recommendation: Use a simple "ding" or bell sound. Can source from:
- Freesound.org (creative commons)
- Notification sound libraries
- Generate via Audacity or similar

---

### Sound Playback Logic

Create `lib/audio.ts`:

```ts
let audioInstance: HTMLAudioElement | null = null

export function playTimerExpiredSound(): void {
  try {
    // Reuse audio instance to prevent multiple overlapping sounds
    if (!audioInstance) {
      audioInstance = new Audio('/sounds/timer-expired.mp3')
      audioInstance.volume = 0.7 // 70% volume
    }
    
    // Reset and play
    audioInstance.currentTime = 0
    audioInstance.play().catch((err) => {
      console.warn('Failed to play timer expired sound:', err)
      // Fallback: show visual indicator (already rendered)
    })
  } catch (error) {
    console.warn('Audio initialization failed:', error)
    // Fallback: visual indicator is still displayed
  }
}

export function stopTimerExpiredSound(): void {
  if (audioInstance) {
    audioInstance.pause()
    audioInstance.currentTime = 0
  }
}
```

---

### useTimer Hook (`hooks/useTimer.ts`)

Update hook to track expiry state and trigger sound:

```ts
interface UseTimerReturn {
  remaining: number
  isExpired: boolean
}

export function useTimer(
  slotEndsAt: number | null,
  enabled: boolean = true
): UseTimerReturn {
  const [remaining, setRemaining] = useState<number>(0)
  const [hasPlayedSound, setHasPlayedSound] = useState(false)
  
  useEffect(() => {
    if (!enabled || !slotEndsAt) {
      setHasPlayedSound(false)
      return
    }
    
    const tick = () => {
      const now = Date.now()
      const delta = Math.max(0, Math.ceil((slotEndsAt - now) / 1000))
      setRemaining(delta)
      
      // Play sound once on first expiry
      if (delta <= 0 && !hasPlayedSound) {
        playTimerExpiredSound()
        setHasPlayedSound(true)
      }
    }
    
    // Initial tick
    tick()
    
    // Set interval for subsequent ticks
    const intervalId = setInterval(tick, 1000)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [slotEndsAt, enabled, hasPlayedSound])
  
  const isExpired = remaining <= 0
  
  return { remaining, isExpired }
}
```

---

### Timer Component Integration

Update `components/Timer.tsx` to use `useTimer`:

```tsx
import { useTimer } from '@/hooks/useTimer'

interface TimerProps {
  slotEndsAt: number | null
  isActive: boolean
}

export function Timer({ slotEndsAt, isActive }: TimerProps) {
  const { remaining, isExpired } = useTimer(slotEndsAt, isActive)
  
  // ... rendering using isExpired and remaining
}
```

---

### Meeting Page Integration

Pass `slotEndsAt` to `Timer` component:

```tsx
// In app/meeting/[sessionId]/page.tsx
<Timer
  slotEndsAt={session?.slotEndsAt || null}
  isActive={session?.status === 'active' && session?.activeSpeakerId !== null}
/>
```

---

### Styling with Design System

Use Tailwind classes consistent with existing design:

```tsx
// Expired state
className="bg-red-600 text-white animate-pulse"

// Red warning (< 5s)
className="bg-red-500 text-white"

// Yellow warning (5-15s)
className="bg-yellow-400 text-gray-900"

// Normal state
className="bg-blue-500 text-gray-900"
```

---

## Audio Fallback Strategy

1. **Primary**: Try to play sound via `HTMLAudioElement`
2. **Fallback 1**: If sound fails, visual indicator remains (already rendered)
3. **Fallback 2**: If audio file 404, warn in console but don't break UI
4. **Fallback 3**: Rely on visual + potential haptic feedback (future)

---

## Accessibility Considerations

- **Visual**: High contrast red background + white text (WCAG AAA compliant)
- **Audio**: Sound is supplementary; visual indicator is primary
- **Motion**: Pulsing animation is subtle but can be disabled via `prefers-reduced-motion`
- **Text**: "Time Expired" text is large and clear (not icon-only)

Add to `components/Timer.tsx`:

```tsx
className={`
  ${isExpired ? 'animate-pulse' : ''}
  motion-safe:animate-pulse // Respects user motion preferences
`}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/Timer.tsx` | Modify | Add expired state rendering and styling |
| `hooks/useTimer.ts` | Modify | Add expiry detection and sound trigger logic |
| `lib/audio.ts` | Create | Audio playback management functions |
| `public/sounds/timer-expired.mp3` | Create | Sound notification file |
| `app/meeting/[sessionId]/page.tsx` | Verify | Ensure `slotEndsAt` passed to `Timer` |

---

## Testing Notes

- Verify timer displays "Time Expired" when countdown reaches zero
- Verify sound plays exactly once when timer expires
- Verify sound doesn't play on every re-render after expiry
- Verify visual state persists until speaker ends slot
- Verify other participants see "Time Expired" in real-time
- Verify mobile layout displays "Time Expired" without truncation
- Verify sound gracefully fails without breaking UI
- Verify animation respects `prefers-reduced-motion` preference
- Test audio in different browsers (Chrome, Safari, Firefox)
- Verify high contrast ratio for red background and white text (WCAG AAA)

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome/Edge | ✅ Supported | HTML5 Audio + Web Audio API |
| Firefox | ✅ Supported | HTML5 Audio |
| Safari | ✅ Supported | HTML5 Audio (iOS 14.5+) |
| iOS Safari | ⚠️ Limited | May require user gesture first |

---

## Notes for Implementation

1. **Sound reuse**: Use single `HTMLAudioElement` instance to prevent sonic overlaps
2. **Volume normalization**: Set to 70% to be audible but not startling
3. **File format**: MP3 for maximum browser compatibility
4. **Preload optional**: Don't preload sound on page load to reduce bundle
5. **Looping disabled**: Ensure sound plays once, not repeated
6. **Accessibility first**: Visual indicator is primary, sound is enhancement
7. **Graceful degradation**: If audio API unavailable, UI still functions fully
