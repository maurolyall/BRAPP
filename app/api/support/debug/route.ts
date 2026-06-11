import { NextResponse } from 'next/server'
import { getMopSocket, getLastEvents } from '@/lib/mop-socket'

export async function GET() {
  const socket = getMopSocket()
  return NextResponse.json({
    connected: socket.connected,
    id: socket.id ?? null,
    lastEvents: getLastEvents(),
  })
}
