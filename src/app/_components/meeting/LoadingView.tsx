export function LoadingView() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex items-center justify-center p-[var(--spacing-m)]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Loading meeting...</p>
      </div>
    </main>
  )
}
