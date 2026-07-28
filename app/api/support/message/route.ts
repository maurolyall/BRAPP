import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabaseServer'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { getMopSocket } from '@/lib/mop-socket'
import {
  ATTACHMENT_ONLY_TEXT,
  MAX_TEXT_LENGTH,
  SupportAttachment,
  validateUploads,
} from '@/lib/support-attachments'
import { normalizeArPhone } from '@/lib/phone'

const BUCKET = 'support-attachments'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const content: string = typeof body?.content === 'string' ? body.content.trim() : ''

  const validation = validateUploads(body?.attachments)
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
  const uploads = validation.attachments

  if (!content && uploads.length === 0) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }
  if (content.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Mensaje demasiado largo' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch profile for user context sent to MoP
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  // MoP guarda los adjuntos que manda el operador y nos devuelve URLs; los que
  // manda el usuario los subimos acá para poder pintarlos en su propio hilo.
  const stored: SupportAttachment[] = []
  for (const att of uploads) {
    const path = `${user.id}/${crypto.randomUUID()}-${att.filename}`
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(att.data, 'base64'), { contentType: att.mime, upsert: false })

    if (uploadError) {
      console.error('[support] error subiendo adjunto', uploadError.message)
      return NextResponse.json({ error: 'No pudimos subir el archivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
    stored.push({ type: att.type, url: publicUrl, mime: att.mime, filename: att.filename })
  }

  // Save user message
  const { data: inserted, error: insertError } = await admin
    .from('support_messages')
    .insert({
      user_id: user.id,
      sender_id: user.id,
      content,
      is_bot: false,
      attachments: stored.length > 0 ? stored : null,
    })
    .select('id, user_id, sender_id, content, created_at, is_bot, attachments')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Emit to MoP — el archivo viaja embebido en base64 dentro del mismo
  // client_event (mop.client.message.inbound/v1). `text` es requerido.
  const socket = getMopSocket()
  const phone = normalizeArPhone(profile?.phone)
  const payload = {
    schema: 'mop.client.message.inbound/v1',
    idempotencyKey: crypto.randomUUID(),
    payload: {
      externalUserId: user.id,
      // MoP exige phone o email — el CRM rechaza el contacto sin al menos uno.
      // Mandamos el teléfono solo si es válido: un número inventado ensucia el
      // CRM y hace que todos los usuarios sin teléfono colapsen en un contacto.
      user: {
        name: profile?.full_name ?? 'Usuario',
        ...(phone && { phone }),
        ...(user.email && { email: user.email }),
      },
      text: content || ATTACHMENT_ONLY_TEXT,
      ...(uploads.length > 0 && {
        attachments: uploads.map((a) => ({
          type: a.type,
          data: a.data,
          mime: a.mime,
          filename: a.filename,
        })),
      }),
    },
  }

  socket.emit('client_event', payload, (ack: unknown) => {
    console.log('[mop] ack', JSON.stringify(ack))
  })

  return NextResponse.json({ ok: true, id: inserted.id, message: inserted })
}
