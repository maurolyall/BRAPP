import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import BookingImageModal from '@/components/dashboard/client/BookingImageModal'
import AcceptOfferButton from '@/components/dashboard/client/AcceptOfferButton'
import { ACTIVE_STATUSES, DATE_LABEL, ROADMAP_STEPS } from '@/lib/bookingConstants'

interface Props {
  params: Promise<{ bookingId: string }>
  searchParams: Promise<{ new?: string }>
}


export default async function BookingDetailPage({ params, searchParams }: Props) {
  const { bookingId } = await params
  const { new: isNew } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: booking }, { data: offers }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, service_categories(name), profiles!bookings_provider_id_fkey(full_name, avatar_url, city, phone)')
      .eq('id', bookingId)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('booking_offers')
      .select('id, provider_id, price, status, created_at, profiles(full_name, avatar_url)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false }),
  ])

  if (!booking) notFound()

  const category = (booking.service_categories as any)?.[0]?.name ?? '—'
  const status = booking.status as string
  const isConfirmed = status === 'confirmed'
  const offerCount = (offers ?? []).length
  const hasOffers = offerCount > 0 && status === 'searching'

  // Provider info (only relevant when confirmed)
  const providerProfile = (booking.profiles as any)?.[0] as {
    full_name: string | null
    avatar_url: string | null
    city: string | null
    phone: string | null
  } | null

  const providerInitials = providerProfile?.full_name
    ? providerProfile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const { data: providerCompletedBookings } = isConfirmed && booking.provider_id
    ? await supabase
        .from('bookings')
        .select('id')
        .eq('provider_id', booking.provider_id)
        .eq('status', 'completed')
    : { data: [] }

  const providerCompletedCount = (providerCompletedBookings ?? []).length

  // Fetch provider_categories for professional_description and visit_price
  const providerIds = (offers ?? []).map((o) => o.provider_id).filter(Boolean)
  const { data: providerCats } = providerIds.length > 0
    ? await supabase
        .from('provider_categories')
        .select('provider_id, professional_description, visit_price')
        .in('provider_id', providerIds)
        .eq('category_id', booking.category_id)
    : { data: [] }

  const providerCatMap = (providerCats ?? []).reduce<Record<string, { professional_description: string | null; visit_price: number | null }>>((acc, pc) => {
    acc[pc.provider_id] = { professional_description: pc.professional_description, visit_price: pc.visit_price }
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-5">
      {/* Header con ícono — solo al crear */}
      {isNew === '1' && (
        <div
          className="rounded-2xl py-8 px-4 flex flex-col items-center gap-3 animate-scale-in"
          style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
        >
          <Image
            src="/icons/boton-happy.svg"
            alt="Solicitud"
            width={300}
            height={300}
            className="w-4/5 h-auto"
          />
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>
              ¡Solicitud generada!
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ya estamos buscando proveedores para vos.
            </p>
          </div>
        </div>
      )}

      {/* Card resumen — igual a la de actividad */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-2 animate-fade-in"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: isNew === '1' ? '120ms' : '0ms' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
            {category}
          </span>
          {status === 'confirmed' ? (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
            >
              En curso
            </span>
          ) : status === 'pending' ? (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#f3f3f3', color: 'var(--text-muted)' }}
            >
              Esperando proveedor
            </span>
          ) : hasOffers ? (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
            >
              Oferta recibida
            </span>
          ) : (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
            >
              {ACTIVE_STATUSES.includes(status) ? 'Activa' : 'Completada'}
            </span>
          )}
        </div>

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

      {/* Acciones — ocultas cuando está confirmada */}
      {!isConfirmed && (
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <button
            className="flex-1 py-3 rounded-full text-sm font-bold border"
            style={{ borderColor: 'var(--primary-red)', color: 'var(--primary-red)', backgroundColor: 'transparent' }}
          >
            Editar
          </button>
          <button
            className="flex-1 py-3 rounded-full text-sm font-bold"
            style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Estado */}
      <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '80ms' }}>Estado</h2>

      <div
        className="rounded-2xl p-4 flex gap-4 animate-fade-in"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '120ms' }}
      >
        {/* Roadmap */}
        <div className="flex flex-col flex-1">
          {ROADMAP_STEPS.map((step, i) => {
            const roadmapStatus = hasOffers && status === 'searching' ? 'pending' : status
            const isCurrent = step.key === roadmapStatus
            const isPast = ROADMAP_STEPS.findIndex(s => s.key === roadmapStatus) > i
            const isLast = i === ROADMAP_STEPS.length - 1
            const label = step.label
            return (
              <div key={step.key} className="flex gap-3" style={{ flex: isLast ? '0 0 auto' : '1 1 0' }}>
                {/* Punto + línea */}
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
                {/* Label */}
                <span
                  className="text-xs"
                  style={{
                    color: isCurrent ? 'var(--text-dark)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 700 : 400,
                    paddingTop: 1,
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Imagen */}
        <div className="flex items-center justify-center" style={{ width: '45%' }}>
          <Image
            src={status === 'confirmed' ? '/icons/check.svg' : hasOffers ? '/icons/ENCONTRADO-2.svg' : '/icons/DUDA-2.svg'}
            alt="Estado"
            width={120}
            height={120}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Proveedor (cuando confirmada) o Ofertas */}
      {isConfirmed ? (
        <>
          <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '180ms' }}>Proveedor</h2>

          <div
            className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '220ms' }}
          >
            {/* Provider row */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {providerProfile?.avatar_url ? (
                  <div className="w-11 h-11 rounded-full overflow-hidden relative">
                    <Image
                      src={providerProfile.avatar_url}
                      alt={providerProfile.full_name ?? 'Proveedor'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: 'var(--primary-red)' }}
                  >
                    {providerInitials}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-bold truncate" style={{ color: 'var(--text-dark)' }}>
                  {providerProfile?.full_name ?? 'Proveedor'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {providerCompletedCount === 0
                    ? 'Sin conexiones'
                    : `${providerCompletedCount} trabajo${providerCompletedCount !== 1 ? 's' : ''} completado${providerCompletedCount !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {providerProfile?.city && (
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{providerProfile.city}</span>
              </div>
            )}

            <a
              href={`/dashboard/client/chat/${bookingId}`}
              className="w-full py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-success)', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Abrir chat
            </a>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '180ms' }}>Ofertas</h2>

          <div
            className="rounded-2xl p-4 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '220ms' }}
          >
            {!offers || offers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin ofertas todavía</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {offers.map((offer) => {
                  const provider = (offer.profiles as any)?.[0] as { full_name: string | null; avatar_url: string | null } | null
                  const providerCat = providerCatMap[offer.provider_id]
                  const initials = provider?.full_name
                    ? provider.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                    : '?'
                  const canAccept = offer.status === 'pending' && status === 'searching'
                  return (
                    <div key={offer.id} className="flex flex-col gap-3 pb-4 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'var(--bg-body)' }}>
                      {/* Provider row */}
                      <div className="flex items-center gap-3">
                        {provider?.avatar_url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                            <Image src={provider.avatar_url} alt={provider.full_name ?? 'Proveedor'} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: 'var(--primary-red)' }}
                          >
                            {initials}
                          </div>
                        )}
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                          {provider?.full_name ?? 'Proveedor'}
                        </span>
                      </div>

                      {/* Professional description */}
                      {providerCat?.professional_description && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {providerCat.professional_description}
                        </p>
                      )}

                      {/* Prices */}
                      <div className="flex">
                        {offer.price != null && (
                          <div className="flex flex-col gap-0.5 flex-1 items-center">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Oferta</span>
                            <span className="text-sm font-bold" style={{ color: 'var(--primary-red)' }}>
                              ${offer.price.toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                        {providerCat?.visit_price != null && (
                          <div className="flex flex-col gap-0.5 flex-1 items-center">
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Precio de visita</span>
                            <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
                              ${providerCat.visit_price.toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Accept button */}
                      {canAccept && (
                        <AcceptOfferButton offerId={offer.id} bookingId={bookingId} />
                      )}

                      {/* Waiting for provider confirmation */}
                      {status === 'pending' && offer.status !== 'rejected' && (
                        <div
                          className="w-full py-3 rounded-full text-sm font-bold text-center"
                          style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }}
                        >
                          Esperando confirmación del proveedor
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
