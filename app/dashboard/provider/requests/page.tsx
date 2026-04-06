import { createServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import Image from 'next/image'
import ProviderRequestsList from '@/components/dashboard/provider/ProviderRequestsList'

export default async function ProviderRequestsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get provider's service categories (with names for the select)
  const { data: providerCats } = await supabase
    .from('provider_categories')
    .select('category_id, service_categories(name)')
    .eq('provider_id', user!.id)

  const categoryIds = (providerCats ?? []).map((pc) => pc.category_id)

  if (categoryIds.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>Solicitudes</h1>
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
          style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
            No tenés rubros configurados
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Configurá tus servicios para empezar a ver solicitudes de clientes.
          </p>
          <Link
            href="/dashboard/provider/profile"
            className="mt-2 px-6 py-3 rounded-full text-sm font-bold"
            style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
          >
            Ir a Mi Perfil
          </Link>
        </div>
      </div>
    )
  }

  // Build category name map
  const categoryNameMap = (providerCats ?? []).reduce<Record<string, string>>((acc, pc) => {
    const rawCat = pc.service_categories as any
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat
    if (cat?.name) acc[pc.category_id] = cat.name
    return acc
  }, {})

  const categories = (providerCats ?? []).map((pc) => {
    const rawCat = pc.service_categories as any
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat
    return {
      id: pc.category_id,
      name: cat?.name ?? pc.category_id,
    }
  })

  // Fetch accepted offers waiting for this provider's confirmation
  const { data: pendingOffers } = await supabase
    .from('booking_offers')
    .select('booking_id')
    .eq('provider_id', user!.id)
    .eq('status', 'accepted')

  const pendingBookingIds = (pendingOffers ?? []).map((o) => o.booking_id)

  // Fetch open bookings + pending-confirmation bookings in parallel
  const [{ data: bookings }, { data: pendingBookings }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, user_id, description, scheduled_date, category_id, profiles!bookings_user_id_fkey(full_name, avatar_url, city)')
      .eq('status', 'searching')
      .in('category_id', categoryIds)
      .order('created_at', { ascending: false }),
    pendingBookingIds.length > 0
      ? supabase
          .from('bookings')
          .select('id, user_id, description, scheduled_date, category_id, profiles!bookings_user_id_fkey(full_name, avatar_url, city)')
          .eq('status', 'pending')
          .in('id', pendingBookingIds)
      : { data: [] },
  ])

  const bookingIds = (bookings ?? []).map((b) => b.id)
  const allUserIds = [...new Set([
    ...(bookings ?? []).map((b) => b.user_id),
    ...(pendingBookings ?? []).map((b) => b.user_id),
  ])]

  // Completed counts + existing offers — in parallel
  const [{ data: completedBookings }, { data: myOffers }] = await Promise.all([
    allUserIds.length > 0
      ? supabase
        .from('bookings')
        .select('user_id')
        .in('user_id', allUserIds)
        .eq('status', 'completed')
      : { data: [] },
    bookingIds.length > 0
      ? supabase
        .from('booking_offers')
        .select('booking_id')
        .eq('provider_id', user!.id)
        .in('booking_id', bookingIds)
      : { data: [] },
  ])

  const completedCountByUser = (completedBookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.user_id] = (acc[b.user_id] ?? 0) + 1
    return acc
  }, {})

  const offeredSet = new Set((myOffers ?? []).map((o) => o.booking_id))

  const requests = (bookings ?? []).map((b) => {
    const profile = (b.profiles as any)?.[0] as { full_name: string | null; avatar_url: string | null; city: string | null } | null
    return {
      id: b.id,
      description: b.description ?? null,
      scheduled_date: b.scheduled_date ?? null,
      city: profile?.city ?? null,
      category_id: b.category_id,
      category_name: categoryNameMap[b.category_id] ?? '—',
      user: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      completedCount: completedCountByUser[b.user_id] ?? 0,
      alreadyOffered: offeredSet.has(b.id),
    }
  })

  const pendingConfirmation = (pendingBookings ?? []).map((b) => {
    const profile = (b.profiles as any)?.[0] as { full_name: string | null; avatar_url: string | null; city: string | null } | null
    return {
      id: b.id,
      description: b.description ?? null,
      scheduled_date: b.scheduled_date ?? null,
      city: profile?.city ?? null,
      category_id: b.category_id,
      category_name: categoryNameMap[b.category_id] ?? '—',
      user: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      completedCount: completedCountByUser[b.user_id] ?? 0,
    }
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Promo banner */}
      <div className="dash-card overflow-hidden flex items-stretch animate-fade-in" style={{ minHeight: 120 }}>
        {/* Left: text */}
        <div className="flex flex-col justify-center gap-2 flex-1 pr-4" style={{ minWidth: 0 }}>
          <span className="text-lg font-bold leading-tight" style={{ color: 'var(--text-dark)' }}>
            ¡Muchas solicitudes!
          </span>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Hay más solicitudes de lo habitual. ¡Aprovéchalas!
          </span>
        </div>

        {/* Right: image */}
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

      {/* Pending confirmation section */}
      {pendingConfirmation.length > 0 && (
        <>
          <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '60ms' }}>Pendiente de tu confirmación</h2>
          <div className="flex flex-col gap-3">
            {pendingConfirmation.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/provider/requests/${r.id}`}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
              >
                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--text-dark)' }}>
                    {r.user.full_name ?? 'Usuario'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {r.category_name}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
                >
                  Confirmar
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {requests.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center animate-fade-in"
          style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '120ms' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
            No hay solicitudes por ahora
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Cuando un cliente busque tu tipo de servicio, aparecerá acá.
          </p>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ animationDelay: '120ms' }}>
          <ProviderRequestsList requests={requests} categories={categories} />
        </div>
      )}
    </div>
  )
}
