import { createServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import AdSlider from '@/components/dashboard/AdSlider'
import HomeHero from '@/components/dashboard/client/HomeHero'
import { DATE_LABEL } from '@/lib/bookingConstants'

export default async function ClientHomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: lastBooking }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase
      .from('bookings')
      .select('id, scheduled_date, description, service_categories(name)')
      .eq('user_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Solo mostrar el sheet si el booking no tiene valoración aún
  let showRatingFor = null
  if (lastBooking) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', lastBooking.id)
      .maybeSingle()

    if (!existingReview) {
      const categoryName = (Array.isArray(lastBooking.service_categories)
        ? lastBooking.service_categories[0]?.name
        : (lastBooking.service_categories as any)?.name) ?? 'Servicio'

      showRatingFor = {
        id: lastBooking.id,
        categoryName,
        description: lastBooking.description as string | null,
        scheduledDate: lastBooking.scheduled_date
          ? (DATE_LABEL[lastBooking.scheduled_date as string] ?? lastBooking.scheduled_date)
          : null,
      }
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-5">

      {/* Saludo + ilustración */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-dark)' }}>
          ¡Hola, {firstName || 'vecino'}!
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿En qué te puedo ayudar?
        </p>
      </div>

      <HomeHero lastCompletedBooking={showRatingFor} />

      {/* Buscador */}
      <Link
        href="/dashboard/client/chat"
        className="flex items-center gap-3 px-4 py-3.5 rounded-full"
        style={{
          backgroundColor: 'var(--bg-cards)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 28, height: 28, border: '2px solid var(--text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11" />
            <line x1="1" y1="6" x2="11" y2="6" />
          </svg>
        </div>
        <span className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿Qué servicio necesitás?
        </span>
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 34, height: 34, backgroundColor: 'var(--primary-red)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
      </Link>

      {/* Publicidad */}
      <AdSlider />
    </div>
  )
}
