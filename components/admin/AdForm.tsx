'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

interface Ad {
  id: string
  title: string
  image_url: string
  link_url: string | null
  target: string
  sort_order: number
  active: boolean
  starts_at: string | null
  ends_at: string | null
}

function toDateInput(val: string | null) {
  if (!val) return ''
  return val.split('T')[0]
}

export default function AdForm({ ad }: { ad?: Ad }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(ad?.title ?? '')
  const [linkUrl, setLinkUrl] = useState(ad?.link_url ?? '')
  const [target, setTarget] = useState<'client' | 'provider'>(ad?.target as 'client' | 'provider' ?? 'client')
  const [sortOrder, setSortOrder] = useState(ad?.sort_order ?? 0)
  const [active, setActive] = useState(ad?.active ?? true)
  const [startsAt, setStartsAt] = useState(toDateInput(ad?.starts_at ?? null))
  const [endsAt, setEndsAt] = useState(toDateInput(ad?.ends_at ?? null))
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleOpen() {
    setTitle(ad?.title ?? '')
    setLinkUrl(ad?.link_url ?? '')
    setTarget(ad?.target as 'client' | 'provider' ?? 'client')
    setSortOrder(ad?.sort_order ?? 0)
    setActive(ad?.active ?? true)
    setStartsAt(toDateInput(ad?.starts_at ?? null))
    setEndsAt(toDateInput(ad?.ends_at ?? null))
    setFile(null)
    setPreview(null)
    setOpen(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      let imageUrl = ad?.image_url ?? ''

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('advertisements')
          .upload(fileName, file)
        if (error) throw error
        imageUrl = supabase.storage.from('advertisements').getPublicUrl(data.path).data.publicUrl
      }

      const payload = {
        title,
        image_url: imageUrl,
        link_url: linkUrl || null,
        target,
        sort_order: sortOrder,
        active,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
      }

      if (ad) {
        await supabase.from('advertisements').update(payload).eq('id', ad.id)
      } else {
        await supabase.from('advertisements').insert(payload)
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Error al guardar la publicidad')
    } finally {
      setLoading(false)
    }
  }

  const currentImage = preview ?? (ad?.image_url || null)

  const inputStyle = { backgroundColor: 'var(--bg-body)', border: '1px solid #e5e7eb', fontSize: 16, height: 42 }

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
        style={ad
          ? { color: 'var(--text-muted)', backgroundColor: 'transparent' }
          : { backgroundColor: 'var(--primary-red)', color: '#fff' }
        }
      >
        {ad ? 'Editar' : '+ Nueva publicidad'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: 'var(--bg-cards)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>
                {ad ? 'Editar publicidad' : 'Nueva publicidad'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 flex flex-col gap-5">

                {/* Image upload */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Imagen {!ad && <span style={{ color: 'var(--primary-red)' }}>*</span>}
                  </label>
                  {currentImage && (
                    <div className="w-full rounded-xl overflow-hidden mb-3" style={{ backgroundColor: '#f3f3f3' }}>
                      <img src={currentImage} alt="Preview" className="w-full h-auto block" style={{ maxHeight: 160, objectFit: 'contain' }} />
                    </div>
                  )}
                  <label
                    className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold cursor-pointer"
                    style={{ border: '2px dashed #e5e7eb', color: 'var(--text-muted)', backgroundColor: 'var(--bg-body)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {file ? file.name : ad ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    <input type="file" accept="image/*" onChange={handleFileChange} required={!ad} className="hidden" />
                  </label>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Título <span style={{ color: 'var(--primary-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl px-4 text-sm"
                    style={inputStyle}
                    placeholder="Ej: Promo verano 2026"
                    required
                  />
                </div>

                {/* Target + Order */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                      Destinatario
                    </label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value as 'client' | 'provider')}
                      className="w-full rounded-xl px-4 text-sm appearance-none"
                      style={inputStyle}
                    >
                      <option value="client">Cliente</option>
                      <option value="provider">Proveedor</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                      Orden
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(parseInt(e.target.value))}
                      className="w-full rounded-xl px-4 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                      Inicio (opcional)
                    </label>
                    <input
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full rounded-xl px-4 text-sm"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                      Fin (opcional)
                    </label>
                    <input
                      type="date"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="w-full rounded-xl px-4 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Link */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Link (opcional)
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full rounded-xl px-4 text-sm"
                    style={inputStyle}
                    placeholder="https://..."
                  />
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setActive(!active)}
                    className="relative"
                    style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: active ? 'var(--primary-red)' : '#e5e7eb', flexShrink: 0 }}
                  >
                    <div
                      className="absolute top-1 transition-all"
                      style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', left: active ? 24 : 4, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                    {active ? 'Activa' : 'Inactiva'}
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 sticky bottom-0" style={{ borderTop: '1px solid #f0f0f0', backgroundColor: 'var(--bg-cards)' }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: 'var(--primary-red)', color: '#fff', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Guardando...' : ad ? 'Guardar cambios' : 'Crear publicidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
