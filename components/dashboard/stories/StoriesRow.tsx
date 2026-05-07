'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import StoriesViewer, { Story } from './StoriesViewer'

interface StoriesRowProps {
  stories: Story[]
  currentUserId: string
  viewedIds: string[]
}

export default function StoriesRow({ stories, currentUserId, viewedIds: initialViewedIds }: StoriesRowProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set(initialViewedIds))
  const supabase = createClient()

  if (stories.length === 0) return null

  // All stories seen = ring turns grey
  const allSeen = stories.every((s) => viewedIds.has(s.id))

  async function handleViewed(storyId: string) {
    if (viewedIds.has(storyId)) return
    setViewedIds((prev) => new Set([...prev, storyId]))
    await supabase.from('story_views').upsert(
      { story_id: storyId, user_id: currentUserId },
      { onConflict: 'story_id,user_id' }
    )
  }

  return (
    <>
      <div className="flex">
      <button
        onClick={() => setViewerOpen(true)}
        className="flex flex-col items-center gap-1.5 flex-shrink-0"
      >
        {/* Single avatar ring */}
        <div
          className="rounded-full p-[2.5px]"
          style={{
            background: allSeen
              ? '#d1d5db'
              : 'linear-gradient(135deg, var(--primary-red) 0%, #ff6b6b 100%)',
            width: 64,
            height: 64,
          }}
        >
          <div
            className="rounded-full border-2 border-white w-full h-full flex items-center justify-center"
            style={{ backgroundColor: 'white' }}
          >
            <Image src="/icons/PROVEEDOR.svg" alt="Botón Rojo" width={36} height={36} />
          </div>
        </div>
        <span
          className="text-xs text-center whitespace-nowrap"
          style={{ color: 'var(--text-dark)', fontWeight: allSeen ? 400 : 600 }}
        >
          botón rojo
        </span>
      </button>
      </div>

      {viewerOpen && (
        <StoriesViewer
          stories={stories}
          initialIndex={0}
          onClose={() => setViewerOpen(false)}
          onViewed={handleViewed}
        />
      )}
    </>
  )
}
