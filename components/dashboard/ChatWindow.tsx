'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'

interface MessageRow {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  booking_id: string
}

interface Props {
  initialMessages: MessageRow[]
  currentUserId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar: string | null
  category: string
  bookingId: string
  backHref: string
}

// Rendered only client-side to avoid SSR/client locale mismatch (hydration error)
function MessageTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const d = new Date(iso)
    setLabel(d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  }, [iso])

  if (!label) return null
  return (
    <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
      {label}
    </span>
  )
}

export default function ChatWindow({
  initialMessages,
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  category,
  bookingId,
  backHref,
}: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')

    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
    })

    setSending(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const initials = otherUserName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 280px)', minHeight: 320 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 mb-4 rounded-2xl px-3 py-3"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      >
        <a
          href={backHref}
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--bg-body)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--text-dark)' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>

        {otherUserAvatar ? (
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden relative">
            <Image
              src={otherUserAvatar}
              alt={otherUserName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--primary-red)' }}
          >
            {initials}
          </div>
        )}

        <div className="flex flex-col gap-0 flex-1 min-w-0">
          <span
            className="text-sm font-bold truncate"
            style={{ color: 'var(--text-dark)' }}
          >
            {otherUserName}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {category}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Iniciá la conversación
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="flex flex-col gap-0.5 max-w-[75%]"
                style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}
              >
                <div
                  className="px-3 py-2 rounded-2xl text-sm"
                  style={{
                    backgroundColor: isOwn ? 'var(--primary-red)' : 'var(--bg-cards)',
                    color: isOwn ? '#fff' : 'var(--text-dark)',
                    borderRadius: isOwn
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    boxShadow: isOwn ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {msg.content}
                </div>
                <MessageTime iso={msg.created_at} />
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 pt-4 mt-1"
        style={{ borderTop: '1px solid var(--bg-body)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje..."
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-cards)',
            color: 'var(--text-dark)',
            border: '1.5px solid #e0e0e0',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: 40,
            height: 40,
            backgroundColor: input.trim() ? 'var(--primary-red)' : 'var(--color-inactive)',
            transition: 'background-color 0.15s',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
