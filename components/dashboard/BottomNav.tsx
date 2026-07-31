'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types'
import { isChatRoute } from './chatRoutes'

interface BottomNavProps {
  role: UserRole
  userId: string
}

const clientItems = [
  {
    href: '/dashboard/client',
    label: 'Inicio',
    icon: (
      <svg width="26" height="19" viewBox="0 0 26 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12.5332" cy="9.5" r="9" stroke="currentColor" strokeLinejoin="round"/>
        <path d="M16.5332 10.5C16.0332 11.5 14.7423 12.5 12.5332 12.5C10.3241 12.5 9.0332 11.5 8.5332 10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M0.533802 3.5C0.367135 4.83333 0.733802 7.8 3.5338 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21.5332 10.5C22.5332 11 24.5332 12.7 24.5332 15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5332 7.5L10.5332 7.52344" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.5332 7.5L14.5332 7.52344" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/client/services',
    label: 'Servicios',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/client/activity',
    label: 'Actividad',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/client/profile',
    label: 'Perfil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const providerItems = [
  {
    href: '/dashboard/provider',
    label: 'Inicio',
    icon: (
      <svg width="26" height="19" viewBox="0 0 26 19" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12.5332" cy="9.5" r="9" stroke="currentColor" strokeLinejoin="round"/>
        <path d="M16.5332 10.5C16.0332 11.5 14.7423 12.5 12.5332 12.5C10.3241 12.5 9.0332 11.5 8.5332 10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M0.533802 3.5C0.367135 4.83333 0.733802 7.8 3.5338 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21.5332 10.5C22.5332 11 24.5332 12.7 24.5332 15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5332 7.5L10.5332 7.52344" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14.5332 7.5L14.5332 7.52344" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/provider/requests',
    label: 'Solicitudes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/provider/activity',
    label: 'Actividad',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/provider/profile',
    label: 'Perfil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const items = role === 'provider' ? providerItems : clientItems

  // La vista de chat ocupa toda la pantalla: sin nav inferior.
  if (isChatRoute(pathname)) return null

  return (
    <>
    <nav
      className="fixed bottom-4 z-40 flex items-center justify-around px-2 py-3 rounded-3xl"
      style={{
        left: 'max(1rem, calc(50vw - 215px + 1rem))',
        right: 'max(1rem, calc(50vw - 215px + 1rem))',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all"
            style={{ color: isActive ? 'var(--primary-red)' : 'var(--text-muted)' }}
          >
            {item.icon}
            <span className="text-xs font-semibold">{item.label}</span>
          </Link>
        )
      })}
    </nav>
    </>
  )
}
