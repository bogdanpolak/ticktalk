import Link from 'next/link'

export function ErrorView({ error }: { error: string }) {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex items-center justify-center p-[var(--spacing-m)]">
      <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] rounded-lg p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))] border border-[var(--color-error)]">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-4 text-[var(--color-error)]">Error</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
        <Link
          href="/"
          className="block text-center bg-[var(--color-brand)] text-white font-medium py-3 rounded-lg hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
