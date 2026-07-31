'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  icon_url: string | null
}

interface Props {
  categories: Category[]
}

const INITIAL_COUNT = 5

export default function ServiceCategoryGrid({ categories }: Props) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const topCategories = categories.slice(0, 3)

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const visibleCategories = search
    ? filtered
    : showAll
    ? filtered
    : filtered.slice(0, INITIAL_COUNT)

  const hasMore = !search && !showAll && filtered.length > INITIAL_COUNT

  return (
    <div className="flex flex-col gap-5">

      {/* Los más solicitados */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold flex items-center gap-1.5" style={{ color: 'var(--text-dark)' }}>
          Los más solicitados
          <img src="/icons/fire.svg" alt="popular" width={17} height={22} />
        </h2>
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {topCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/dashboard/client/services/${cat.id}?new=1`}
              className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl p-3 transition-all"
              style={{
                backgroundColor: 'var(--bg-cards)',
                width: '110px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {cat.icon_url ? (
                <Image
                  src={cat.icon_url}
                  alt={cat.name}
                  width={80}
                  height={80}
                  className="w-full h-20 object-contain"
                />
              ) : (
                <div className="w-full h-20 rounded-xl" style={{ backgroundColor: '#f3f3f3' }} />
              )}
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--text-dark)' }}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Todos los servicios + buscador */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>
          Todos los servicios
        </h2>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--primary-red)', width: 30, height: 30 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar servicios"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-dark)' }}
          />
          <button className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        {/* Lista de servicios */}
        <div className="flex flex-col gap-2">
          {visibleCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/dashboard/client/services/${cat.id}?new=1`}
              className="flex items-center px-4 py-3.5 rounded-2xl transition-all"
              style={{
                backgroundColor: 'var(--bg-cards)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                color: 'var(--text-dark)',
              }}
            >
              <span className="text-sm font-semibold flex-1">{cat.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No se encontraron servicios.
            </p>
          )}
        </div>

        {/* Ver más */}
        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'var(--bg-cards)',
              color: 'var(--text-muted)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            Ver más
          </button>
        )}
      </div>
    </div>
  )
}
