interface StatCardProps {
  label: string
  value: string
  delta: number
  deltaLabel?: string
  icon: string
  accent?: string
}

export default function StatCard({
  label,
  value,
  delta,
  deltaLabel = 'vs last month',
  icon,
  accent = 'var(--blue-primary)',
}: StatCardProps) {
  const positive = delta >= 0

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div
          className="flex items-center justify-center rounded-xl text-base"
          style={{ width: 36, height: 36, background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-xs mt-1.5 flex items-center gap-1.5">
          <span
            className="font-semibold"
            style={{ color: positive ? 'var(--green)' : 'var(--red)' }}
          >
            {positive ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{deltaLabel}</span>
        </p>
      </div>

      {/* Bottom accent bar */}
      <div className="rounded-full h-1 w-full" style={{ background: 'var(--bg-elevated)' }}>
        <div
          className="rounded-full h-1"
          style={{ width: `${Math.min(Math.abs(delta) * 3, 100)}%`, background: accent, transition: 'width 0.6s ease' }}
        />
      </div>
    </div>
  )
}
