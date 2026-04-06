import { createServerClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import ChatWindow from '@/components/dashboard/ChatWindow'

interface Props {
  params: Promise<{ bookingId: string }>
}

export default async function ClientChatPage({ params }: Props) {
  const { bookingId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify the current user is the client of this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, provider_id, service_categories(name), profiles!bookings_provider_id_fkey(full_name, avatar_url)')
    .eq('id', bookingId)
    .eq('user_id', user!.id)
    .single()

  if (!booking) notFound()

  const rawProfile = booking.profiles as any
  const providerProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as { full_name: string | null; avatar_url: string | null } | null
  const otherUserName = providerProfile?.full_name ?? 'Proveedor'
  const otherUserAvatar = providerProfile?.avatar_url ?? null
  const rawCat = booking.service_categories as any
  const category = (Array.isArray(rawCat) ? rawCat[0] : rawCat)?.name ?? '—'

  // Load existing messages for this chat
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, booking_id')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  return (
    <ChatWindow
      initialMessages={messages ?? []}
      currentUserId={user!.id}
      otherUserId={booking.provider_id ?? ''}
      otherUserName={otherUserName}
      otherUserAvatar={otherUserAvatar}
      category={category}
      bookingId={bookingId}
      backHref={`/dashboard/client/bookings/${bookingId}`}
    />
  )
}
