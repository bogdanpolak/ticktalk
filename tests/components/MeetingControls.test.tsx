import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MeetingControls } from '@/components/MeetingControls'
import { createMockParticipant } from '@/lib/__tests__/mocks'

vi.mock('@/lib/firebase', () => ({ db: {} }))

describe('MeetingControls', () => {
  const participants = {
    'user-1': createMockParticipant({ name: 'Alice' }),
    'user-2': createMockParticipant({ name: 'Bob' })
  }

  function createMockService() {
    return {
      endLastSlot: vi.fn(async () => undefined),
      endMeeting: vi.fn(async () => undefined)
    }
  }

  it('returns null when isVisible is false', () => {
    const { container } = render(
      <MeetingControls
        sessionId="session-1"
        currentUserId="user-1"
        activeSpeakerId="user-1"
        isHost={true}
        isActiveSpeaker={true}
        isLastSpeaker={true}
        isVisible={false}
        hasEligibleCandidates={false}
        participants={participants}
        spokenUserIds={['user-1', 'user-2']}
        sessionService={createMockService()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('"End My Slot" calls endLastSlot and triggers onSlotEnded', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const mockService = createMockService()
    const onSlotEnded = vi.fn()

    render(
      <MeetingControls
        sessionId="session-1"
        currentUserId="user-1"
        activeSpeakerId="user-1"
        isHost={false}
        isActiveSpeaker={true}
        isLastSpeaker={true}
        isVisible={true}
        hasEligibleCandidates={false}
        participants={{ 'user-1': createMockParticipant({ name: 'Alice' }) }}
        spokenUserIds={['user-1']}
        onSlotEnded={onSlotEnded}
        sessionService={mockService}
      />
    )

    await user.click(screen.getByRole('button', { name: /end my slot/i }))

    await waitFor(() => {
      expect(mockService.endLastSlot).toHaveBeenCalledWith('session-1')
      expect(onSlotEnded).toHaveBeenCalledWith('user-1')
    })
  })

  it('"End Meeting" opens dialog when unspoken participants exist', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const mockService = createMockService()

    render(
      <MeetingControls
        sessionId="session-1"
        currentUserId="user-1"
        activeSpeakerId={null}
        isHost={true}
        isActiveSpeaker={false}
        isLastSpeaker={false}
        isVisible={true}
        hasEligibleCandidates={true}
        participants={participants}
        spokenUserIds={['user-1']}
        sessionService={mockService}
      />
    )

    await user.click(screen.getByRole('button', { name: /end meeting/i }))

    await waitFor(() => {
      expect(screen.getByText('End Meeting Early?')).toBeInTheDocument()
    })
  })

  it('"End Meeting" calls endMeeting directly when all have spoken', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const mockService = createMockService()

    render(
      <MeetingControls
        sessionId="session-1"
        currentUserId="user-1"
        activeSpeakerId={null}
        isHost={true}
        isActiveSpeaker={false}
        isLastSpeaker={false}
        isVisible={true}
        hasEligibleCandidates={false}
        participants={participants}
        spokenUserIds={['user-1', 'user-2']}
        sessionService={mockService}
      />
    )

    await user.click(screen.getByRole('button', { name: /end meeting/i }))

    await waitFor(() => {
      expect(mockService.endMeeting).toHaveBeenCalledWith('session-1')
    })
  })
})
