'use client'

interface EndMeetingDialogProps {
  isOpen: boolean
  unspokenCount: number
  onCancel: () => void
  onConfirm: () => void
  isConfirming?: boolean
}

export function EndMeetingDialog({
  isOpen,
  unspokenCount,
  onCancel,
  onConfirm,
  isConfirming = false
}: EndMeetingDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface)]/80 p-[var(--spacing-l)]">
      <div className="w-full max-w-md bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[12px] p-[var(--spacing-l)]">
        <h2 className="text-[18px] font-medium leading-[1.4] text-[var(--color-text-primary)]">
          End Meeting Early?
        </h2>
        <p className="mt-[var(--spacing-s)] text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
          {unspokenCount} participant{unspokenCount === 1 ? '' : 's'} haven&apos;t spoken yet. End meeting anyway?
        </p>

        <div className="mt-[var(--spacing-l)] flex flex-col gap-[var(--spacing-s)] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-[var(--spacing-m)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-surface-subtle)] active:bg-[var(--color-surface-subtle)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="h-11 px-[var(--spacing-m)] bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
          >
            {isConfirming ? 'Ending...' : 'End Meeting'}
          </button>
        </div>
      </div>
    </div>
  )
}
