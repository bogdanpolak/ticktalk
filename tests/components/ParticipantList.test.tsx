import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ParticipantList } from '@/components/ParticipantList'
import { createMockParticipant } from '@/lib/__tests__/mocks'

describe('ParticipantList', () => {
  it('renders participant count header "Participants (N)"', () => {
    const participants = {
      'user-1': createMockParticipant({ name: 'Alice' }),
      'user-2': createMockParticipant({ name: 'Bob' }),
    }
    render(
      <ParticipantList
        participants={participants}
        activeSpeakerId={null}
        spokenUserIds={[]}
        hostId="user-1"
      />
    )
    expect(screen.getByText('Participants (2)')).toBeInTheDocument()
  })

  it('shows "🎤 Speaking" badge for the active speaker', () => {
    const participants = {
      'user-1': createMockParticipant({ name: 'Alice' }),
    }
    render(
      <ParticipantList
        participants={participants}
        activeSpeakerId="user-1"
        spokenUserIds={[]}
        hostId="user-1"
      />
    )
    expect(screen.getByText('🎤 Speaking')).toBeInTheDocument()
  })

  it('shows "✋ Hand raised" badge for hand-raised participant', () => {
    const participants = {
      'user-1': createMockParticipant({ name: 'Alice', isHandRaised: true }),
    }
    render(
      <ParticipantList
        participants={participants}
        activeSpeakerId={null}
        spokenUserIds={[]}
        hostId="host-1"
      />
    )
    expect(screen.getByText('✋ Hand raised')).toBeInTheDocument()
  })

  it('shows "✅ Spoke" badge for participants who have spoken', () => {
    const participants = {
      'user-1': createMockParticipant({ name: 'Alice' }),
    }
    render(
      <ParticipantList
        participants={participants}
        activeSpeakerId={null}
        spokenUserIds={['user-1']}
        hostId="host-1"
      />
    )
    expect(screen.getByText('✅ Spoke')).toBeInTheDocument()
  })

  it('shows "No participants yet." for empty participants object', () => {
    render(
      <ParticipantList
        participants={{}}
        activeSpeakerId={null}
        spokenUserIds={[]}
        hostId="host-1"
      />
    )
    expect(screen.getByText('No participants yet.')).toBeInTheDocument()
  })
})
