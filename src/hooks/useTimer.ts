'use client'

import { useEffect, useState } from 'react'
import { computeTimerState } from '@/lib/sessionLogic'
import { audioService as defaultAudioService, type AudioService } from '@/lib/services/audioService'
import { timeService as defaultTimeService, type TimeService } from '@/lib/services/timeService'

interface TimerState {
  remaining: number
  isExpired: boolean
  isActive: boolean
  isOverTime: boolean
  overTimeSeconds: number
  isWarning: boolean
  isCritical: boolean
}

interface UseTimerOptions {
  audioService?: AudioService
  timeService?: TimeService
}

export function useTimer(
  slotEndsAt: number | null,
  slotDurationSeconds: number,
  options: UseTimerOptions = {}
): TimerState {
  const audioService = options.audioService ?? defaultAudioService
  const timeService = options.timeService ?? defaultTimeService

  const [remaining, setRemaining] = useState<number>(() =>
    timeService.computeRemainingSeconds(slotEndsAt)
  )
  const [hasPlayedSound, setHasPlayedSound] = useState(false)

  useEffect(() => {
    // If no active timer, interval not needed
    if (slotEndsAt === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasPlayedSound(false)
      return
    }

    const initial = timeService.computeRemainingSeconds(slotEndsAt)
    setRemaining(initial)

    if (initial <= 0 && !hasPlayedSound) {
      audioService.playTimerExpiredSound()
      setHasPlayedSound(true)
    }

    const intervalId = timeService.setInterval(() => {
      const newRemaining = timeService.computeRemainingSeconds(slotEndsAt)
      setRemaining(newRemaining)

      // Play sound once when timer reaches zero
      if (newRemaining <= 0 && !hasPlayedSound) {
        audioService.playTimerExpiredSound()
        setHasPlayedSound(true)
      }
    }, 1000)

    return () => {
      timeService.clearInterval(intervalId)
    }
  }, [slotEndsAt, hasPlayedSound, audioService, timeService])

  // Sync remaining with slotEndsAt changes outside of effect
  useEffect(() => {
    const newRemaining = timeService.computeRemainingSeconds(slotEndsAt)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(newRemaining)
    // Reset sound flag when timer restarts
    if (newRemaining > 0) {
      setHasPlayedSound(false)
    }
  }, [slotEndsAt, timeService])

  const isActive = slotEndsAt !== null
  const timerState = computeTimerState(remaining, slotDurationSeconds)
  const isExpired = isActive && timerState.isExpired
  const isOverTime = isActive && timerState.isOvertime
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
