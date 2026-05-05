'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Advertisement {
  id: string
  title: string
  image_url: string
  link_url: string | null
}

interface AdSliderProps {
  target?: 'client' | 'provider'
}

function trackEvent(type: 'impression' | 'click', id: string) {
  fetch(`/api/ads/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  }).catch(() => {})
}

export default function AdSlider({ target = 'client' }: AdSliderProps) {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    async function fetchAds() {
      const supabase = createClient()
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('active', true)
        .eq('target', target)
        .order('sort_order', { ascending: true })
        .limit(10)

      if (data && data.length > 0) {
        setAds(data)
        trackEvent('impression', data[0].id)
      }
    }
    fetchAds()
  }, [target])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    if (ads[index]) trackEvent('impression', ads[index].id)
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: index * sliderRef.current.offsetWidth,
        behavior: 'smooth',
      })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < ads.length - 1) {
        goToSlide(currentIndex + 1)
      } else if (diff < 0 && currentIndex > 0) {
        goToSlide(currentIndex - 1)
      }
    }
  }

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    const handleScroll = () => {
      const index = Math.round(slider.scrollLeft / slider.offsetWidth)
      setCurrentIndex(index)
    }

    slider.addEventListener('scroll', handleScroll, { passive: true })
    return () => slider.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % ads.length
        if (ads[nextIndex]) trackEvent('impression', ads[nextIndex].id)
        if (sliderRef.current) {
          sliderRef.current.scrollTo({
            left: nextIndex * sliderRef.current.offsetWidth,
            behavior: 'smooth',
          })
        }
        return nextIndex
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [ads])

  if (ads.length === 0) return null

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: '180px' }}>
      <div
        ref={sliderRef}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory h-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="flex-shrink-0 w-full snap-center"
            style={{ height: '180px' }}
          >
            {ad.link_url ? (
              <Link
                href={ad.link_url}
                className="block w-full h-full"
                onClick={() => trackEvent('click', ad.id)}
              >
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
              </Link>
            ) : (
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>

      {ads.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
