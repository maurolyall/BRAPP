'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SupportChat from '@/components/dashboard/SupportChat'

interface Props {
  currentUserId: string
  categoryId: string
  categoryName: string
}

const storageKey = (categoryId: string) => `br:chat-conversation:${categoryId}`

/**
 * Vista de página del chat: se llega tocando un servicio. Envía sola el pedido
 * inicial ("Nueva solicitud Plomería") y desde ahí sigue la conversación con el
 * bot, que es quien crea la orden en MoP.
 *
 * Cada entrada desde la grilla llega con `?new=1` y arranca una conversación
 * nueva: el chat aparece vacío, sin los pedidos anteriores. El id queda en
 * sessionStorage para que un refresh siga mostrando la misma conversación.
 */
export default function ServiceChatView({ currentUserId, categoryId, categoryName }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'
  const [conversationId, setConversationId] = useState<string | null>(null)

  useEffect(() => {
    const key = storageKey(categoryId)
    const stored = isNew ? null : sessionStorage.getItem(key)
    const id = stored ?? crypto.randomUUID()
    sessionStorage.setItem(key, id)
    setConversationId(id)

    // Sacamos el `new=1` de la URL: si el usuario refresca, tiene que seguir
    // en la conversación que ya empezó, no arrancar otra.
    if (isNew) router.replace(`/dashboard/client/services/${categoryId}`, { scroll: false })
  }, [categoryId, isNew, router])

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader title={categoryName} onBack={() => router.push('/dashboard/client/services')} />

      {/* Montamos recién con el id resuelto: así el chat nunca pinta mensajes
          de otro hilo mientras lo averigua. */}
      {conversationId ? (
        <SupportChat
          key={conversationId}
          currentUserId={currentUserId}
          conversationId={conversationId}
          prefill={`Nueva solicitud ${categoryName}`}
          prefillNonce={1}
          autoSend
        />
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}

/** Barra superior fija de la conversación: volver + servicio consultado. */
function ChatHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-3 py-3"
      style={{
        backgroundColor: 'var(--bg-cards)',
        borderBottom: '1px solid #ebebeb',
        paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
      }}
    >
      <button
        onClick={onBack}
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{ width: 38, height: 38, backgroundColor: 'var(--bg-body)' }}
        aria-label="Volver a servicios"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="flex flex-col min-w-0">
        <span className="text-[15px] font-bold truncate" style={{ color: 'var(--text-dark)' }}>
          {title}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Botón Rojo · nueva solicitud
        </span>
      </div>
    </div>
  )
}
