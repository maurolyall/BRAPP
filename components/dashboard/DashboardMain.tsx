'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isChatRoute } from './chatRoutes'

/**
 * La vista de chat va a pantalla completa (solo el header de Botón Rojo arriba),
 * así que en esa ruta el contenedor no aplica padding y estira al alto restante.
 */
export default function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChat = isChatRoute(pathname)

  // `body.chat-view` (globals.css) le da alto exacto al <main> y bloquea el
  // scroll de la página, para que el que scrollee sea el listado de mensajes.
  useEffect(() => {
    if (!isChat) return
    document.body.classList.add('chat-view')
    return () => document.body.classList.remove('chat-view')
  }, [isChat])

  return (
    <div className={isChat ? 'flex-1 flex flex-col min-h-0' : 'flex-1 px-4 pt-8 pb-40'}>
      {children}
    </div>
  )
}
