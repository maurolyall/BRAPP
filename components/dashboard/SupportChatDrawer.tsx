'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabaseClient'
import ReactMarkdown from 'react-markdown'

interface SupportMessage {
  id: string
  user_id: string
  sender_id: string
  content: string
  created_at: string
  is_bot: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  currentUserId: string
}

function MessageTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    setLabel(new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  }, [iso])
  if (!label) return null
  return (
    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
      {label}
    </span>
  )
}

export default function SupportChatDrawer({ open, onClose, currentUserId }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!open || loaded) return

    supabase
      .from('support_messages')
      .select('id, user_id, sender_id, content, created_at, is_bot')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoaded(true)
      })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return

    const channel = supabase
      .channel(`support:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage
          setMessages((prev) => {
            // replace optimistic entry if same content sent by user, otherwise dedup by id
            const optimisticIdx = prev.findIndex(
              (m) => m.id.length < 36 || (!m.is_bot && m.content === newMsg.content && !prev.some((x) => x.id === newMsg.id))
            )
            if (optimisticIdx !== -1 && !newMsg.is_bot) {
              const next = [...prev]
              next[optimisticIdx] = newMsg
              return next
            }
            return prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')

    const optimisticId = crypto.randomUUID()
    const optimistic: SupportMessage = {
      id: optimisticId,
      user_id: currentUserId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      is_bot: false,
    }
    setMessages((prev) => [...prev, optimistic])

    const res = await fetch('/api/support/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (res.ok) {
      const { id: realId } = await res.json()
      // replace optimistic entry with real id so realtime dedup works
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...m, id: realId } : m))
    } else {
      console.error('support message error', await res.text())
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(content)
    }

    setSending(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed z-70 flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          left: 'max(0px, calc(50vw - 215px))',
          right: 'max(0px, calc(50vw - 215px))',
          bottom: 0,
          height: '78vh',
          backgroundColor: 'var(--bg-body)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d0d0d0' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center gap-3 mx-4 mt-2 mb-3 px-3 py-3 rounded-2xl flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary-red)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>Soporte Botón Rojo</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Asistente virtual · siempre disponible</span>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 32, height: 32, backgroundColor: 'var(--bg-body)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-4 pb-3">
          {!loaded && (
            <div className="flex justify-center items-center h-full">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary-red)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {loaded && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                ¿Tenés alguna consulta?<br />¡Escribinos!
              </span>
            </div>
          )}

          {loaded && messages.map((msg) => {
            const isOwn = !msg.is_bot
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="flex flex-col gap-1"
                  style={{ alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '82%' }}
                >
                  <div
                    className="px-3 py-2.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: isOwn ? 'var(--primary-red)' : 'var(--bg-cards)',
                      color: isOwn ? '#fff' : 'var(--text-dark)',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: isOwn ? 'none' : '0 2px 8px rgba(0,0,0,0.07)',
                    }}
                  >
                    {msg.is_bot ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mt-1 ml-4 space-y-1 list-disc">{children}</ul>,
                          li: ({ children }) => <li className="leading-snug">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
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
          className="flex items-center gap-2 px-4 pt-3 flex-shrink-0"
          style={{
            borderTop: '1px solid #ebebeb',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            backgroundColor: 'var(--bg-body)',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta..."
            className="flex-1 rounded-full px-4 py-2.5 outline-none"
            style={{
              fontSize: 16,
              backgroundColor: 'var(--bg-cards)',
              color: 'var(--text-dark)',
              border: '1.5px solid #e0e0e0',
              fontFamily: 'Comfortaa, sans-serif',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-opacity"
            style={{
              width: 42,
              height: 42,
              backgroundColor: 'var(--primary-red)',
              opacity: !input.trim() || sending ? 0.4 : 1,
            }}
          >
            {sending ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
