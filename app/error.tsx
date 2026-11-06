'use client'

export default function Error({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Can&apos;t load this page</h1>
      <p className="mt-2 text-lg text-body">Check that the API is running on port 8082, then try again.</p>
      <button
        onClick={() => unstable_retry()}
        className="mt-6 rounded-xl bg-accent px-6 py-3 text-base font-medium text-white hover:bg-accent-strong"
      >
        Try again
      </button>
    </div>
  )
}
