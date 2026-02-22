'use client'

import { useEffect, useState } from 'react'
import { playTimerExpiredSound } from '@/lib/audio'

interface TimerState {
  remaining: number
  isExpired: boolean
  isActive: boolean
  isOverTime: boolean
  overTimeSeconds: number
  isWarning: boolean
  isCritical: boolean
}

function computeRemaining(slotEndsAt: number | null): number {
  if (slotEndsAt === null) return 0
  return Math.ceil((slotEndsAt - Date.now()) / 1000)
}

export function useTimer(slotEndsAt: number | null, slotDurationSeconds: number): TimerState {
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

    const initial = computeRemaining(slotEndsAt)
    setRemaining(initial)

    if (initial <= 0 && !hasPlayedSound) {
      playTimerExpiredSound()
      setHasPlayedSound(true)
    }

    const intervalId = setInterval(() => {
      const newRemaining = computeRemaining(slotEndsAt)
      setRemaining(newRemaining)

      // Play sound once when timer reaches zero
      if (newRemaining <= 0 && !hasPlayedSound) {
        playTimerExpiredSound()
        setHasPlayedSound(true)
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
  const isOverTime = isActive && remaining < 0
  const overTimeSeconds = isOverTime ? Math.abs(remaining) : 0
  const warningThreshold = Math.ceil(slotDurationSeconds * 0.25)
  const criticalThreshold = Math.max(Math.ceil(slotDurationSeconds * 0.125), 5)
  const isWarning = isActive && remaining > 0 && remaining <= warningThreshold
  const isCritical = isActive && remaining > 0 && remaining <= criticalThreshold

  return {
    remaining,
    isExpired,
    isActive,
    isOverTime,
    overTimeSeconds,
    isWarning,
    isCritical
  }
}
