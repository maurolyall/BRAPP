import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Botón Rojo',
  description: 'Conectando vecinos con proveedores de servicios del hogar.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
