'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useLocalStorage } from '@/app/hooks/useLocalStorage'
import { useSession } from '@/app/hooks/useSession'
import { joinSession } from '@/lib/session'
import { saveSettings } from '@/lib/storage'

const FIXED_DURATION_VALUES = new Set([60, 75, 90, 105, 120, 135, 150, 165, 180])

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const sessionIdParam = params.sessionId
  const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam

  const { userId, isLoading: authLoading } = useAuth()
  const { settings, hasStoredName, isReady } = useLocalStorage()
  const {
    session,
    isLoading: sessionLoading,
    error: sessionError
  } = useSession(sessionId ?? null)

  const [name, setName] = useState(settings.userName)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const submitButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isReady || authLoading || sessionLoading) {
      return
    }

    if (!sessionId || !session || session.status === 'finished') {
      return
    }

    if (hasStoredName) {
      submitButtonRef.current?.focus()
    } else {
      nameInputRef.current?.focus()
    }
  }, [authLoading, hasStoredName, isReady, session, sessionId, sessionLoading])

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    setError(null)

    if (!trimmedName) {
      setError('Name is required')
      return
    }

    if (!sessionId) {
      setError('Invalid session link.')
      return
    }

    if (!userId) {
      setError('Authentication failed. Please refresh the page.')
      return
    }

    if (!session) {
      setError('Session not found. Please check the link.')
      return
    }

    if (session.status === 'finished') {
      setError('This meeting has ended.')
      return
    }

    try {
      setIsJoining(true)
      await joinSession(sessionId, userId, trimmedName)
      const slotDurationSeconds = session.slotDurationSeconds
      const isCustomDuration = !FIXED_DURATION_VALUES.has(slotDurationSeconds)
      saveSettings(trimmedName, slotDurationSeconds, isCustomDuration)
      router.push(`/meeting/${sessionId}`)
    } catch (joinError) {
      setIsJoining(false)
      setError(joinError instanceof Error ? joinError.message : 'Failed to join session')
    }
  }

  if (authLoading || sessionLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)] sm:p-[var(--spacing-xl)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin mx-auto mb-[var(--spacing-m)]" />
          <p className="text-[14px] text-[var(--color-text-secondary)]">Loading session...</p>
        </div>
      </main>
    )
  }

  if (!sessionId || sessionError || !session) {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)] sm:p-[var(--spacing-xl)] flex items-center justify-center">
        <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))]">
          <h1 className="text-[32px] font-medium leading-[1.3] mb-[var(--spacing-s)]">Session Not Found</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mb-[var(--spacing-l)]">
            The session you are trying to join does not exist or has expired.
          </p>
          <Link
            href="/"
            className="w-full h-11 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] text-white text-[12px] font-medium transition-colors duration-150 ease-out flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            Create a New Session
          </Link>
        </div>
      </main>
    )
  }

  if (session.status === 'finished') {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)] sm:p-[var(--spacing-xl)] flex items-center justify-center">
        <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))]">
          <h1 className="text-[32px] font-medium leading-[1.3] mb-[var(--spacing-s)]">Meeting Ended</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mb-[var(--spacing-l)]">
            This meeting has already ended and is no longer accepting participants.
          </p>
          <Link
            href="/"
            className="w-full h-11 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] text-white text-[12px] font-medium transition-colors duration-150 ease-out flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            Start a New Meeting
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)] sm:p-[var(--spacing-xl)] flex items-center justify-center">
      <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))]">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-[var(--spacing-s)]">Tick-Talk</h1>
        <p className="text-[14px] text-[var(--color-text-secondary)] mb-[var(--spacing-l)]">Join a speaking meeting</p>

        <div className="mb-[var(--spacing-l)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm p-[var(--spacing-m)]">
          <p className="text-[11px] text-[var(--color-text-muted)] mb-[var(--spacing-xs)]">Session ID</p>
          <p className="text-[12px] sm:text-[14px] font-mono break-all text-[var(--color-text-primary)]">{sessionId}</p>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-[var(--spacing-l)]">
          <div>
            <label
              htmlFor="participantName"
              className="block text-[12px] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-s)]"
            >
              Your Name
            </label>
            <input
              id="participantName"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={event => setName(event.target.value)}
              disabled={isJoining}
              required
              ref={nameInputRef}
              className="w-full h-11 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-none text-[14px] text-[var(--color-text-primary)] px-[var(--spacing-m)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
            />
          </div>

          {error && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-error)] p-[var(--spacing-m)] rounded-none">
              <p className="text-[14px] text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !name.trim()}
            ref={submitButtonRef}
            className="w-full h-11 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] text-white text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      </div>
    </main>
  )
}