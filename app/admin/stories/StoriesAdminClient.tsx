'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import StoryForm from '@/components/admin/StoryForm'
import StoriesViewer from '@/components/dashboard/stories/StoriesViewer'

interface StoryRow {
  id: string
  title: string
  image_url: string
  link_url: string | null
  sort_order: number
  active: boolean
  expires_at: string | null
  created_at: string
  view_count: number
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

interface Props {
  initialStories: StoryRow[]
}

export default function StoriesAdminClient({ initialStories }: Props) {
  const [stories, setStories] = useState<StoryRow[]>(initialStories)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
  const supabase = createClient()

  const activeStories = stories.filter((s) => s.active)
  const totalViews = stories.reduce((acc, s) => acc + s.view_count, 0)
  const activeCount = activeStories.length

  async function reload() {
    const { data: storiesData } = await supabase
      .from('stories')
      .select('id, title, image_url, link_url, sort_order, active, expires_at, created_at')
      .order('sort_order', { ascending: true })
    const { data: viewsData } = await supabase.from('story_views').select('story_id')
    const viewCounts: Record<string, number> = {}
    for (const v of viewsData ?? []) {
      viewCounts[v.story_id] = (viewCounts[v.story_id] ?? 0) + 1
    }
    setStories((storiesData ?? []).map((s) => ({ ...s, view_count: viewCounts[s.id] ?? 0 })))
  }

  async function toggleActive(id: string, current: boolean) {
    setToggling(id)
    await supabase.from('stories').update({ active: !current }).eq('id', id)
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, active: !current } : s))
    setToggling(null)
  }

  async function deleteStory(id: string, imageUrl: string) {
    if (!confirm('¿Eliminar esta story? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    try {
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/stories/')
      const storagePath = pathParts[1] ?? ''
      if (storagePath) await supabase.storage.from('stories').remove([storagePath])
      await supabase.from('stories').delete().eq('id', id)
      setStories((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>

      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Stories</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Contenido que aparece en la pantalla de servicios para clientes
          </p>
        </div>
        <div className="flex gap-2">
          {activeStories.length > 0 && (
            <button
              onClick={() => setPreview({ open: true, index: 0 })}
              className="px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90"
              style={{ backgroundColor: '#1e293b', color: 'white' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Vista previa
            </button>
          )}
          <StoryForm onCreated={reload} />
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-8" style={{ maxWidth: 600 }}>
        {[
          {
            label: 'Stories totales',
            value: stories.length,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            ),
            color: '#6366f1', bg: '#eef2ff',
          },
          {
            label: 'Activas ahora',
            value: activeCount,
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            ),
            color: '#059669', bg: '#dcfce7',
          },
          {
            label: 'Vistas únicas',
            value: totalViews.toLocaleString('es-AR'),
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ),
            color: 'var(--primary-red)', bg: '#fee2e2',
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ color: 'var(--text-dark)' }}>{m.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {stories.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-24 gap-3"
          style={{ backgroundColor: 'var(--bg-cards)', maxWidth: 600 }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No hay stories todavía</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Creá la primera con el botón de arriba</p>
        </div>
      ) : (
        /* ── Story cards — fixed 180px wide each, flex wrap ── */
        <div className="flex flex-wrap gap-5">
          {stories.map((story) => {
            const activeIdx = activeStories.findIndex((s) => s.id === story.id)
            return (
              <div
                key={story.id}
                className="rounded-2xl overflow-hidden flex flex-col flex-shrink-0"
                style={{ width: 180, backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {/* Thumbnail 9:16 — 180px wide → 320px tall */}
                <div className="relative" style={{ width: 180, height: 320 }}>
                  <Image src={story.image_url} alt={story.title} fill className="object-cover" />

                  {/* Gradient */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }}
                  />

                  {/* Order badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
                    >
                      #{story.sort_order}
                    </span>
                  </div>

                  {/* Title + time */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                    <p className="text-white text-sm font-bold leading-tight line-clamp-2">{story.title}</p>
                    <p className="text-white/55 text-xs mt-0.5">{timeAgo(story.created_at)}</p>
                  </div>

                  {/* Hover play overlay */}
                  <button
                    onClick={() => activeIdx >= 0 && setPreview({ open: true, index: activeIdx })}
                    disabled={activeIdx < 0}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                  >
                    {activeIdx >= 0 ? (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                    ) : (
                      <span className="text-white/60 text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">Inactiva</span>
                    )}
                  </button>
                </div>

                {/* Status + views */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      backgroundColor: story.active ? '#dcfce7' : '#fee2e2',
                      color: story.active ? '#059669' : '#dc2626',
                    }}
                  >
                    <span className="inline-block rounded-full" style={{ width: 5, height: 5, backgroundColor: story.active ? '#059669' : '#dc2626' }} />
                    {story.active ? 'Activa' : 'Inactiva'}
                  </span>
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-dark)' }}>{story.view_count}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 px-3 py-2.5">
                  <button
                    onClick={() => toggleActive(story.id, story.active)}
                    disabled={toggling === story.id}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: story.active ? '#f3f4f6' : 'var(--primary-red)',
                      color: story.active ? 'var(--text-muted)' : 'white',
                    }}
                  >
                    {toggling === story.id ? '...' : story.active ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteStory(story.id, story.image_url)}
                    disabled={deleting === story.id}
                    className="px-2.5 py-1.5 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                  >
                    {deleting === story.id ? '...' : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Preview — usa el mismo StoriesViewer real, fullscreen ── */}
      {preview.open && activeStories.length > 0 && (
        <StoriesViewer
          stories={activeStories}
          initialIndex={preview.index}
          onClose={() => setPreview({ open: false, index: 0 })}
          onViewed={() => {}}
        />
      )}
    </div>
  )
}
