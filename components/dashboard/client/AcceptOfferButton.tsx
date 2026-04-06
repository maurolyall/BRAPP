'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptOffer } from '@/app/actions/bookings'

interface Props {
  offerId: string
  bookingId: string
}

export default function AcceptOfferButton({ offerId, bookingId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    await acceptOffer(offerId, bookingId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="w-full py-3 rounded-full text-sm font-bold disabled:opacity-60"
      style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
    >
      {loading ? 'Aceptando...' : 'Aceptar oferta'}
    </button>
  )
}
