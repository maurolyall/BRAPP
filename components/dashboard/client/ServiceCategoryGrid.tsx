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

export default function ServiceCategoryGrid({ categories }: Props) {
  const [search, setSearch] = useState('')

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Subtitle */}
      <p className="text-base text-center font-medium" style={{ color: 'var(--text-dark)' }}>
        ¿Qué necesitás para tu hogar?
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar servicio..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-full text-[16px] border outline-none"
        style={{ borderColor: '#e0e0e0', backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)' }}
      />

      {/* Title */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>Servicios</h1>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((cat) => (
          <Link
            key={cat.id}
            href={`/dashboard/client/services/${cat.id}`}
            className="card py-6 px-4 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md"
          >
            {cat.icon_url && (
              <Image
                src={cat.icon_url}
                alt={cat.name}
                width={60}
                height={60}
                className="h-24 w-auto"
              />
            )}
            <span className="text-sm font-bold text-center" style={{ color: 'var(--text-dark)' }}>
              {cat.name}
            </span>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-2 text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No se encontraron servicios.
          </p>
        )}
      </div>
    </div>
  )
}
