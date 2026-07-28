import { io, Socket } from 'socket.io-client'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { parseIncomingAttachments } from '@/lib/support-attachments'

declare global {
  // eslint-disable-next-line no-var
  var _mopSocket: Socket | undefined
  // eslint-disable-next-line no-var
  var _mopLastEvents: unknown[]
}

type MopBlock = { type: string; text?: string; attachments?: unknown }

type OutboundEvent = {
  schema: string
  eventId?: string
  payload: {
    externalUserId: string
    text?: string
    attachments?: unknown
    messages?: MopBlock[]
    blocks?: MopBlock[]
  }
}

export function getLastEvents() {
  return global._mopLastEvents ?? []
}

const recentBotReplies = new Map<string, number>()
const seenEventIds = new Map<string, number>()

function prune(map: Map<string, number>, ttl: number) {
  if (map.size <= 200) return
  const now = Date.now()
  for (const [key, time] of map) {
    if (now - time > ttl) map.delete(key)
  }
}

async function handleOutbound(evt: OutboundEvent) {
  if (!global._mopLastEvents) global._mopLastEvents = []
  global._mopLastEvents = [evt, ...global._mopLastEvents].slice(0, 10)
  console.log('[mop] raw event', JSON.stringify(evt))

  if (evt.schema !== 'mop.message.outbound/v1') return

  const userId = evt.payload.externalUserId
  const text =
    evt.payload.text ??
    evt.payload.messages?.find((m) => m.type === 'text')?.text ??
    evt.payload.blocks?.find((b) => b.type === 'text')?.text ??
    ''

  // Los adjuntos llegan como URLs públicas — normalmente en payload.attachments,
  // pero toleramos la variante anidada en messages[]/blocks[].
  const attachments = [
    ...parseIncomingAttachments(evt.payload.attachments),
    ...(evt.payload.messages ?? []).flatMap((m) => parseIncomingAttachments(m.attachments)),
    ...(evt.payload.blocks ?? []).flatMap((b) => parseIncomingAttachments(b.attachments)),
  ]

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!userId || !uuidRegex.test(userId)) {
    console.warn('[mop] outbound ignored — externalUserId is not a uuid:', userId)
    return
  }

  console.log('[mop] outbound → userId:', userId, '| text:', text, '| adjuntos:', attachments.length)

  if (!text && attachments.length === 0) {
    console.warn('[mop] outbound sin texto ni adjuntos, skipping insert')
    return
  }

  const now = Date.now()

  // Dedupe primario: eventId (el server reenvía el mismo evento en reconexiones).
  if (evt.eventId) {
    if (seenEventIds.has(evt.eventId)) {
      console.log('[mop] evento duplicado ignorado', evt.eventId)
      return
    }
    seenEventIds.set(evt.eventId, now)
    prune(seenEventIds, 10 * 60 * 1000)
  } else {
    // Fallback para eventos sin eventId: mismo contenido en una ventana corta.
    const dedupKey = `${userId}:${text}:${attachments.map((a) => a.url).join(',')}`
    const lastTime = recentBotReplies.get(dedupKey)
    if (lastTime && now - lastTime < 5000) {
      console.log('[mop] duplicate bot reply skipped for user', userId)
      return
    }
    recentBotReplies.set(dedupKey, now)
    prune(recentBotReplies, 30000)
  }

  const admin = createAdminClient()
  const { error } = await admin.from('support_messages').insert({
    user_id: userId,
    sender_id: userId,
    content: text,
    is_bot: true,
    attachments: attachments.length > 0 ? attachments : null,
    mop_event_id: evt.eventId ?? null,
  })

  // 23505 = unique_violation sobre mop_event_id: el evento ya se guardó
  // (p. ej. tras un reinicio del proceso, con el cache en memoria vacío).
  if (error?.code === '23505') console.log('[mop] evento ya persistido', evt.eventId)
  else if (error) console.error('[mop] error saving bot reply', error.message)
  else console.log('[mop] bot reply saved for user', userId)
}

export function getMopSocket(): Socket {
  // `active` es true mientras socket.io está reintentando la reconexión: en esa
  // ventana hay que devolver el socket existente, no crear uno nuevo. Los emits
  // quedan encolados y salen al reconectar. Solo recreamos si la conexión murió
  // de verdad (nunca existió, o el server la rechazó y ya no reintenta).
  if (global._mopSocket?.connected || global._mopSocket?.active) return global._mopSocket

  if (global._mopSocket) {
    global._mopSocket.removeAllListeners()
    global._mopSocket.disconnect()
  }

  const socket = io(process.env.MOP_SOCKET_URL ?? 'wss://socket.momentofpeople.com', {
    path: '/v1/socket/',
    transports: ['websocket'],
    auth: { key: process.env.MOP_API_KEY },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on('connect', () => console.log('[mop] connected', socket.id))
  socket.on('disconnect', (reason) => console.warn('[mop] disconnected', reason))
  socket.on('connect_error', (err) => console.error('[mop] connect_error', err.message))
  socket.on('hello', (info) => console.log('[mop] hello', JSON.stringify(info)))
  socket.on('event', handleOutbound)

  global._mopSocket = socket
  return socket
}
