'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/ToastProvider'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

const WARRANTY_OPTIONS = [
  { value: '', label: 'Seleccioná una opción' },
  { value: '30_dias',  label: '30 días' },
  { value: '60_dias',  label: '60 días' },
  { value: '90_dias',  label: '90 días' },
  { value: '180_dias', label: '180 días' },
  { value: '1_año',    label: '1 año' },
]

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Seleccioná una opción' },
  { value: '1_año',          label: '1 año' },
  { value: '1_a_3_años',     label: 'Entre 1 y 3 años' },
  { value: '3_a_5_años',     label: 'Entre 3 y 5 años' },
  { value: '5_a_10_años',    label: 'Entre 5 y 10 años' },
  { value: 'mas_de_10_años', label: 'Más de 10 años' },
]

interface Props {
  providerId: string
  categoryId: string
  categoryName: string
  initialData: {
    professional_description: string | null
    visit_price: number | null
    labor_warranty: string | null
    years_experience: string | null
  }
}

export default function ServiceConfigForm({ providerId, categoryId, categoryName, initialData }: Props) {
  const router = useRouter()
  const { schedule } = useToast()
  const [description, setDescription] = useState(initialData.professional_description ?? '')
  const [visitPrice, setVisitPrice] = useState(initialData.visit_price?.toString() ?? '')
  const [warranty, setWarranty] = useState(initialData.labor_warranty ?? '')
  const [experience, setExperience] = useState(initialData.years_experience ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const price = visitPrice ? parseFloat(visitPrice) : null
    if (price !== null && price < 30000) {
      setError('El precio mínimo de visita es $30.000')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('provider_categories')
      .update({
        professional_description: description || null,
        visit_price: price,
        labor_warranty: warranty || null,
        years_experience: experience || null,
      })
      .eq('provider_id', providerId)
      .eq('category_id', categoryId)

    setSaving(false)
    if (dbError) {
      setError('No se pudo guardar. Intentá de nuevo.')
      return
    }
    schedule('Servicio actualizado correctamente')
    router.push('/dashboard/provider/profile')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Descripción profesional */}
      <Textarea
        label="Descripción profesional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={`Contá brevemente tu experiencia como ${categoryName}...`}
        rows={4}
        maxLength={300}
        hint={`${description.length}/300`}
      />

      {/* Precio de visita */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          Precio de visita <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(mín. $30.000)</span>
        </label>
        <div className="relative">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            $
          </span>
          <input
            type="number"
            value={visitPrice}
            onChange={(e) => setVisitPrice(e.target.value)}
            placeholder="30000"
            min={30000}
            step={1000}
            className="w-full rounded-xl pl-8 pr-4 py-3 text-[16px] focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-body)',
              color: 'var(--text-dark)',
              border: '1.5px solid #e5e7eb',
            }}
          />
        </div>
      </div>

      {/* Garantía */}
      <Select
        label="Garantía por mano de obra"
        value={warranty}
        onChange={(e) => setWarranty(e.target.value)}
        options={WARRANTY_OPTIONS}
      />

      {/* Años de experiencia */}
      <Select
        label="Años de experiencia"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        options={EXPERIENCE_OPTIONS}
      />

      {error && (
        <p className="text-sm text-center" style={{ color: 'var(--primary-red)' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-full text-white font-semibold text-sm transition-opacity disabled:opacity-60"
        style={{ backgroundColor: 'var(--primary-red)' }}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
