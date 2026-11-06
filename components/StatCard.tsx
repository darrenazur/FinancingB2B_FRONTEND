interface StatCardProps {
  label: string
  value: string
  hint?: string
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-7">
      <p className="text-base font-medium text-body">{label}</p>
      <p className="mt-3 whitespace-nowrap text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  )
}
