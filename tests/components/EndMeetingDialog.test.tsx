import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EndMeetingDialog } from '@/components/EndMeetingDialog'

describe('EndMeetingDialog', () => {
  it('returns nothing when isOpen is false', () => {
    const { container } = render(
      <EndMeetingDialog
        isOpen={false}
        unspokenCount={3}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows dialog content when isOpen is true', () => {
    render(
      <EndMeetingDialog
        isOpen={true}
        unspokenCount={3}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByText('End Meeting Early?')).toBeInTheDocument()
    expect(screen.getByText(/3 participants haven't spoken yet/)).toBeInTheDocument()
  })

  it('calls onCancel and onConfirm on button clicks', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <EndMeetingDialog
        isOpen={true}
        unspokenCount={2}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: /end meeting/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
