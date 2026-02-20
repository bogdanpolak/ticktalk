'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    // If no active timer, interval not needed
    if (slotEndsAt === null) {
      return
    }

    // If already expired, no need to tick
    const initial = computeRemaining(slotEndsAt)
    if (initial <= 0) return

    const intervalId = setInterval(() => {
      const newRemaining = computeRemaining(slotEndsAt)
      setRemaining(newRemaining)

      // Stop ticking once expired
      if (newRemaining <= 0) {
        clearInterval(intervalId)
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [slotEndsAt])

  // Sync remaining with slotEndsAt changes outside of effect
  useEffect(() => {
    setRemaining(computeRemaining(slotEndsAt))
  }, [slotEndsAt])

  const isActive = slotEndsAt !== null
  const isExpired = isActive && remaining <= 0

  return { remaining, isExpired, isActive }
}
