'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function acceptOffer(offerId: string, bookingId: string) {
  const supabase = createAdminClient()

  await Promise.all([
    supabase.from('booking_offers').update({ status: 'accepted' }).eq('id', offerId),
    supabase.from('bookings').update({ status: 'pending' }).eq('id', bookingId),
  ])

  revalidatePath(`/dashboard/client/bookings/${bookingId}`)
}

export async function confirmOffer(offerId: string, bookingId: string, providerId: string) {
  const supabase = createAdminClient()

  await Promise.all([
    supabase.from('bookings').update({ status: 'confirmed', provider_id: providerId }).eq('id', bookingId),
    supabase.from('booking_offers').update({ status: 'rejected' }).eq('booking_id', bookingId).neq('id', offerId),
  ])

  revalidatePath(`/dashboard/provider/requests/${bookingId}`)
  revalidatePath(`/dashboard/client/bookings/${bookingId}`)
}

export async function rejectOffer(offerId: string, bookingId: string) {
  const supabase = createAdminClient()

  await Promise.all([
    supabase.from('booking_offers').update({ status: 'rejected' }).eq('id', offerId),
    supabase.from('bookings').update({ status: 'searching' }).eq('id', bookingId),
  ])

  revalidatePath(`/dashboard/provider/requests/${bookingId}`)
  revalidatePath(`/dashboard/client/bookings/${bookingId}`)
}
