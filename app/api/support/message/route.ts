import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getMopSocket } from '@/lib/mop-socket'

function toE164(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return null
  if (phone.startsWith('+')) return `+${digits}`
  if (digits.startsWith('54')) return `+${digits}`
  return `+54${digits}`
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch profile for user context sent to MoP
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  // Save user message
  const { data: inserted, error: insertError } = await admin
    .from('support_messages')
    .insert({ user_id: user.id, sender_id: user.id, content: content.trim(), is_bot: false })
    .select('id')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Emit to MoP
  const socket = getMopSocket()
  const payload = {
    schema: 'mop.client.message.inbound/v1',
    idempotencyKey: crypto.randomUUID(),
    payload: {
      externalUserId: user.id,
      user: {
        name: profile?.full_name ?? 'Usuario',
        phone: toE164(profile?.phone) ?? '+5400000000000',
      },
      text: content.trim(),
    },
  }

  socket.emit('client_event', payload, (ack: unknown) => {
    console.log('[mop] ack', JSON.stringify(ack))
  })

  return NextResponse.json({ ok: true, id: inserted.id })
}
