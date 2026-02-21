'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { createSession } from '@/lib/session'

const DURATION_OPTIONS = [
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 }
]

export default function HomePage() {
  const router = useRouter()
  const { userId, isLoading: authLoading } = useAuth()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState(120) // Default: 2 minutes
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!userId) {
      setError('Authentication failed. Please refresh the page.')
      return
    }

    try {
      setIsCreating(true)
      const sessionId = await createSession({
        hostId: userId,
        hostName: name,
        slotDurationSeconds: duration
      })

      // Redirect to meeting page
      router.push(`/meeting/${sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setIsCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-surface)'
      }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Initializing...</p>
      </div>
    )
  }

  return (
    <main style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-surface)',
      padding: 'var(--spacing-m)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--color-surface-elevated)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)',
        padding: 'clamp(var(--spacing-l), 5vw, var(--spacing-xl))'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-s)',
          marginTop: 0
        }}>
          Tick-Talk
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-l)',
          marginTop: 0
        }}>
          Start a speaking meeting
        </p>

        <form onSubmit={handleCreateSession} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-l)'
        }}>
          {/* Name Input */}
          <div>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-s)'
            }}>
              Your Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isCreating}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px var(--spacing-m)',
                height: '44px',
                border: `1px solid var(--color-border)`,
                borderRadius: '0px',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                opacity: isCreating ? 0.5 : 1,
                cursor: isCreating ? 'not-allowed' : 'text',
                transition: 'all 150ms ease-out'
              }}
              onFocus={(e) => {
                e.target.style.outline = '2px solid var(--color-focus-ring)'
                e.target.style.outlineOffset = '0px'
              }}
              onBlur={(e) => {
                e.target.style.outline = 'none'
              }}
              required
            />
          </div>

          {/* Duration Selector */}
          <div>
            <label htmlFor="duration" style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-s)'
            }}>
              Speaking Time Per Person
            </label>
            <select
              id="duration"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              disabled={isCreating}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px var(--spacing-m)',
                height: '44px',
                border: `1px solid var(--color-border)`,
                borderRadius: '0px',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                opacity: isCreating ? 0.5 : 1,
                cursor: isCreating ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease-out'
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--color-focus-ring)'
                e.currentTarget.style.outlineOffset = '0px'
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none'
              }}
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid var(--color-error)`,
              borderRadius: '0px',
              padding: 'var(--spacing-m)'
            }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-error)',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            style={{
              width: '100%',
              background: isCreating || !name.trim() 
                ? 'rgba(91, 141, 239, 0.5)'
                : 'var(--color-brand)',
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '12px',
              padding: '0 var(--spacing-m)',
              height: '44px',
              border: 'none',
              borderRadius: '0px',
              cursor: isCreating || !name.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease-out',
              fontFamily: 'var(--font-sans)'
            }}
            onMouseEnter={(e) => {
              if (!isCreating && name.trim()) {
                e.currentTarget.style.background = 'var(--color-brand-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isCreating && name.trim()) {
                e.currentTarget.style.background = 'var(--color-brand)'
              }
            }}
            onMouseDown={(e) => {
              if (!isCreating && name.trim()) {
                e.currentTarget.style.background = 'var(--color-brand-active)'
              }
            }}
            onMouseUp={(e) => {
              if (!isCreating && name.trim()) {
                e.currentTarget.style.background = 'var(--color-brand-hover)'
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid var(--color-focus-ring)'
              e.currentTarget.style.outlineOffset = '0px'
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none'
              if (!isCreating && name.trim()) {
                e.currentTarget.style.background = 'var(--color-brand)'
              }
            }}
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </button>
        </form>

        {/* Info */}
        <div style={{
          marginTop: 'var(--spacing-xl)',
          paddingTop: 'var(--spacing-xl)',
          borderTop: `1px solid var(--color-border)`,
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            margin: 0
          }}>
            You&apos;ll receive a link to share with participants after creation.
          </p>
        </div>
      </div>
    </main>
  )
}
