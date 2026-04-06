'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/ToastProvider'
import { confirmOffer, rejectOffer } from '@/app/actions/bookings'

interface ExistingOffer {
  id: string
  message: string | null
  price: number | null
  status: 'pending' | 'accepted' | 'rejected'
}

interface Props {
  bookingId: string
  providerId: string
  existingOffer: ExistingOffer | null
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Enviada — esperando respuesta', color: 'var(--text-muted)',   bg: '#f3f3f3' },
  accepted: { label: 'Aceptada',                      color: '#fff',                bg: 'var(--color-success)' },
  rejected: { label: 'Rechazada',                     color: '#dc2626',             bg: '#fff1f2' },
}

export default function OfferForm({ bookingId, providerId, existingOffer }: Props) {
  const router = useRouter()
  const { show } = useToast()

  const [price, setPrice] = useState(existingOffer?.price != null ? String(existingOffer.price) : '')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<'confirm' | 'reject' | null>(null)

  async function handleConfirm() {
    if (!existingOffer) return
    setActionLoading('confirm')
    await confirmOffer(existingOffer.id, bookingId, providerId)
    router.push(`/dashboard/provider/activity/${bookingId}`)
  }

  async function handleReject() {
    if (!existingOffer) return
    setActionLoading('reject')
    await rejectOffer(existingOffer.id, bookingId)
    router.refresh()
    setActionLoading(null)
  }

  if (existingOffer) {
    const badge = STATUS_LABEL[existingOffer.status] ?? STATUS_LABEL.pending
    return (
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>Tu oferta</span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        {existingOffer.price != null && (
          <span className="text-base font-bold" style={{ color: 'var(--primary-red)' }}>
            ${existingOffer.price.toLocaleString('es-AR')}
          </span>
        )}

        {existingOffer.status === 'accepted' && (
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleReject}
              disabled={actionLoading !== null}
              className="flex-1 py-3 rounded-full text-sm font-bold border disabled:opacity-60"
              style={{ borderColor: 'var(--primary-red)', color: 'var(--primary-red)', backgroundColor: 'transparent' }}
            >
              {actionLoading === 'reject' ? 'Rechazando...' : 'Rechazar'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={actionLoading !== null}
              className="flex-1 py-3 rounded-full text-sm font-bold disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
            >
              {actionLoading === 'confirm' ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const parsedPrice = price.trim() ? parseFloat(price.replace(/\./g, '').replace(',', '.')) : null

      const { error } = await supabase
        .from('booking_offers')
        .insert({
          booking_id:  bookingId,
          provider_id: providerId,
          price:       parsedPrice,
        })

      if (error) throw error

      show('Oferta enviada correctamente', 'success')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Error desconocido'
      show(`Error: ${msg}`, 'error')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          Precio estimado{' '}
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(opcional)</span>
        </label>
        <div className="relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          >
            $
          </span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 rounded-2xl text-sm border outline-none"
            style={{ borderColor: '#e0e0e0', backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)' }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full text-sm font-bold disabled:opacity-60"
        style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
      >
        {loading ? 'Enviando...' : 'Enviar oferta'}
      </button>
    </form>
  )
}
