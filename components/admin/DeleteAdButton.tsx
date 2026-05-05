'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function DeleteAdButton({ adId }: { adId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Estás seguro de que querés eliminar esta publicidad?')) return

    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.from('advertisements').delete().eq('id', adId)
      router.push('/admin/advertisements')
    } catch (error) {
      console.error(error)
      alert('Error al eliminar la publicidad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-xl px-3 py-2.5 text-sm font-semibold"
      style={{ color: '#dc2626' }}
    >
      {loading ? '...' : 'Eliminar'}
    </button>
  )
}
