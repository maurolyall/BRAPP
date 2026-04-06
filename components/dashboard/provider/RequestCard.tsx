'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface RequestCardProps {
  id: string
  description: string | null
  scheduled_date: string | null
  city: string | null
  user: {
    full_name: string | null
    avatar_url: string | null
  }
  completedCount: number
  alreadyOffered: boolean
}

function useEndOfDayCountdown(active: boolean) {
  const calc = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    const diff = end.getTime() - now.getTime()
    if (diff <= 0) return '0:00:00'
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1000)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Start with empty string to avoid server/client mismatch on hydration
  const [time, setTime] = useState('')

  useEffect(() => {
    if (!active) return
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [active])

  return time
}

export default function RequestCard({
  id,
  description,
  scheduled_date,
  city,
  user,
  completedCount,
  alreadyOffered,
}: RequestCardProps) {
  const isToday = scheduled_date === 'today'
  const countdown = useEndOfDayCountdown(isToday)

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <Link
      href={`/dashboard/provider/requests/${id}`}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
    >
      {/* User row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatar_url ? (
            <div className="w-11 h-11 rounded-full overflow-hidden relative">
              <Image
                src={user.avatar_url}
                alt={user.full_name ?? 'Usuario'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--primary-red)' }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name + completed count */}
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-bold truncate" style={{ color: 'var(--text-dark)' }}>
            {user.full_name ?? 'Usuario'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {completedCount === 0
              ? 'Sin conexiones'
              : `${completedCount} trabajo${completedCount !== 1 ? 's' : ''} completado${completedCount !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Badge */}
        {alreadyOffered ? (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
          >
            Oferta enviada
          </span>
        ) : (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
          >
            Nueva
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-dark)' }}>
          {description}
        </p>
      )}

      {/* Footer: countdown + city */}
      <div className="flex items-center justify-between">
        {isToday ? (
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-red)', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: 'var(--primary-red)' }}>
              Tiempo restante {countdown} hs
            </span>
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            A coordinar
          </span>
        )}

        {city && (
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {city}
          </span>
        )}
      </div>
    </Link>
  )
}
