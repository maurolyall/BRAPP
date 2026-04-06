import { createServerClient } from '@/lib/supabaseServer'
import BookingList from '@/components/dashboard/client/BookingList'

export default async function ClientActivityPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, scheduled_date, address, created_at, service_categories(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const bookingIds = (bookings ?? []).map((b) => b.id)

  const { data: offerRows } = bookingIds.length > 0
    ? await supabase.from('booking_offers').select('booking_id').in('booking_id', bookingIds)
    : { data: [] }

  const offerCountMap = (offerRows ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.booking_id] = (acc[o.booking_id] ?? 0) + 1
    return acc
  }, {})

  const mapped = (bookings ?? []).map((b) => ({
    id: b.id,
    status: b.status as string,
    scheduled_date: b.scheduled_date as string | null,
    address: b.address as string | null,
    created_at: b.created_at,
    category_name: (b.service_categories as any)?.[0]?.name ?? '—',
    offerCount: offerCountMap[b.id] ?? 0,
  }))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)' }}>Actividad</h1>
      <div className="animate-fade-in" style={{ animationDelay: '60ms' }}>
        <BookingList bookings={mapped} />
      </div>
    </div>
  )
}
