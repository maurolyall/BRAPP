'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'

interface StoryFormProps {
  onCreated: () => void
}

export default function StoryForm({ onCreated }: StoryFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Seleccioná una imagen'); return }
    if (!title.trim()) { setError('El título es requerido'); return }
    setLoading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('stories')
        .upload(path, file, { upsert: false })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error: insertErr } = await supabase.from('stories').insert({
        title: title.trim(),
        image_url: publicUrl,
        link_url: linkUrl.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 0,
        created_by: user.id,
      })

      if (insertErr) throw insertErr

      setOpen(false)
      setTitle('')
      setLinkUrl('')
      setSortOrder('0')
      setFile(null)
      setPreview(null)
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--primary-red)' }}
      >
        + Nueva story
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: 'var(--bg-cards)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>Nueva story</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Image picker */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Imagen (vertical, 9:16 recomendado)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-red-400"
                  style={{
                    borderColor: preview ? 'var(--primary-red)' : '#e5e7eb',
                    height: preview ? 'auto' : 120,
                    padding: preview ? 0 : undefined,
                    overflow: 'hidden',
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full object-cover rounded-xl" style={{ maxHeight: 200 }} />
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Seleccionar imagen</span>
                    </>
                  )}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null) }}
                    className="mt-1 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cambiar imagen
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Roberto Zanata – Plomero matriculado"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                  style={{ borderColor: '#e5e7eb', fontSize: 16 }}
                  required
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Link (opcional)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e5e7eb', fontSize: 16 }}
                />
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>Orden</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e5e7eb', fontSize: 16 }}
                />
              </div>

              {error && (
                <p className="text-sm font-semibold" style={{ color: 'var(--primary-red)' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--primary-red)' }}
              >
                {loading ? 'Subiendo...' : 'Publicar story'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
