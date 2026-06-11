import { io, Socket } from 'socket.io-client'
import { createAdminClient } from '@/lib/supabaseAdmin'

declare global {
  // eslint-disable-next-line no-var
  var _mopSocket: Socket | undefined
  // eslint-disable-next-line no-var
  var _mopLastEvents: unknown[]
}

type OutboundEvent = {
  schema: string
  payload: {
    externalUserId: string
    text?: string
    messages?: Array<{ type: string; text?: string }>
    blocks?: Array<{ type: string; text?: string }>
  }
}

export function getLastEvents() {
  return global._mopLastEvents ?? []
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

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!userId || !uuidRegex.test(userId)) {
    console.warn('[mop] outbound ignored — externalUserId is not a uuid:', userId)
    return
  }

  console.log('[mop] outbound → userId:', userId, '| text:', text)

  if (!text) {
    console.warn('[mop] outbound missing text, skipping insert')
    return
  }

  const admin = createAdminClient()
  const { error } = await admin.from('support_messages').insert({
    user_id: userId,
    sender_id: userId,
    content: text,
    is_bot: true,
  })

  if (error) console.error('[mop] error saving bot reply', error.message)
  else console.log('[mop] bot reply saved for user', userId)
}

export function getMopSocket(): Socket {
  if (global._mopSocket?.connected) return global._mopSocket

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
