const TONES = {
  good: 'bg-green-50 text-good',
  neutral: 'bg-elevated text-body',
  bad: 'bg-red-50 text-bad',
}

interface StatusBadgeProps {
  label: string
  tone: keyof typeof TONES
}

export default function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${TONES[tone]}`}>{label}</span>
}
