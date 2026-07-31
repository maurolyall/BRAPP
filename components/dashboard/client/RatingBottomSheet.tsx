'use client'

import { useState } from 'react'
import Image from 'next/image'

const TAGS = [
  'Amabilidad',
  'Profesionalismo',
  'Confiable',
  'Información completa',
  'Claridad',
  'Responsable',
  'Organizado',
  'Otro',
]

interface Props {
  open: boolean
  onClose: () => void
  booking: {
    id: string
    categoryName: string
    description?: string | null
    scheduledDate?: string | null
  }
}

export default function RatingBottomSheet({ open, onClose, booking }: Props) {
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [anonymous, setAnonymous] = useState(false)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const canSubmit = stars > 0 && selectedTags.length >= 3

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          stars,
          tags: selectedTags,
          comment,
          anonymous,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return }
      setDone(true)
      setTimeout(onClose, 1500)
    } catch {
      setError('Error de red. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative flex flex-col rounded-t-3xl px-5 pt-5 pb-8 gap-4"
        style={{
          backgroundColor: 'var(--bg-cards)',
          maxHeight: '90vh',
          overflowY: 'auto',
          marginLeft: 'max(0px, calc(50vw - 215px))',
          marginRight: 'max(0px, calc(50vw - 215px))',
        }}
      >
        {/* Pill handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ backgroundColor: '#e0e0e0' }} />

        {done ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="text-4xl">⭐</span>
            <p className="text-base font-bold text-center" style={{ color: 'var(--text-dark)' }}>
              ¡Gracias por tu valoración!
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-dark)' }}>
                  Valorá tu último pedido
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Valorá tu última solicitud para ayudarnos a mejorar la experiencia.
                </p>
              </div>
              <Image src="/icons/valoracion.svg" alt="Valoración" width={90} height={80} className="flex-shrink-0" />
            </div>

            {/* Booking card */}
            <div className="rounded-2xl px-4 py-3 flex flex-col gap-1" style={{ backgroundColor: 'var(--bg-body)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-dark)' }}>
                  {booking.categoryName}
                  <span className="text-xs font-normal flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    4.5 (28)
                  </span>
                </span>
              </div>
              {booking.description && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{booking.description}</p>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>Completado</span>
                {booking.scheduledDate && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {booking.scheduledDate}
                  </span>
                )}
              </div>
            </div>

            {/* Anónimo toggle */}
            <div className="flex items-center justify-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--bg-body)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Anónimo</span>
              <button
                onClick={() => setAnonymous(!anonymous)}
                className="relative inline-flex items-center rounded-full transition-colors"
                style={{ width: 44, height: 24, backgroundColor: anonymous ? 'var(--primary-red)' : '#d1d5db' }}
              >
                <span
                  className="inline-block rounded-full bg-white transition-transform"
                  style={{ width: 18, height: 18, transform: anonymous ? 'translateX(22px)' : 'translateX(3px)' }}
                />
              </button>
            </div>

            {/* Estrellas */}
            <div className="flex items-center justify-center gap-2 rounded-2xl px-4 py-4" style={{ backgroundColor: 'var(--bg-body)' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(n)}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill={(hovered || stars) >= n ? 'var(--primary-red)' : 'none'}
                    stroke={(hovered || stars) >= n ? 'var(--primary-red)' : '#d1d5db'}
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--primary-red)" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>

            {/* Comentario */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agrega un comentario sobre tu experiencia."
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', border: 'none' }}
            />

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Seleccioná al menos 3
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: selected ? 'var(--primary-red)' : 'transparent',
                        color: selected ? '#fff' : 'var(--text-muted)',
                        border: selected ? '1.5px solid var(--primary-red)' : '1.5px solid #d1d5db',
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <p className="text-xs text-center" style={{ color: 'var(--primary-red)' }}>{error}</p>
            )}

            {/* Botón enviar */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full py-3.5 rounded-full text-sm font-bold transition-all"
              style={{
                backgroundColor: canSubmit ? 'var(--primary-red)' : '#d1d5db',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
