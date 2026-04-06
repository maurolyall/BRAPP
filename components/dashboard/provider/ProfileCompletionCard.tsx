interface Props {
  percentage: number
}

export default function ProfileCompletionCard({ percentage }: Props) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percentage / 100)

  return (
    <div
      className="dash-card flex items-center gap-5"
    >
      {/* Text */}
      <div className="flex-1">
        <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-dark)' }}>
          Completá tu perfil para comenzar a recibir solicitudes...
        </p>
      </div>

      {/* Circular progress */}
      <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--primary-red)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Percentage label */}
        <span
          className="absolute text-lg font-bold"
          style={{ color: 'var(--text-dark)' }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  )
}
