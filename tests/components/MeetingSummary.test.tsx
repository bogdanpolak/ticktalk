import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MeetingSummary } from '@/components/MeetingSummary'
import { createMockSession, createMockParticipant } from '@/lib/__tests__/mocks'

describe('MeetingSummary', () => {
  it('renders "Meeting Summary" heading and participant count', () => {
    const session = createMockSession({
      participants: {
        'user-1': createMockParticipant({ name: 'Alice' }),
        'user-2': createMockParticipant({ name: 'Bob' }),
      },
    })
    render(<MeetingSummary session={session} />)
    expect(screen.getByText('Meeting Summary')).toBeInTheDocument()
    expect(screen.getByText('2 participants')).toBeInTheDocument()
  })

  it('renders participant names and total time', () => {
    const session = createMockSession({
      slotDurationSeconds: 120,
      participants: {
        'user-1': createMockParticipant({
          name: 'Alice',
          totalSpokeDurationSeconds: 45,
          speakingHistory: [{ startTime: 0, endTime: 45000, durationSeconds: 45 }],
        }),
      },
    })
    render(<MeetingSummary session={session} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getAllByText('0:45').length).toBeGreaterThanOrEqual(1)
  })

  it('shows overtime indicator when speaking history entry exceeds slotDurationSeconds', () => {
    const session = createMockSession({
      slotDurationSeconds: 60,
      participants: {
        'user-1': createMockParticipant({
          name: 'Alice',
          totalSpokeDurationSeconds: 90,
          speakingHistory: [{ startTime: 0, endTime: 90000, durationSeconds: 90 }],
        }),
      },
    })
    render(<MeetingSummary session={session} />)
    expect(screen.getAllByText('Overtime').length).toBeGreaterThanOrEqual(1)
  })
})
