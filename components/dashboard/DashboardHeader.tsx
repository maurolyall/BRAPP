'use client'

import { usePathname } from 'next/navigation'
import PublicHeader from '@/components/layout/PublicHeader'
import { isChatRoute } from './chatRoutes'

/**
 * En la conversación el header grande de Botón Rojo se come media pantalla, y
 * ahí lo que importa es el hilo: la vista de chat pone su propia barra (volver
 * + servicio), así que acá no renderizamos nada.
 */
export default function DashboardHeader() {
  const pathname = usePathname()
  if (isChatRoute(pathname)) return null
  return <PublicHeader logoHref="/dashboard" />
}
