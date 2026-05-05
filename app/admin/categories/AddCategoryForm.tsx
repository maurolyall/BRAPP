'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AddCategoryForm() {
  const [name, setName] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('El nombre es requerido'); return }

    setLoading(true)
    const fd = new FormData()
    fd.append('name', name)
    if (file) fd.append('icon', file)

    const res = await fetch('/api/admin/categories/create', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la categoría')
      setLoading(false)
      return
    }

    setName('')
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Nueva categoría</h2>

      <div className="flex items-end gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all hover:border-red-400"
          style={{ borderColor: '#e5e7eb' }}
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-contain p-1" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFile} />

        <div className="flex-1">
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Plomero"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border"
            style={{
              borderColor: '#e5e7eb',
              color: 'var(--text-dark)',
              backgroundColor: 'var(--bg-body)',
              fontSize: 16,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ backgroundColor: 'var(--primary-red)', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Guardando...' : 'Agregar'}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: '#dc2626' }}>{error}</p>
      )}
    </form>
  )
}
