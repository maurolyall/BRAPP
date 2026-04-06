import { createServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import Image from 'next/image'
import { DATE_LABEL } from '@/lib/bookingConstants'

export default async function ProviderHomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: pendingBooking }, { data: confirmedBooking }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase
      .from('bookings')
      .select('id, status, scheduled_date, category_id, service_categories(name), profiles!bookings_user_id_fkey(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('id, user_id, status, scheduled_date, category_id, service_categories(name), profiles!bookings_user_id_fkey(full_name, avatar_url, city)')
      .eq('provider_id', user!.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const hasPending = !!pendingBooking
  const hasConfirmed = !!confirmedBooking
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const { data: clientCompletedBookings } = hasConfirmed && confirmedBooking.user_id
    ? await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', confirmedBooking.user_id)
      .eq('status', 'completed')
    : { data: [] }
  const clientCompletedCount = (clientCompletedBookings ?? []).length

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)' }}>
        Hola, {firstName} 👋
      </p>

      {/* Promo banner */}
      <div className="dash-card overflow-hidden flex items-stretch animate-fade-in" style={{ minHeight: 120, animationDelay: '60ms' }}>
        <div className="flex flex-col justify-center gap-2 flex-1 pr-4" style={{ minWidth: 0 }}>
          <span className="text-lg font-bold leading-tight" style={{ color: 'var(--text-dark)' }}>
            ¡Muchas solicitudes!
          </span>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Hay más solicitudes de lo habitual. ¡Aprovéchalas!
          </span>
        </div>
        <div className="flex items-end justify-end flex-shrink-0" style={{ width: 100 }}>
          <Image
            src="/icons/proveedor-creado.svg"
            alt="Proveedor"
            width={100}
            height={100}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Pending confirmation */}
      {hasPending && (() => {
        const rawCat = pendingBooking.service_categories as any
        const cat = (Array.isArray(rawCat) ? rawCat[0] : rawCat)?.name ?? '—'
        const rawProfile = pendingBooking.profiles as any
        const client = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile)?.full_name ?? 'Cliente'
        return (
          <>
            <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '120ms' }}>Pendiente de tu confirmación</h2>
            <Link
              href={`/dashboard/provider/requests/${pendingBooking.id}`}
              className="rounded-2xl p-4 flex flex-col gap-2 animate-fade-in"
              style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '180ms' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>{cat}</span>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
                >
                  Confirmar
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{client}</span>
                {pendingBooking.scheduled_date && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {DATE_LABEL[pendingBooking.scheduled_date as string] ?? pendingBooking.scheduled_date}
                  </span>
                )}
              </div>
            </Link>
          </>
        )
      })()}

      {/* Confirmed job in progress */}
      {hasConfirmed && (() => {
        const rawCat = confirmedBooking.service_categories as any
        const cat = (Array.isArray(rawCat) ? rawCat[0] : rawCat)?.name ?? '—'
        const rawProfile = confirmedBooking.profiles as any
        const clientProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as { full_name: string | null; avatar_url: string | null; city: string | null } | null
        const initials = clientProfile?.full_name
          ? clientProfile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
          : '?'
        return (
          <>
            <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '120ms' }}>Trabajo en curso</h2>
            <Link
              href={`/dashboard/provider/activity/${confirmedBooking.id}`}
              className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in"
              style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '180ms' }}
            >
              {/* User row */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {clientProfile?.avatar_url ? (
                    <div className="w-11 h-11 rounded-full overflow-hidden relative">
                      <Image src={clientProfile.avatar_url} alt={clientProfile.full_name ?? 'Cliente'} fill className="object-cover" />
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
                    {clientProfile?.full_name ?? 'Cliente'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {clientCompletedCount === 0
                      ? 'Sin conexiones'
                      : `${clientCompletedCount} trabajo${clientCompletedCount !== 1 ? 's' : ''} completado${clientCompletedCount !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
                >
                  En curso
                </span>
              </div>

              {/* Category + city */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{cat}</span>
                {clientProfile?.city && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {clientProfile.city}
                  </span>
                )}
              </div>
            </Link>
          </>
        )
      })()}

      {/* Empty state */}
      {!hasPending && !hasConfirmed && (
        <div className="flex flex-col items-center gap-4 pt-8 animate-fade-in" style={{ animationDelay: '120ms' }}>
          <Image
            src="/icons/DUDA-2.svg"
            alt="Sin actividad"
            width={200}
            height={200}
            className="w-3/5 h-auto"
          />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Sin actividad por ahora</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Cuando un cliente acepte tu oferta, aparecerá acá.
            </p>
          </div>
          <Link
            href="/dashboard/provider/requests"
            className="px-6 py-3 rounded-full text-sm font-bold"
            style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
          >
            Ver solicitudes
          </Link>
        </div>
      )}
    </div>
  )
}
