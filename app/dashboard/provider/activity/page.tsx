import { createServerClient } from '@/lib/supabaseServer'
import ProviderActivityList from '@/components/dashboard/provider/ProviderActivityList'

export default async function ProviderActivityPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Jobs where this provider was confirmed or completed
  const { data: myBookings } = await supabase
    .from('bookings')
    .select('id, user_id, status, scheduled_date, category_id, service_categories(name), profiles!bookings_user_id_fkey(full_name, avatar_url, city)')
    .eq('provider_id', user!.id)
    .in('status', ['confirmed', 'completed', 'cancelled'])
    .order('created_at', { ascending: false })

  // Pending confirmation: offer not rejected by client, booking is pending provider confirmation
  const { data: acceptedOffers } = await supabase
    .from('booking_offers')
    .select('id, booking_id')
    .eq('provider_id', user!.id)
    .neq('status', 'rejected')

  const pendingIds = (acceptedOffers ?? []).map((o) => o.booking_id)

  const { data: pendingBookings } = pendingIds.length > 0
    ? await supabase
        .from('bookings')
        .select('id, user_id, status, scheduled_date, category_id, service_categories(name), profiles!bookings_user_id_fkey(full_name, avatar_url, city)')
        .eq('status', 'pending')
        .in('id', pendingIds)
    : { data: [] }

  // Completed counts per client
  const allUserIds = [...new Set([
    ...(myBookings ?? []).map((b) => b.user_id),
    ...(pendingBookings ?? []).map((b) => b.user_id),
  ])]

  const { data: completedBookings } = allUserIds.length > 0
    ? await supabase
        .from('bookings')
        .select('user_id')
        .in('user_id', allUserIds)
        .eq('status', 'completed')
    : { data: [] }

  const completedCountByUser = (completedBookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.user_id] = (acc[b.user_id] ?? 0) + 1
    return acc
  }, {})

  type ActivityStatus = 'pending_confirmation' | 'confirmed' | 'completed' | 'cancelled'

  const mapBooking = (b: { id: string; user_id: string; scheduled_date: unknown; service_categories: unknown; profiles: unknown }, status: ActivityStatus) => {
    const profile = (b.profiles as any)?.[0] as { full_name: string | null; avatar_url: string | null; city: string | null } | null
    return {
      id: b.id,
      bookingId: b.id,
      status,
      category_name: (b.service_categories as any)?.[0]?.name ?? '—',
      client_name: profile?.full_name ?? null,
      client_avatar_url: profile?.avatar_url ?? null,
      client_city: profile?.city ?? null,
      completedCount: completedCountByUser[b.user_id] ?? 0,
      scheduled_date: b.scheduled_date as string | null,
    }
  }

  const pendingItems = (pendingBookings ?? []).map((b) => mapBooking(b as never, 'pending_confirmation'))
  const jobItems = (myBookings ?? []).map((b) => mapBooking(b as never, b.status as ActivityStatus))

  // Pending first, then jobs ordered by date
  const items = [...pendingItems, ...jobItems]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)' }}>Actividad</h1>
      <div className="animate-fade-in" style={{ animationDelay: '60ms' }}>
        <ProviderActivityList items={items} />
      </div>
    </div>
  )
}

