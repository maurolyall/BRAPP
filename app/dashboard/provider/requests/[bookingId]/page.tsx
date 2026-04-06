import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import OfferForm from '@/components/dashboard/provider/OfferForm'

interface Props {
  params: Promise<{ bookingId: string }>
}

export default async function ProviderRequestDetailPage({ params }: Props) {
  const { bookingId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify provider has a matching category for this booking
  const [{ data: booking }, { data: myOffer }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, user_id, description, image_url, scheduled_date, payment_method, address, created_at, category_id, service_categories(name, icon_url), profiles!bookings_user_id_fkey(full_name, avatar_url, city)')
      .eq('id', bookingId)
      .in('status', ['searching', 'pending'])
      .single(),
    supabase
      .from('booking_offers')
      .select('id, message, price, status')
      .eq('booking_id', bookingId)
      .eq('provider_id', user!.id)
      .maybeSingle(),
  ])

  if (!booking) notFound()

  // Confirm the provider actually serves this category (extra security)
  const [{ data: catMatch }, { data: completedBookings }] = await Promise.all([
    supabase
      .from('provider_categories')
      .select('category_id')
      .eq('provider_id', user!.id)
      .eq('category_id', booking.category_id)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('id')
      .eq('user_id', booking.user_id)
      .eq('status', 'completed'),
  ])

  if (!catMatch) notFound()

  const category = (booking.service_categories as any)?.[0] as { name: string; icon_url: string | null } | null
  const profile = (booking.profiles as any)?.[0] as { full_name: string | null; avatar_url: string | null; city: string | null } | null
  const completedCount = (completedBookings ?? []).length
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const isToday = booking.scheduled_date === 'today'

  return (
    <div className="flex flex-col gap-5">
      {/* Category badge */}
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full self-start"
        style={{ backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        {category?.name ?? '—'}
      </span>

      {/* Request card — identical to list card */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        {/* User row */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {profile?.avatar_url ? (
              <div className="w-11 h-11 rounded-full overflow-hidden relative">
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? 'Usuario'}
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
              {profile?.full_name ?? 'Usuario'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {completedCount === 0
                ? 'Sin conexiones'
                : `${completedCount} trabajo${completedCount !== 1 ? 's' : ''} completado${completedCount !== 1 ? 's' : ''}`}
            </span>
          </div>

          {myOffer ? (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
            >
              Oferta enviada
            </span>
          ) : (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
            >
              Nueva
            </span>
          )}
        </div>

        {booking.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-dark)' }}>{booking.description}</p>
        )}

        <div className="flex items-center justify-between">
          {isToday ? (
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-red)', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: 'var(--primary-red)' }}>Hoy</span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>A coordinar</span>
          )}

          {profile?.city && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {profile.city}
            </span>
          )}
        </div>
      </div>

      {/* Image */}
      {booking.image_url && (
        <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', position: 'relative' }}>
          <Image
            src={booking.image_url}
            alt="Imagen del problema"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Offer section */}
      <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>
        {myOffer ? 'Tu oferta' : 'Enviar oferta'}
      </h2>

      <OfferForm
        bookingId={bookingId}
        providerId={user!.id}
        existingOffer={myOffer ?? null}
      />
    </div>
  )
}
