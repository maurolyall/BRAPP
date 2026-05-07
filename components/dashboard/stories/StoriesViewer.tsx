'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

export interface Story {
  id: string
  title: string
  image_url: string
  link_url: string | null
  created_at: string
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

interface StoriesViewerProps {
  stories: Story[]
  initialIndex: number
  onClose: () => void
  onViewed: (storyId: string) => void
}

const STORY_DURATION = 5000

export default function StoriesViewer({
  stories,
  initialIndex,
  onClose,
  onViewed,
}: StoriesViewerProps) {
  const [current, setCurrent] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const elapsedRef = useRef<number>(0)

  const story = stories[current]

  const goNext = useCallback(() => {
    if (current < stories.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      onClose()
    }
  }, [current, stories.length, onClose])

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((c) => c - 1)
    }
  }, [current])

  // Reset & start timer when story changes
  useEffect(() => {
    setProgress(0)
    elapsedRef.current = 0
    startTimeRef.current = Date.now()
    onViewed(story.id)

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (paused) return
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current)
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        goNext()
      }
    }, 50)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  // Pause / resume
  useEffect(() => {
    if (paused) {
      elapsedRef.current += Date.now() - startTimeRef.current
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else {
      startTimeRef.current = Date.now()
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current)
        const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
        setProgress(pct)
        if (pct >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          goNext()
        }
      }, 50)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
    >
      {/* Story card */}
      <div className="relative w-full h-full flex flex-col" style={{ maxWidth: 430 }}>

        {/* ── Tap zones z-20 — behind header/bottom (z-30) ── */}
        <button
          className="absolute left-0 top-0 w-1/3 z-20"
          style={{ bottom: 80, background: 'transparent' }}
          onClick={goPrev}
          aria-label="Historia anterior"
        />
        <button
          className="absolute right-0 top-0 w-1/3 z-20"
          style={{ bottom: 80, background: 'transparent' }}
          onClick={goNext}
          aria-label="Historia siguiente"
        />
        <button
          className="absolute left-1/3 right-1/3 top-0 z-20"
          style={{ bottom: 80, background: 'transparent' }}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          aria-label="Mantener para pausar"
        />

        {/* ── Progress bars z-30 ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
          {stories.map((s, i) => (
            <div
              key={s.id}
              className="h-0.5 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  backgroundColor: 'white',
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header z-30 ── */}
        <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
              style={{ backgroundColor: 'white' }}
            >
              <Image src="/icons/PROVEEDOR.svg" alt="Botón Rojo" width={20} height={20} />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">botón rojo</p>
              <p className="text-white/60 text-xs">{getRelativeTime(story.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="text-white/70 hover:text-white"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Reanudar' : 'Pausar'}
            >
              {paused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Image ── */}
        <div className="relative w-full h-full">
          <Image
            key={story.id}
            src={story.image_url}
            alt={story.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* ── Bottom: "Ver más" only, no bar, no like ── */}
        {story.link_url && (
          <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-end px-5">
            <a
              href={story.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold"
              style={{ backgroundColor: 'var(--primary-red)', color: 'white' }}
            >
              Ver más
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
