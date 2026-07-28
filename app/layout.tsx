import type { Metadata, Viewport } from 'next'
import './globals.css'
import MobileViewport from '@/components/layout/MobileViewport'

export const metadata: Metadata = {
  title: 'Botón Rojo',
  description: 'Conectando vecinos con proveedores de servicios del hogar.',
  icons: { icon: '/favicon.png' },
}

// `resizes-content`: al abrir el teclado el viewport se achica de verdad, así
// la barra de escritura del chat queda arriba del teclado y no debajo.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <MobileViewport>{children}</MobileViewport>
      </body>
    </html>
  )
}
