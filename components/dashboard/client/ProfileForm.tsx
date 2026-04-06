'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/ToastProvider'

interface ProfileData {
  full_name: string
  phone: string
  date_of_birth: string
  city: string
  address: string
  floor_apt: string
  lot: string
}

interface Props {
  profile: ProfileData
}

export default function ClientProfileForm({ profile }: Props) {
  const { show } = useToast()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone)
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth)
  const [city, setCity] = useState(profile.city)
  const [address, setAddress] = useState(profile.address)
  const [floorApt, setFloorApt] = useState(profile.floor_apt)
  const [lot, setLot] = useState(profile.lot)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth || null,
        city,
        address,
        floor_apt: floorApt,
        lot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id)

    setLoading(false)
    if (error) {
      show('No se pudo guardar. Intentá de nuevo.', 'error')
    } else {
      show('Perfil actualizado correctamente')
    }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre completo"
          type="text"
          placeholder="Tu nombre y apellido"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Teléfono"
          type="tel"
          placeholder="Ej: +54 9 11 1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Fecha de nacimiento"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        <Input
          label="Ciudad"
          type="text"
          placeholder="Ej: Buenos Aires"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Input
          label="Dirección"
          type="text"
          placeholder="Calle y número"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <Input
              label="Piso / Depto"
              type="text"
              placeholder="Ej: 3B"
              value={floorApt}
              onChange={(e) => setFloorApt(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Input
              label="Lote"
              type="text"
              placeholder="Ej: 12"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 rounded-full text-white font-semibold text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--primary-red)' }}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
