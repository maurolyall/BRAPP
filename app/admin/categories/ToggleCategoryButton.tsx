'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ToggleCategoryButton({ id, active }: { id: string; active: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await fetch('/api/admin/categories/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      style={{
        backgroundColor: active ? '#dc262618' : '#05966918',
        color: active ? '#dc2626' : '#059669',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '...' : active ? 'Desactivar' : 'Activar'}
    </button>
  )
}
