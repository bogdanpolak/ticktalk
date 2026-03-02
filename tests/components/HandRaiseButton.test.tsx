import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HandRaiseButton } from '@/components/HandRaiseButton'

vi.mock('@/lib/firebase', () => ({ db: {} }))

describe('HandRaiseButton', () => {
  function createMockService() {
    return {
      toggleHandRaise: vi.fn(async () => undefined)
    }
  }

  it('returns null when user is active speaker', () => {
    const { container } = render(
      <HandRaiseButton
        sessionId="session-1"
        currentUserId="user-1"
        isActiveSpeaker={true}
        isHandRaised={false}
        sessionService={createMockService()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows correct label based on isHandRaised', () => {
    const mockService = createMockService()

    const { rerender } = render(
      <HandRaiseButton
        sessionId="session-1"
        currentUserId="user-1"
        isActiveSpeaker={false}
        isHandRaised={false}
        sessionService={mockService}
      />
    )

    expect(screen.getByRole('button', { name: /raise hand/i })).toBeInTheDocument()

    rerender(
      <HandRaiseButton
        sessionId="session-1"
        currentUserId="user-1"
        isActiveSpeaker={false}
        isHandRaised={true}
        sessionService={mockService}
      />
    )

    expect(screen.getByRole('button', { name: /lower hand/i })).toBeInTheDocument()
  })

  it('calls toggleHandRaise on click', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const mockService = createMockService()

    render(
      <HandRaiseButton
        sessionId="session-1"
        currentUserId="user-1"
        isActiveSpeaker={false}
        isHandRaised={false}
        sessionService={mockService}
      />
    )

    await user.click(screen.getByRole('button', { name: /raise hand/i }))

    await waitFor(() => {
      expect(mockService.toggleHandRaise).toHaveBeenCalledWith('session-1', 'user-1')
    })
  })
})
