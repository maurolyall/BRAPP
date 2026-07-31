'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import RatingBottomSheet from './RatingBottomSheet'

interface LastBooking {
  id: string
  categoryName: string
  description?: string | null
  scheduledDate?: string | null
}

interface Props {
  lastCompletedBooking?: LastBooking | null
}

export default function HomeHero({ lastCompletedBooking }: Props) {
  const router = useRouter()
  const [showRating, setShowRating] = useState(false)

  const handleTap = () => {
    if (lastCompletedBooking) {
      setShowRating(true)
    } else {
      router.push('/dashboard/client/chat')
    }
  }

  return (
    <>
      <button
        onClick={handleTap}
        className="flex justify-center w-full"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <Image
          src="/icons/boton.svg"
          alt="Botón Rojo"
          width={290}
          height={290}
          className="w-full max-w-[290px] h-auto"
          priority
        />
      </button>

      {lastCompletedBooking && (
        <RatingBottomSheet
          open={showRating}
          onClose={() => setShowRating(false)}
          booking={lastCompletedBooking}
        />
      )}
    </>
  )
}
