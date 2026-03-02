import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockUseTimer = vi.fn()
vi.mock('@/hooks/useTimer', () => ({
  useTimer: (...args: unknown[]) => mockUseTimer(...args),
}))

import { Timer } from '@/components/Timer'

describe('Timer', () => {
  it('shows idle display when slotEndsAt is null', () => {
    mockUseTimer.mockReturnValue({
      remaining: 0,
      isExpired: false,
      isOverTime: false,
      overTimeSeconds: 0,
      isWarning: false,
      isCritical: false,
    })
    render(<Timer slotEndsAt={null} slotDurationSeconds={120} />)
    expect(screen.getByText('—:——')).toBeInTheDocument()
    expect(screen.getByText('2 min per speaker')).toBeInTheDocument()
  })

  it('shows countdown in normal state', () => {
    mockUseTimer.mockReturnValue({
      remaining: 90,
      isExpired: false,
      isOverTime: false,
      overTimeSeconds: 0,
      isWarning: false,
      isCritical: false,
    })
    render(<Timer slotEndsAt={Date.now() + 90000} slotDurationSeconds={120} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('shows expired message when timer expires', () => {
    mockUseTimer.mockReturnValue({
      remaining: 0,
      isExpired: true,
      isOverTime: false,
      overTimeSeconds: 0,
      isWarning: false,
      isCritical: false,
    })
    render(<Timer slotEndsAt={Date.now()} slotDurationSeconds={120} />)
    expect(screen.getByText(/Time Expired/)).toBeInTheDocument()
  })

  it('shows overtime format when in overtime', () => {
    mockUseTimer.mockReturnValue({
      remaining: -15,
      isExpired: true,
      isOverTime: true,
      overTimeSeconds: 15,
      isWarning: false,
      isCritical: false,
    })
    render(<Timer slotEndsAt={Date.now() - 15000} slotDurationSeconds={120} />)
    expect(screen.getByText('+0:15')).toBeInTheDocument()
  })
})
