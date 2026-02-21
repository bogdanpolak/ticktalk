'use client'

import { useState } from 'react'
import { toggleHandRaise } from '@/lib/session'

interface HandRaiseButtonProps {
  sessionId: string
  currentUserId: string | null
  isActiveSpeaker: boolean
  isHandRaised: boolean
}

export function HandRaiseButton({
  sessionId,
  currentUserId,
  isActiveSpeaker,
  isHandRaised
}: HandRaiseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hide button if user is active speaker or not logged in
  if (isActiveSpeaker || !currentUserId) {
    return null
  }

  const handleToggle = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await toggleHandRaise(sessionId, currentUserId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle hand raise')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-[var(--spacing-s)]">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={[
          'w-full min-h-11 px-[var(--spacing-m)] py-[var(--spacing-s)] text-[12px] font-medium rounded-[0px] transition-colors duration-150 ease-out',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isHandRaised
            ? 'bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]'
            : 'bg-[var(--color-brand)] text-[var(--color-surface)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]'
        ].join(' ')}
      >
        {isLoading ? 'Processing...' : isHandRaised ? 'Lower Hand' : 'Raise Hand'}
      </button>
      
      {error && (
        <p className="text-[12px] leading-[1.4] text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  )
}
