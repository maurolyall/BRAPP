'use client'

import { useState } from 'react'

export default function AdImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="rounded-xl overflow-hidden cursor-zoom-in"
        style={{ backgroundColor: '#f3f3f3' }}
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          style={{ maxHeight: 360, objectFit: 'contain', width: '100%' }}
        />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full rounded-xl"
            style={{ objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
