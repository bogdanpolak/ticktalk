'use client'

import { useEffect, useState } from 'react'
import { playTimerExpiredSound } from '@/lib/audio'

interface TimerState {
  remaining: number
  isExpired: boolean
  isActive: boolean
}

function computeRemaining(slotEndsAt: number | null): number {
  if (slotEndsAt === null) return 0
  return Math.max(0, Math.ceil((slotEndsAt - Date.now()) / 1000))
}

export function useTimer(slotEndsAt: number | null): TimerState {
  const [remaining, setRemaining] = useState<number>(() =>
    computeRemaining(slotEndsAt)
  )
  const [hasPlayedSound, setHasPlayedSound] = useState(false)

  useEffect(() => {
    // If no active timer, interval not needed
    if (slotEndsAt === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasPlayedSound(false)
      return
    }

    // If already expired, no need to tick
    const initial = computeRemaining(slotEndsAt)
    if (initial <= 0) {
      setRemaining(0)
      if (!hasPlayedSound) {
        playTimerExpiredSound()
        setHasPlayedSound(true)
      }
      return
    }

    const intervalId = setInterval(() => {
      const newRemaining = computeRemaining(slotEndsAt)
      setRemaining(newRemaining)

      // Play sound once when timer reaches zero
      if (newRemaining <= 0 && !hasPlayedSound) {
        playTimerExpiredSound()
        setHasPlayedSound(true)
        clearInterval(intervalId)
      }

      // Stop ticking once expired
      if (newRemaining <= 0) {
        clearInterval(intervalId)
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [slotEndsAt, hasPlayedSound])

  // Sync remaining with slotEndsAt changes outside of effect
  useEffect(() => {
    const newRemaining = computeRemaining(slotEndsAt)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(newRemaining)
    // Reset sound flag when timer restarts
    if (newRemaining > 0) {
      setHasPlayedSound(false)
    }
  }, [slotEndsAt])

  const isActive = slotEndsAt !== null
  const isExpired = isActive && remaining <= 0

  return { remaining, isExpired, isActive }
}
