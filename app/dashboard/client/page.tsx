import { createServerClient } from '@/lib/supabaseServer'
import Image from 'next/image'
import Link from 'next/link'
import { ACTIVE_STATUSES, DATE_LABEL, ROADMAP_STEPS, STATUS_LABEL } from '@/lib/bookingConstants'

export default async function ClientHomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: booking }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase
      .from('bookings')
      .select('id, status, scheduled_date, address, description, service_categories(name)')
      .eq('user_id', user!.id)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const { data: offerRows } = booking
    ? await supabase.from('booking_offers').select('id').eq('booking_id', booking.id)
    : { data: [] }

  const offerCount = (offerRows ?? []).length
  const category = (booking?.service_categories as any)?.[0]?.name ?? '—'
  const status = booking?.status as string | undefined
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)' }}>
        Hola, {firstName} 👋
      </p>
      {booking ? (
        <>
          <h2 className="text-base font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '60ms' }}>Servicio actual</h2>

          {/* Card resumen (igual a actividad) */}
          <Link
            href={`/dashboard/client/bookings/${booking.id}`}
            className="rounded-2xl p-4 flex flex-col gap-2 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '120ms' }}
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
              ) : offerCount > 0 ? (
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
                  Activa
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {status === 'confirmed'
                  ? 'Trabajo en curso'
                  : status === 'pending'
                    ? 'Esperando confirmación del proveedor'
                    : offerCount > 0
                      ? `${offerCount} oferta${offerCount !== 1 ? 's' : ''} recibida${offerCount !== 1 ? 's' : ''}`
                      : (STATUS_LABEL[status!] ?? status)}
              </span>
              {booking.scheduled_date && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {DATE_LABEL[booking.scheduled_date as string] ?? booking.scheduled_date}
                </span>
              )}
            </div>
          </Link>

          {/* Card estado (roadmap) */}
          <div
            className="rounded-2xl p-4 flex gap-4 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '180ms' }}
          >
            <div className="flex flex-col flex-1">
              {ROADMAP_STEPS.map((step, i) => {
                const roadmapStatus = (offerCount > 0 && status === 'searching') ? 'pending' : status
                const isCurrent = step.key === roadmapStatus
                const isPast = ROADMAP_STEPS.findIndex(s => s.key === roadmapStatus) > i
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
                src={status === 'confirmed' ? '/icons/check.svg' : (offerCount > 0 && status === 'searching') ? '/icons/ENCONTRADO-2.svg' : '/icons/DUDA-2.svg'}
                alt="Estado"
                width={120}
                height={120}
                className="w-full h-auto"
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
