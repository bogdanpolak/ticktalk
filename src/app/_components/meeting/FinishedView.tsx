'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MeetingSummary } from '@/components/MeetingSummary'
import type { Session } from '@/lib/session'

export function FinishedView({
  session,
  userId
}: {
  session: Session
  userId: string | null
}) {
  const participants = Object.entries(session.participants)
  const isHost = userId === session.hostId
  const [showSummary, setShowSummary] = useState(true)

  if (showSummary) {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)]">
        <div className="max-w-2xl mx-auto">
          <MeetingSummary session={session} />

          <div className="mt-[var(--spacing-l)] flex flex-col sm:flex-row gap-[var(--spacing-s)] sm:items-center sm:justify-between">
            {isHost && (
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="h-11 px-[var(--spacing-m)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-surface-subtle)] active:bg-[var(--color-surface-subtle)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
              >
                Close Summary
              </button>
            )}

            <Link
              href="/"
              className="h-11 px-[var(--spacing-m)] inline-flex items-center justify-center bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              Start a New Meeting
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)] flex items-center justify-center">
      <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] rounded-lg p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))] border border-[var(--color-border)]">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-4">Meeting Ended</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Thanks for participating! Here&apos;s who joined:
        </p>
        <ul className="space-y-2 mb-8">
          {participants.map(([id, participant]) => (
            <li key={id} className="py-2 px-3 rounded bg-[var(--color-surface)]">
              {participant.name}
              {participant.role === 'host' && ' (Host)'}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-[var(--spacing-s)]">
          {isHost && (
            <button
              type="button"
              onClick={() => setShowSummary(true)}
              className="h-11 px-[var(--spacing-m)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-surface-subtle)] active:bg-[var(--color-surface-subtle)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              View Summary
            </button>
          )}
          <Link
            href="/"
            className="h-11 px-[var(--spacing-m)] inline-flex items-center justify-center bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
          >
            Start a New Meeting
          </Link>
        </div>
      </div>
    </main>
  )
}
