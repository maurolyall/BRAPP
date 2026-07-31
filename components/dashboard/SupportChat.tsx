'use client'

import { useEffect, useRef, useState, KeyboardEvent, ChangeEvent } from 'react'
import { createClient } from '@/lib/supabaseClient'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { normalizeArPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from '@/lib/phone'
import {
  ACCEPT_ATTR,
  ALLOWED_MIME_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  MAX_TOTAL_BYTES,
  SupportAttachment,
  typeForMime,
} from '@/lib/support-attachments'

interface SupportMessage {
  id: string
  user_id: string
  sender_id: string
  content: string
  created_at: string
  is_bot: boolean
  attachments: SupportAttachment[] | null
  conversation_id: string | null
}

interface PendingFile {
  id: string
  file: File
  previewUrl: string
}

interface Props {
  currentUserId: string
  /**
   * Hilo a mostrar. Con id, la vista arranca vacía y solo muestra los mensajes
   * de esta conversación: entrar a un servicio no trae el historial viejo.
   * Sin id se muestra todo el hilo del usuario.
   */
  conversationId?: string
  /** Texto inicial de la conversación. */
  prefill?: string
  /** Cambia para reaplicar el mismo prefill. */
  prefillNonce?: number
  /** Si es true, el prefill se envía solo en vez de quedar en la barra. */
  autoSend?: boolean
}

const SELECT_COLUMNS =
  'id, user_id, sender_id, content, created_at, is_bot, attachments, conversation_id'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      // el contrato de MoP pide base64 crudo, sin el prefijo data:...;base64,
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
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

function FileIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function AttachmentList({
  attachments,
  isOwn,
  onImageLoad,
}: {
  attachments: SupportAttachment[]
  isOwn: boolean
  onImageLoad?: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {attachments.map((att, i) =>
        att.type === 'image' ? (
          <a key={`${att.url}-${i}`} href={att.url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={att.url}
              alt={att.filename ?? 'Imagen adjunta'}
              className="rounded-xl object-cover"
              style={{ maxWidth: '100%', maxHeight: 220 }}
              onLoad={onImageLoad}
            />
          </a>
        ) : (
          <a
            key={`${att.url}-${i}`}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.filename}
            className="flex items-center gap-2 rounded-xl px-2.5 py-2"
            style={{
              backgroundColor: isOwn ? 'rgba(255,255,255,0.18)' : 'var(--bg-body)',
              color: isOwn ? '#fff' : 'var(--text-dark)',
            }}
          >
            <FileIcon color={isOwn ? '#fff' : 'var(--primary-red)'} />
            <span className="text-xs truncate" style={{ maxWidth: 180 }}>
              {att.filename ?? 'Documento'}
            </span>
          </a>
        )
      )}
    </div>
  )
}

/**
 * La conversación ocupa toda la pantalla debajo del header de Botón Rojo: es la
 * vía por la que se generan las solicitudes, así que no compite con nada más.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col min-h-0">{children}</div>
}

export default function SupportChat({
  currentUserId,
  conversationId,
  prefill,
  prefillNonce,
  autoSend = false,
}: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState<PendingFile[]>([])
  const [attachError, setAttachError] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  // undefined = todavía no lo consultamos; null = el usuario no tiene teléfono
  const [savedPhone, setSavedPhone] = useState<string | null | undefined>(undefined)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  // false cuando el usuario subió a leer historial: ahí no lo movemos.
  const stickToBottom = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const optimisticIds = useRef<Set<string>>(new Set())
  const supabase = createClient()
  const waitingForReply = loaded && messages.length > 0 && !messages[messages.length - 1].is_bot && !sending
  const canSend = (input.trim().length > 0 || pending.length > 0) && !sending
  // Sin teléfono, MoP no puede vincular las órdenes del bot con este usuario:
  // los eventos mop.order.* identifican al cliente por número, no por id.
  const needsPhone = savedPhone === null

  useEffect(() => {
    if (loaded) return

    const query = supabase
      .from('support_messages')
      .select(SELECT_COLUMNS)
      .eq('user_id', currentUserId)

    // Con conversación abierta solo traemos su hilo; el historial anterior
    // (otras conversaciones, o los mensajes viejos sin id) queda afuera.
    if (conversationId) query.eq('conversation_id', conversationId)

    query
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as SupportMessage[]) ?? [])
        setLoaded(true)
      })

    supabase
      .from('profiles')
      .select('phone')
      .eq('id', currentUserId)
      .single()
      .then(({ data }) => setSavedPhone(normalizeArPhone(data?.phone) ?? null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePhone = async () => {
    const normalized = normalizeArPhone(phoneInput)
    if (!normalized) {
      setPhoneError(PHONE_ERROR)
      return
    }
    setPhoneError('')
    setSavingPhone(true)

    const { error } = await supabase
      .from('profiles')
      .update({ phone: normalized, updated_at: new Date().toISOString() })
      .eq('id', currentUserId)

    setSavingPhone(false)
    if (error) {
      setPhoneError('No pudimos guardar tu número. Probá de nuevo.')
      return
    }
    setSavedPhone(normalized)
    setPhoneInput('')
  }

  useEffect(() => {

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
          // Realtime filtra por user_id nomás: descartamos lo que caiga en
          // otro hilo (p. ej. el chat abierto en otra pestaña).
          if (conversationId && newMsg.conversation_id !== conversationId) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev

            // Si el POST todavía no respondió, reemplazamos la entrada optimista
            // equivalente en vez de duplicar el mensaje.
            if (!newMsg.is_bot) {
              const idx = prev.findIndex(
                (m) =>
                  optimisticIds.current.has(m.id) &&
                  m.content === newMsg.content &&
                  (m.attachments?.length ?? 0) === (newMsg.attachments?.length ?? 0)
              )
              if (idx !== -1) {
                optimisticIds.current.delete(prev[idx].id)
                const next = [...prev]
                next[idx] = newMsg
                return next
              }
            }
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Precarga el mensaje inicial (ej. "Nueva solicitud Plomería").
  useEffect(() => {
    if (prefill) setInput(prefill)
  }, [prefillNonce]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Auto-envío del prefill. Espera a que el historial esté cargado y a que haya
   * teléfono (si falta, primero se pide y se envía cuando lo cargue). El ref
   * evita el doble disparo del StrictMode y los reenvíos por re-render.
   */
  const autoSentFor = useRef<number | null>(null)
  useEffect(() => {
    if (!autoSend || !prefill || !loaded) return
    if (needsPhone || savedPhone === undefined) return
    if (autoSentFor.current === (prefillNonce ?? 0)) return
    // No reenviar si la conversación ya tiene mensajes
    if (messages.length > 0) return
    autoSentFor.current = prefillNonce ?? 0
    sendMessage(prefill)
  }, [autoSend, prefill, prefillNonce, loaded, needsPhone, savedPhone, messages.length]) // eslint-disable-line react-hooks/exhaustive-deps


  /**
   * Pegado al fondo. Corre después de cada render, así el listado queda abajo
   * pase lo que pase: al entrar, cuando carga el historial, cuando crece la
   * barra de escritura (adjuntos) y cuando llega un mensaje nuevo. Se desactiva
   * si el usuario sube a leer historial.
   */
  useEffect(() => {
    if (!stickToBottom.current) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  /**
   * Las imágenes ocupan alto recién cuando cargan, así que corren el contenido
   * después del render. Reajustamos solo si el usuario ya estaba mirando el
   * final, para no arrancarlo de donde estaba leyendo.
   */
  const handleAttachmentLoad = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) el.scrollTop = el.scrollHeight
  }

  // Liberar los object URLs de las previsualizaciones al desmontar
  const pendingRef = useRef<PendingFile[]>([])
  pendingRef.current = pending
  useEffect(() => {
    return () => { pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)) }
  }, [])

  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setAttachError('')
    const accepted: PendingFile[] = []
    let total = pending.reduce((sum, p) => sum + p.file.size, 0)

    for (const file of files) {
      if (!(file.type in ALLOWED_MIME_TYPES)) {
        setAttachError('Solo podés adjuntar imágenes o PDFs')
        continue
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setAttachError(`"${file.name}" supera los ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB`)
        continue
      }
      if (pending.length + accepted.length >= MAX_ATTACHMENTS) {
        setAttachError(`Máximo ${MAX_ATTACHMENTS} archivos por mensaje`)
        break
      }
      if (total + file.size > MAX_TOTAL_BYTES) {
        setAttachError(`Los adjuntos no pueden superar los ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB en total`)
        break
      }
      total += file.size
      accepted.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) })
    }

    if (accepted.length > 0) setPending((prev) => [...prev, ...accepted])
  }

  const removePending = (id: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
    setAttachError('')
  }

  const sendMessage = async (override?: string) => {
    const content = (override ?? input).trim()
    const files = pending
    if ((!content && files.length === 0) || sending) return

    setSending(true)
    setInput('')
    setPending([])
    setAttachError('')

    const optimisticId = crypto.randomUUID()
    optimisticIds.current.add(optimisticId)
    const optimistic: SupportMessage = {
      id: optimisticId,
      user_id: currentUserId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      is_bot: false,
      conversation_id: conversationId ?? null,
      attachments: files.length
        ? files.map((f) => ({
            type: typeForMime(f.file.type),
            url: f.previewUrl,
            mime: f.file.type,
            filename: f.file.name,
          }))
        : null,
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const attachments = await Promise.all(
        files.map(async (f) => ({
          type: typeForMime(f.file.type),
          data: await fileToBase64(f.file),
          mime: f.file.type,
          filename: f.file.name,
        }))
      )

      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          ...(conversationId && { conversationId }),
          ...(attachments.length > 0 && { attachments }),
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const { message } = await res.json()
      optimisticIds.current.delete(optimisticId)
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
      // reemplazamos la entrada optimista por la fila real (ids y URLs definitivas)
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev.filter((m) => m.id !== optimisticId)
        return prev.map((m) => (m.id === optimisticId ? (message as SupportMessage) : m))
      })
    } catch (err) {
      console.error('support message error', err)
      optimisticIds.current.delete(optimisticId)
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(content)
      setPending(files.map((f) => ({ ...f, previewUrl: URL.createObjectURL(f.file) })))
      setAttachError('No pudimos enviar el mensaje. Probá de nuevo.')
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
    <Shell>
        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-2 px-4 py-3"
        >
          {!loaded && (
            <div className="flex justify-center items-center h-full">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary-red)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {/* Con autoSend el primer mensaje sale solo: mostrar "escribinos"
              en ese hueco sería un parpadeo. */}
          {loaded && messages.length === 0 && !autoSend && (
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
            const attachments = msg.attachments ?? []
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="flex flex-col gap-1"
                  style={{ alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '82%' }}
                >
                  <div
                    className="px-3 py-2.5 text-sm leading-relaxed flex flex-col gap-2"
                    style={{
                      backgroundColor: isOwn ? 'var(--primary-red)' : 'var(--bg-cards)',
                      color: isOwn ? '#fff' : 'var(--text-dark)',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: isOwn ? 'none' : '0 2px 8px rgba(0,0,0,0.07)',
                    }}
                  >
                    {attachments.length > 0 && (
                      <AttachmentList attachments={attachments} isOwn={isOwn} onImageLoad={handleAttachmentLoad} />
                    )}
                    {msg.content && (msg.is_bot ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mt-1 ml-4 space-y-1 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mt-1 ml-4 space-y-1 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="leading-snug">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children, className }) => {
                            const isBlock = className?.includes('language-')
                            return isBlock ? (
                              <code className="block bg-gray-100 rounded p-2 text-xs my-1 overflow-x-auto">{children}</code>
                            ) : (
                              <code className="bg-gray-100 rounded px-1 text-xs">{children}</code>
                            )
                          },
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--primary-red)' }}>{children}</a>
                          ),
                          br: () => <br />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <span>{msg.content}</span>
                    ))}
                  </div>
                  <MessageTime iso={msg.created_at} />
                </div>
              </div>
            )
          })}
          {waitingForReply && (
            <div className="flex justify-start">
              <div
                className="flex flex-col gap-1"
                style={{ alignItems: 'flex-start', maxWidth: '82%' }}
              >
                <div
                  className="px-3 py-3 flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--bg-cards)',
                    borderRadius: '18px 18px 18px 4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  }}
                >
                  <span className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                  <span className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                  <span className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: último tramo de la columna de alto fijo, así que queda
            siempre abajo sin taparle contenido al listado. */}
        <div
          className="flex-shrink-0 z-10"
          style={{ backgroundColor: 'var(--bg-body)' }}
        >
        {/* Adjuntos pendientes */}
        {!needsPhone && (pending.length > 0 || attachError) && (
          <div className="px-4 pb-2 flex-shrink-0">
            {pending.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden"
                    style={{ width: 64, height: 64, backgroundColor: 'var(--bg-cards)', border: '1px solid #e0e0e0' }}
                  >
                    {p.file.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.previewUrl} alt={p.file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-1">
                        <FileIcon color="var(--primary-red)" />
                        <span className="text-[9px] truncate w-full text-center" style={{ color: 'var(--text-muted)' }}>
                          {p.file.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removePending(p.id)}
                      className="absolute top-0.5 right-0.5 flex items-center justify-center rounded-full"
                      style={{ width: 18, height: 18, backgroundColor: 'rgba(0,0,0,0.55)' }}
                      aria-label="Quitar adjunto"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {attachError && (
              <span className="text-[11px]" style={{ color: 'var(--primary-red)' }}>{attachError}</span>
            )}
          </div>
        )}

        {/* Pedido de WhatsApp — reemplaza la barra de escritura hasta que haya
            número, porque sin él MoP no puede vincular las órdenes del bot. */}
        {needsPhone ? (
          <div
            className="flex flex-col gap-2 px-4 pt-3 flex-shrink-0"
            style={{
              borderTop: '1px solid #ebebeb',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              backgroundColor: 'var(--bg-body)',
            }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
              Antes de empezar, dejanos tu WhatsApp
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Lo usamos para identificarte y que puedas seguir tus solicitudes desde la app.
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="flex items-center px-3 rounded-full text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-cards)', border: '1.5px solid #e0e0e0', color: 'var(--text-dark)', height: 42 }}
              >
                +54 9
              </div>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => { setPhoneInput(e.target.value); setPhoneError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSavePhone() } }}
                placeholder={PHONE_PLACEHOLDER}
                className="flex-1 min-w-0 rounded-full px-4 outline-none"
                style={{
                  fontSize: 16,
                  height: 42,
                  backgroundColor: 'var(--bg-cards)',
                  color: 'var(--text-dark)',
                  border: `1.5px solid ${phoneError ? 'var(--primary-red)' : '#e0e0e0'}`,
                  fontFamily: 'Comfortaa, sans-serif',
                }}
              />
              <button
                onClick={handleSavePhone}
                disabled={!phoneInput.trim() || savingPhone}
                className="flex-shrink-0 flex items-center justify-center rounded-full transition-opacity"
                style={{
                  width: 42,
                  height: 42,
                  backgroundColor: 'var(--primary-red)',
                  opacity: !phoneInput.trim() || savingPhone ? 0.4 : 1,
                }}
                aria-label="Guardar número"
              >
                {savingPhone ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </div>
            {phoneError && (
              <span className="text-[11px]" style={{ color: 'var(--primary-red)' }}>{phoneError}</span>
            )}
          </div>
        ) : (
        /* Input */
        <div
          className="flex items-center gap-2 px-4 pt-3 flex-shrink-0"
          style={{
            borderTop: '1px solid #ebebeb',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            backgroundColor: 'var(--bg-body)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 42,
              height: 42,
              backgroundColor: 'var(--bg-cards)',
              border: '1.5px solid #e0e0e0',
              opacity: sending ? 0.4 : 1,
            }}
            aria-label="Adjuntar archivo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta..."
            className="flex-1 min-w-0 rounded-full px-4 py-2.5 outline-none"
            style={{
              fontSize: 16,
              backgroundColor: 'var(--bg-cards)',
              color: 'var(--text-dark)',
              border: '1.5px solid #e0e0e0',
              fontFamily: 'Comfortaa, sans-serif',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!canSend}
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-opacity"
            style={{
              width: 42,
              height: 42,
              backgroundColor: 'var(--primary-red)',
              opacity: canSend ? 1 : 0.4,
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
        )}
        </div>
    </Shell>
  )
}
