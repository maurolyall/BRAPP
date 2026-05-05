'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  { value: 'user', label: 'Cliente', color: '#2563eb' },
  { value: 'provider', label: 'Proveedor', color: '#16a34a' },
  { value: 'admin', label: 'Admin', color: '#dc2626' },
]

export default function ChangeRoleButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (selected === currentRole) { setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: selected }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(`Error: ${json.error ?? res.status}`)
        return
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error de red al cambiar el rol')
    } finally {
      setLoading(false)
    }
  }

  const current = ROLES.find((r) => r.value === currentRole)

  return (
    <>
      <button
        onClick={() => { setSelected(currentRole); setOpen(true) }}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
        style={{ backgroundColor: `${current?.color}18`, color: current?.color }}
      >
        {current?.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', width: 360 }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Cambiar rol</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                style={{ color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-left transition-all"
                  style={{
                    backgroundColor: selected === r.value ? `${r.color}12` : 'var(--bg-body)',
                    color: selected === r.value ? r.color : 'var(--text-muted)',
                    border: `1.5px solid ${selected === r.value ? r.color : 'transparent'}`,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  {r.label}
                  {selected === r.value && (
                    <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || selected === currentRole}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity"
                style={{
                  backgroundColor: 'var(--primary-red)',
                  color: '#fff',
                  opacity: loading || selected === currentRole ? 0.5 : 1,
                }}
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
