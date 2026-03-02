import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SpeakerSelector } from '@/components/SpeakerSelector'
import { createMockParticipant } from '@/lib/__tests__/mocks'

vi.mock('@/lib/firebase', () => ({ db: {} }))

describe('SpeakerSelector', () => {
  const participants = {
    'user-1': createMockParticipant({ name: 'Alice' }),
    'user-2': createMockParticipant({ name: 'Bob' }),
    'user-3': createMockParticipant({ name: 'Charlie' })
  }

  it('returns null when user cannot select', () => {
    const { container } = render(
      <SpeakerSelector
        sessionId="session-1"
        participants={participants}
        spokenUserIds={[]}
        currentUserId="user-1"
        activeSpeakerId="user-2"
        isHost={false}
        sessionService={{ selectNextSpeaker: vi.fn() }}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders eligible candidates (excludes spoken users)', () => {
    render(
      <SpeakerSelector
        sessionId="session-1"
        participants={participants}
        spokenUserIds={['user-1']}
        currentUserId="user-1"
        activeSpeakerId="user-1"
        isHost={false}
        sessionService={{ selectNextSpeaker: vi.fn() }}
      />
    )

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.getByText('2 participants remaining')).toBeInTheDocument()
  })

  it('calls selectNextSpeaker on candidate click', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const mockService = {
      selectNextSpeaker: vi.fn(async () => undefined)
    }

    render(
      <SpeakerSelector
        sessionId="session-1"
        participants={participants}
        spokenUserIds={['user-1']}
        currentUserId="user-1"
        activeSpeakerId="user-1"
        isHost={false}
        sessionService={mockService}
      />
    )

    await user.click(screen.getByText('Bob').closest('button')!)

    await waitFor(() => {
      expect(mockService.selectNextSpeaker).toHaveBeenCalledWith('session-1', 'user-2')
    })
  })

  it('shows error on selection failure', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const mockService = {
      selectNextSpeaker: vi.fn(async () => {
        throw new Error('Network error')
      })
    }

    render(
      <SpeakerSelector
        sessionId="session-1"
        participants={participants}
        spokenUserIds={['user-1']}
        currentUserId="user-1"
        activeSpeakerId="user-1"
        isHost={false}
        sessionService={mockService}
      />
    )

    await user.click(screen.getByText('Bob').closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows "All participants have spoken" when no eligible candidates', () => {
    render(
      <SpeakerSelector
        sessionId="session-1"
        participants={participants}
        spokenUserIds={['user-1', 'user-2', 'user-3']}
        currentUserId="user-1"
        activeSpeakerId="user-1"
        isHost={false}
        sessionService={{ selectNextSpeaker: vi.fn() }}
      />
    )

    expect(screen.getByText('All participants have spoken.')).toBeInTheDocument()
  })
})
