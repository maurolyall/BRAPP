import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import BookingImageModal from '@/components/dashboard/client/BookingImageModal'
import { DATE_LABEL, ROADMAP_STEPS } from '@/lib/bookingConstants'

interface Props {
  params: Promise<{ bookingId: string }>
}

export default async function ProviderBookingDetailPage({ params }: Props) {
  const { bookingId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, service_categories(name), profiles!bookings_user_id_fkey(full_name, email, phone, avatar_url, city)')
    .eq('id', bookingId)
    .eq('provider_id', user!.id)
    .single()

  if (!booking) notFound()

  const rawProfile = booking.profiles as any
  const clientProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as {
    full_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    city: string | null
  } | null

  const { data: completedBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', booking.user_id)
    .eq('status', 'completed')

  const rawCat = booking.service_categories as any
  const category = (Array.isArray(rawCat) ? rawCat[0] : rawCat)?.name ?? '—'
  const client = clientProfile?.full_name ?? 'Cliente'
  const status = booking.status as string
  const completedCount = (completedBookings ?? []).length
  const initials = clientProfile?.full_name
    ? clientProfile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    confirmed:  { label: 'En curso',   bg: 'var(--primary-red)', color: '#fff' },
    completed:  { label: 'Completado', bg: '#f3f3f3',            color: 'var(--text-muted)' },
    cancelled:  { label: 'Cancelado',  bg: '#f3f3f3',            color: 'var(--text-muted)' },
  }
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE['confirmed']

  return (
    <div className="flex flex-col gap-5">
      {/* Card resumen */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
            {category}
          </span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{client}</span>

        {booking.address && (
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {booking.address}
          </span>
        )}

        {booking.description && (
          <span className="text-xs" style={{ color: 'var(--text-dark)' }}>
            {booking.description}
          </span>
        )}

        {booking.scheduled_date && (
          <div className="flex justify-end pt-1">
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {DATE_LABEL[booking.scheduled_date] ?? booking.scheduled_date}
            </span>
          </div>
        )}
      </div>

      {/* Imagen */}
      {booking.image_url && (
        <BookingImageModal imageUrl={booking.image_url} />
      )}

      {/* Estado */}
      <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Estado</h2>

      <div
        className="rounded-2xl p-4 flex gap-4"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        <div className="flex flex-col flex-1">
          {ROADMAP_STEPS.map((step, i) => {
            const isCurrent = step.key === status
            const isPast = ROADMAP_STEPS.findIndex(s => s.key === status) > i
            const isLast = i === ROADMAP_STEPS.length - 1
            return (
              <div key={step.key} className="flex gap-3" style={{ flex: isLast ? '0 0 auto' : '1 1 0' }}>
                <div className="flex flex-col items-center" style={{ width: 14 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: isCurrent || isPast ? 'var(--primary-red)' : 'var(--color-inactive)',
                    }}
                  />
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, backgroundColor: isPast ? 'var(--primary-red)' : 'var(--color-inactive)' }} />
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{
                    color: isCurrent ? 'var(--text-dark)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 700 : 400,
                    paddingTop: 1,
                  }}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center" style={{ width: '45%' }}>
          <Image
            src={status === 'confirmed' ? '/icons/check.svg' : '/icons/ENCONTRADO-2.svg'}
            alt="Estado"
            width={120}
            height={120}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Contacto */}
      <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Contacto</h2>

      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        {/* User row */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {clientProfile?.avatar_url ? (
              <div className="w-11 h-11 rounded-full overflow-hidden relative">
                <Image
                  src={clientProfile.avatar_url}
                  alt={client}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: 'var(--primary-red)' }}
              >
                {initials}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-bold truncate" style={{ color: 'var(--text-dark)' }}>
              {client}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {completedCount === 0
                ? 'Sin conexiones'
                : `${completedCount} trabajo${completedCount !== 1 ? 's' : ''} completado${completedCount !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {clientProfile?.city && (
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{clientProfile.city}</span>
          </div>
        )}

        <a
          href={`/dashboard/provider/chat/${bookingId}`}
          className="w-full py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Abrir chat
        </a>
      </div>
    </div>
  )
}
