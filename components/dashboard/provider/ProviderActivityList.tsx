'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ActivityItem {
  id: string
  status: 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled'
  category_name: string
  client_name: string | null
  client_avatar_url: string | null
  client_city: string | null
  completedCount: number
  scheduled_date: string | null
  bookingId: string
}

interface Props {
  items: ActivityItem[]
}

type Tab = 'active' | 'completed'

const TABS: { key: Tab; label: string }[] = [
  { key: 'active',    label: 'Activos' },
  { key: 'completed', label: 'Completados' },
]

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending_confirmation: { label: 'Confirmar',  bg: 'var(--color-success)', color: '#fff' },
  confirmed:            { label: 'En curso',   bg: 'var(--primary-red)',   color: '#fff' },
  completed:            { label: 'Completado', bg: '#f3f3f3',              color: 'var(--text-muted)' },
  cancelled:            { label: 'Cancelado',  bg: '#f3f3f3',              color: 'var(--text-muted)' },
}

export default function ProviderActivityList({ items }: Props) {
  const [tab, setTab] = useState<Tab>('active')

  const filtered = items.filter((item) =>
    tab === 'active'
      ? item.status === 'pending_confirmation' || item.status === 'confirmed'
      : item.status === 'completed' || item.status === 'cancelled'
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div
        className="flex rounded-full p-1 gap-1"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{
              backgroundColor: tab === t.key ? 'var(--primary-red)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
          No hay trabajos aquí todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const badge = STATUS_BADGE[item.status]
            const href = item.status === 'pending_confirmation'
              ? `/dashboard/provider/requests/${item.bookingId}`
              : `/dashboard/provider/activity/${item.bookingId}`
            const initials = item.client_name
              ? item.client_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              : '?'
            return (
              <Link
                key={item.id}
                href={href}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
              >
                {/* User row */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {item.client_avatar_url ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden relative">
                        <Image
                          src={item.client_avatar_url}
                          alt={item.client_name ?? 'Cliente'}
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

                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="text-sm font-bold truncate" style={{ color: 'var(--text-dark)' }}>
                      {item.client_name ?? 'Cliente'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.completedCount === 0
                        ? 'Sin conexiones'
                        : `${item.completedCount} trabajo${item.completedCount !== 1 ? 's' : ''} completado${item.completedCount !== 1 ? 's' : ''}`}
                    </span>
                  </div>

                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Category + city */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {item.category_name}
                  </span>
                  {item.client_city && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {item.client_city}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
