import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActiveSpeaker } from '@/components/ActiveSpeaker'

describe('ActiveSpeaker', () => {
  it('renders "No active speaker" when activeSpeakerId is null', () => {
    render(<ActiveSpeaker activeSpeakerId={null} activeSpeakerName={null} currentUserId="user-1" />)
    expect(screen.getByText('No active speaker')).toBeInTheDocument()
  })

  it('renders speaker name and "Currently Speaking" when speaker is active', () => {
    render(<ActiveSpeaker activeSpeakerId="user-1" activeSpeakerName="Alice" currentUserId="user-2" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Currently Speaking')).toBeInTheDocument()
  })

  it('renders fallback "Waiting for speaker" when activeSpeakerName is null', () => {
    render(<ActiveSpeaker activeSpeakerId="user-1" activeSpeakerName={null} currentUserId="user-2" />)
    expect(screen.getByText('Waiting for speaker')).toBeInTheDocument()
  })
})
