'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  userId: string
  categoryId: string
  defaultAddress: string
}

type ScheduledDate = 'today' | 'coordinate'
type PaymentMethod = 'coordinate' | 'prepaid'

export default function BookingRequestForm({ userId, categoryId, defaultAddress }: Props) {
  const router = useRouter()
  const { show } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState<ScheduledDate>('today')
  const [coordinatedDates, setCoordinatedDates] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('coordinate')
  const [address, setAddress] = useState(defaultAddress)
  const [loading, setLoading] = useState(false)

  const days = useMemo(() => {
    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const result = []
    const today = new Date()
    for (let i = 0; i < 10; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      result.push({
        iso: d.toISOString().split('T')[0],
        num: d.getDate(),
        label: i === 0 ? 'Hoy' : DAY_NAMES[d.getDay()],
      })
    }
    return result
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      show('Por favor ingresá una dirección', 'error')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      let image_url: string | null = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('booking-images')
          .upload(path, imageFile, { upsert: false })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('booking-images').getPublicUrl(path)
        image_url = data.publicUrl
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          category_id: categoryId,
          description: description.trim() || null,
          image_url,
          scheduled_date: scheduledDate,
          coordinated_dates: scheduledDate === 'coordinate' && coordinatedDates.length > 0 ? coordinatedDates : null,
          payment_method: paymentMethod,
          address: address.trim(),
          status: 'searching',
        })
        .select('id')
        .single()

      if (error) throw error

      router.push(`/dashboard/client/bookings/${booking.id}?new=1`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Error desconocido'
      show(`Error: ${msg}`, 'error')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Descripción */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          Descripción <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(opcional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Agrega una descripción a tu solicitud."
          rows={3}
          className="w-full px-4 py-3 rounded-2xl text-[16px] border outline-none resize-none"
          style={{ borderColor: '#e0e0e0', backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)' }}
        />
      </div>

      {/* Imagen */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          Imagen <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(opcional)</span>
        </label>
        {imagePreview ? (
          <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#f0f0f0' }}>
            <Image src={imagePreview} alt="Vista previa" fill className="object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-5 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2"
            style={{ borderColor: '#d0d0d0', backgroundColor: 'var(--bg-cards)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Subir foto del problema</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      </div>

      {/* Fecha */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>Fecha</label>
        <div className="flex gap-2">
          {([['today', 'Hoy'], ['coordinate', 'A coordinar']] as [ScheduledDate, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setScheduledDate(val)
                if (val === 'today') setCoordinatedDates([])
              }}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: scheduledDate === val ? 'var(--primary-red)' : 'var(--bg-cards)',
                color: scheduledDate === val ? '#fff' : 'var(--text-dark)',
                border: scheduledDate === val ? 'none' : '1.5px solid #e0e0e0',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selector de día — visible solo cuando "a coordinar" está seleccionado */}
        {scheduledDate === 'coordinate' && (
          <div
            className="-mx-4 px-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <div className="flex gap-2 pb-1 pr-8" style={{ width: 'max-content' }}>
              {days.map((day) => {
                const isSelected = coordinatedDates.includes(day.iso)
                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() =>
                      setCoordinatedDates((prev) =>
                        isSelected ? prev.filter((d) => d !== day.iso) : [...prev, day.iso]
                      )
                    }
                    className="flex flex-col items-center gap-0.5 rounded-2xl py-2.5 transition-colors"
                    style={{
                      width: 52,
                      flexShrink: 0,
                      backgroundColor: isSelected ? 'var(--primary-red)' : 'var(--bg-cards)',
                      color: isSelected ? '#fff' : 'var(--text-dark)',
                      border: isSelected ? 'none' : '1.5px solid #e0e0e0',
                    }}
                  >
                    <span className="text-base font-bold leading-none">{day.num}</span>
                    <span className="text-xs leading-none mt-0.5" style={{ opacity: isSelected ? 1 : 0.65 }}>{day.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Método de pago */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>Método de pago</label>
        <div className="flex gap-2">
          {([['coordinate', 'A coordinar'], ['prepaid', 'Prepago']] as [PaymentMethod, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setPaymentMethod(val)}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: paymentMethod === val ? 'var(--primary-red)' : 'var(--bg-cards)',
                color: paymentMethod === val ? '#fff' : 'var(--text-dark)',
                border: paymentMethod === val ? 'none' : '1.5px solid #e0e0e0',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dirección */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>Dirección</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ingresá tu dirección"
          className="w-full px-4 py-3 rounded-2xl text-[16px] border outline-none"
          style={{ borderColor: '#e0e0e0', backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)' }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full text-sm font-bold disabled:opacity-60"
        style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
      >
        {loading ? 'Enviando...' : 'Crear solicitud'}
      </button>
    </form>
  )
}
