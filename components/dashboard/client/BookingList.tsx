'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ACTIVE_STATUSES, STATUS_LABEL, DATE_LABEL } from '@/lib/bookingConstants'

interface BookingItem {
  id: string
  status: string
  scheduled_date: string | null
  address: string | null
  created_at: string
  category_name: string
  offerCount: number
}

interface Props {
  bookings: BookingItem[]
}

type Tab = 'all' | 'active' | 'completed'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'active',    label: 'Activas' },
  { key: 'completed', label: 'Completadas' },
]

function isActive(status: string) {
  return ACTIVE_STATUSES.includes(status)
}

export default function BookingList({ bookings }: Props) {
  const [tab, setTab] = useState<Tab>('all')

  const filtered = bookings.filter((b) => {
    if (tab === 'active')    return ACTIVE_STATUSES.includes(b.status)
    if (tab === 'completed') return b.status === 'completed' || b.status === 'cancelled'
    return true
  })

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
          No hay solicitudes.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/client/bookings/${b.id}`}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
                  {b.category_name}
                </span>
                {b.status === 'confirmed' ? (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
                  >
                    En curso
                  </span>
                ) : b.status === 'pending' ? (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#f3f3f3', color: 'var(--text-muted)' }}
                  >
                    Esperando proveedor
                  </span>
                ) : b.offerCount > 0 && b.status === 'searching' ? (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
                  >
                    Oferta recibida
                  </span>
                ) : (
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
                  >
                    {isActive(b.status) ? 'Activa' : 'Completada'}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  {b.status === 'confirmed'
                    ? 'Trabajo en curso'
                    : b.status === 'pending'
                      ? 'Esperando proveedor'
                      : b.offerCount > 0 && b.status === 'searching'
                        ? `${b.offerCount} oferta${b.offerCount !== 1 ? 's' : ''} recibida${b.offerCount !== 1 ? 's' : ''}`
                        : (STATUS_LABEL[b.status] ?? b.status)}
                </span>
                {b.scheduled_date && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {DATE_LABEL[b.scheduled_date] ?? b.scheduled_date}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
