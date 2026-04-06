'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function BookingImageModal({ imageUrl }: { imageUrl: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-full text-sm font-bold border flex items-center justify-center gap-2"
        style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)', backgroundColor: 'transparent' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        Ver imagen
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <Image
              src={imageUrl}
              alt="Imagen de la solicitud"
              width={600}
              height={400}
              className="w-full h-auto rounded-2xl"
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 rounded-full flex items-center justify-center"
              style={{ width: 32, height: 32, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
