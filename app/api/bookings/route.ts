import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoryId, address, scheduledDate, description, paymentMethod } = await req.json()

  if (!categoryId || !address) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase.from('bookings').insert({
    user_id: user.id,
    category_id: categoryId,
    status: 'searching',
    address,
    scheduled_date: scheduledDate ?? 'coordinate',
    description: description ?? null,
    payment_method: paymentMethod ?? 'coordinate',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id })
}
