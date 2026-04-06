'use client'

import { useState } from 'react'
import RequestCard from './RequestCard'

interface RequestItem {
  id: string
  description: string | null
  scheduled_date: string | null
  city: string | null
  category_id: string
  category_name: string
  user: { full_name: string | null; avatar_url: string | null }
  completedCount: number
  alreadyOffered: boolean
}

interface CategoryOption {
  id: string
  name: string
}

interface Props {
  requests: RequestItem[]
  categories: CategoryOption[]
}

type DateFilter = 'all' | 'today' | 'coordinate'

const DATE_PILLS: { key: DateFilter; label: string }[] = [
  { key: 'all',        label: 'Todas' },
  { key: 'today',      label: 'Hoy' },
  { key: 'coordinate', label: 'A coordinar' },
]

export default function ProviderRequestsList({ requests, categories }: Props) {
  const [dateFilter, setDateFilter]     = useState<DateFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filtered = requests.filter((r) => {
    if (dateFilter === 'today'      && r.scheduled_date !== 'today')      return false
    if (dateFilter === 'coordinate' && r.scheduled_date !== 'coordinate') return false
    if (categoryFilter !== 'all'    && r.category_id !== categoryFilter)  return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Date pills */}
      <div
        className="flex rounded-full p-1 gap-1"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        {DATE_PILLS.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setDateFilter(pill.key)}
            className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{
              backgroundColor: dateFilter === pill.key ? 'var(--primary-red)' : 'transparent',
              color: dateFilter === pill.key ? '#fff' : 'var(--text-muted)',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Category select — only when provider has >1 category */}
      {categories.length > 1 && (
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            backgroundColor: 'var(--bg-cards)',
            color: categoryFilter === 'all' ? 'var(--text-muted)' : 'var(--text-dark)',
            border: '1.5px solid #e5e7eb',
            borderRadius: 16,
            padding: '12px 40px 12px 16px',
            fontSize: 16,
            width: '100%',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
          }}
        >
          <option value="all">Todos los servicios</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
            Sin solicitudes
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No hay solicitudes que coincidan con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              id={r.id}
              description={r.description}
              scheduled_date={r.scheduled_date}
              city={r.city}
              user={r.user}
              completedCount={r.completedCount}
              alreadyOffered={r.alreadyOffered}
            />
          ))}
        </div>
      )}
    </div>
  )
}
