import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookingId, stars, tags, comment, anonymous } = await req.json()

  if (!bookingId || !stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  if (!tags || tags.length < 3) {
    return NextResponse.json({ error: 'Seleccioná al menos 3 etiquetas' }, { status: 400 })
  }

  const { error } = await supabase.from('reviews').insert({
    booking_id: bookingId,
    user_id: user.id,
    stars,
    tags,
    comment: comment || null,
    anonymous: anonymous ?? false,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya valoraste este servicio' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
